import json
import logging
import time

from openai import AsyncOpenAI

from agents import organizer_store as store
from agents.bus import emit
from agents.settings import get_settings
from agents.state import KINDS, GraphState, Note, Notepad, note_id

logger = logging.getLogger("agents.notetaker")

# A pad longer than this is a transcript with extra steps. The job is choosing.
MAX_NOTES = 8

SYSTEM_PROMPT = """Sos el Notetaker de una reunión de producto. Llevás un bloc de notas al costado de la pizarra, y lo único que hacés es decidir qué merece quedar escrito y qué no.

No dibujás en la pizarra. No opinás sobre la reunión. No le hablás a nadie. Escribís notas.

QUÉ RECIBÍS:
- `instrucciones`: lo que el equipo pidió antes de empezar. Es lo que define qué es importante en ESTA reunión. Si dice que el foco es el cobro, una nota sobre el cobro pesa más que una igual de buena sobre otra cosa.
- `de_que_se_habla`: el resumen vivo de la conversación.
- `puntos`: todo lo que se dijo que vale algo, de todos los que hablaron, con quién lo dijo.
- `bloc_anterior`: las notas que vos ya escribiste, numeradas.

CÓMO TRABAJÁS:
- `bloc_anterior` es tu memoria. Lo que no quede ahí, se pierde.
- No reescribas una nota que no cambió: nombrala por su número en `keep`.
- En `add` van solo notas nuevas.
- Para corregir una nota: dejala afuera de `keep` y escribí la buena en `add`.
- Máximo 8 notas en total. Si llegás a 8 y aparece algo mejor, sacá la más floja.

QUÉ ES UNA NOTA:
Algo que alguien va a querer leer mañana, cuando ya no se acuerde de la reunión.
- `title`: 3 a 6 palabras. Que se entienda sola de un vistazo.
- `body`: una o dos frases. Qué se dijo y por qué importa.
- `author`: quién lo dijo.
- `kind`: `decision`, `pregunta`, `pendiente` o `idea`.
- `weight`: de 1 a 5, cuánto importa comparado con el resto del bloc. Un 5 es algo que cambia el rumbo del proyecto. Un 1 es un detalle que anotás por las dudas. No pongas todo en 4: si todo importa, nada importa.

REGLA DURA — NO INVENTAR:
- Todo lo que escribas tiene que rastrearse a algo que alguien dijo.
- No completes ideas, no agregues tecnologías ni nombres que no aparecieron.
- Si todavía no se dijo nada que valga una nota, devolvé `keep` con todos los números y `add` vacío. Es una respuesta correcta.

Formato de salida (JSON, sin prosa alrededor):
{
  "keep": [1, 2],
  "add": [
    {"title": "tres a seis palabras", "body": "una o dos frases", "author": "quién", "kind": "idea", "weight": 3}
  ]
}"""


def _text(v) -> str:
    return v.strip() if isinstance(v, str) else ""


def _weight(v) -> int:
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        return 3
    return max(1, min(5, int(v)))


def _rebuild(data: dict, previous: list[Note]) -> list[Note] | None:
    """Builds the new pad out of the numbers kept and the notes added.

    Returns None when the answer was too broken to act on, so the pad keeps
    what it already had. A model under load returns strings, nulls and
    half-built objects here; anything unreadable is dropped, never guessed."""
    keep = data.get("keep")
    add = data.get("add")
    if not isinstance(keep, list) and not isinstance(add, list):
        return None

    out: list[Note] = []
    seen: set[str] = set()

    for n in keep if isinstance(keep, list) else []:
        if not isinstance(n, int) or isinstance(n, bool):
            continue
        if not 1 <= n <= len(previous):
            continue
        note = previous[n - 1]
        if note["id"] in seen:
            continue
        seen.add(note["id"])
        out.append(note)

    for item in add if isinstance(add, list) else []:
        if not isinstance(item, dict):
            continue
        title = _text(item.get("title"))
        if not title:
            continue
        nid = note_id(title)
        if nid in seen:
            continue
        seen.add(nid)
        kind = _text(item.get("kind")).lower()
        out.append(
            {
                "id": nid,
                "title": title,
                "body": _text(item.get("body")),
                "author": _text(item.get("author")),
                "kind": kind if kind in KINDS else "idea",
                "weight": _weight(item.get("weight")),
            }
        )

    # Emptying a pad that had notes in it is never something the model was
    # asked to do — it is told to keep every number when there is nothing new.
    # Losing the meeting's notes costs far more than carrying a stale one.
    if not out and previous:
        return None

    # The pad is ordered by what matters, not by when it was written. Python's
    # sort is stable, so notes of equal weight keep the order the model chose.
    out.sort(key=lambda note: -note["weight"])
    return out[:MAX_NOTES]


async def notetaker(state: GraphState) -> dict:
    """Rewrites the running pad over everything the room has said so far."""
    settings = get_settings()
    if not settings.openai_api_key:
        return {}

    session_id = state["session_id"]
    session = store.get(session_id)
    previous = session.notepad

    payload = {
        "instrucciones": session.brief,
        "de_que_se_habla": state["digest"]["summary"],
        "puntos": [
            {"text": p["text"], "author": p["author"], "kind": p["kind"]}
            for p in state["routes"]["notetaker"]
        ],
        "bloc_anterior": [
            {
                "n": i,
                "title": note["title"],
                "body": note["body"],
                "author": note["author"],
                "kind": note["kind"],
                "weight": note["weight"],
            }
            for i, note in enumerate(previous["notes"], start=1)
        ],
    }

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    started = time.time()
    try:
        resp = await client.chat.completions.create(
            model=settings.openai_notetaker_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        data = json.loads(resp.choices[0].message.content or "{}")
    except Exception:
        logger.exception("notetaker failed; keeping previous pad")
        return {}

    if not isinstance(data, dict):
        data = {}

    notes = _rebuild(data, previous["notes"])
    if notes is None:
        return {}
    if [n["id"] for n in notes] == [n["id"] for n in previous["notes"]]:
        return {}

    notepad: Notepad = {"notes": notes, "revision": previous["revision"] + 1}
    store.set_notepad(session_id, notepad)

    await emit(
        session_id,
        "notetaker.pad",
        {
            "revision": notepad["revision"],
            "notes": notepad["notes"],
            "took": round(time.time() - started, 2),
        },
    )
    return {}
