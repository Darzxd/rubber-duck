import json
import logging
import time

from openai import AsyncOpenAI

from agents import canvas
from agents import organizer_store as store
from agents import repo
from agents.bus import emit
from agents.settings import get_settings
from agents.state import GraphState, Point

logger = logging.getLogger("agents.architect")

MAX_GROUPS = 4
MAX_PER_GROUP = 5
MAX_WORDS = 4

SYSTEM_PROMPT = """Sos el Architect de una pizarra que se llena sola mientras un equipo habla. Recibís las ideas que se dijeron, cada una con su id, y armás el esquema: qué va con qué, y cómo se relacionan.

No dibujás. Decidís la estructura. Las coordenadas las pone otro.

QUÉ RECIBÍS:
- `contexto`: el resumen vivo de la conversación.
- `ideas`: lo que se dijo, cada una con su `id`. Son las únicas que podés poner en la pizarra.
- `repo`: a veces, cómo está armado el proyecto del equipo. Te sirve para agrupar: si dos ideas caen en la misma parte del sistema, van juntas. Nada más. No es una idea, no va a la pizarra, no lo menciones en ningún título.

CÓMO ARMÁS EL ESQUEMA:
- Agrupá las ideas por tema. Un grupo es una columna de la pizarra.
- Máximo 4 grupos. Máximo 5 notas por grupo.
- Cada nota es UNA idea, nombrada por su `id`. No juntes dos ideas en una nota, no partas una en dos.
- Si todo lo que hay es del mismo tema, un solo grupo es la respuesta correcta.

CÓMO ESCRIBÍS UNA NOTA:
- `texto`: de 1 a 4 palabras. Es el título de la idea, no la idea entera. "Usar Stripe", "Límite plan gratis", "Registrar dominio".
- Nunca una frase. Nunca un verbo conjugado largo. Si no entra en 4 palabras, elegí las 4 que importan.
- Si una decisión y lo que la causó son dos ideas distintas, son dos notas distintas.

FLECHAS:
- Conectá dos notas solo si la relación se dijo o se desprende directo de cómo se dijo: una lleva a la otra, una depende de la otra, una se opone a la otra, una es la causa de la otra.
- Que dos ideas aparezcan en la misma charla NO es una relación. Dos flechas ciertas valen más que diez inventadas. `flechas` vacío es una respuesta correcta.
- `texto` de la flecha: 1 o 2 palabras, o vacío.

REGLA DURA — NO INVENTAR:
- Toda nota es una idea de la lista, nombrada por su id. No agregues ideas, tecnologías ni nombres que no aparecieron.
- El título del grupo y el título general sí los escribís vos, pero describen lo que hay, no lo que falta.

Formato de salida (JSON, sin prosa alrededor):
{
  "titulo": "2 a 4 palabras",
  "grupos": [
    {"titulo": "1 a 3 palabras", "notas": [{"idea": "id_de_la_idea", "texto": "1 a 4 palabras"}]}
  ],
  "flechas": [{"de": "id_origen", "a": "id_destino", "texto": "necesita"}]
}"""


# Cutting a title at the word limit can leave it hanging on a connector, which
# reads as a bug rather than as a short title.
DANGLING = {"y", "e", "o", "u", "de", "del", "en", "para", "con", "a", "la", "el"}


def _words(v, limit: int) -> str:
    if not isinstance(v, str):
        return ""
    words = v.split()[:limit]
    while words and words[-1].lower() in DANGLING:
        words.pop()
    return " ".join(words)


# What a note says it is comes from the Organizer, which already decided it
# while writing the summary. Asked to label it again the Architect calls
# everything an idea, and it has no more evidence than the Organizer had.
KIND_STYLE = {
    "decision": "decision",
    "idea": "idea",
    "pendiente": "tarea",
    "pregunta": "duda",
}


def _fallback(point: Point) -> canvas.PlannedNote:
    """A note for an idea the model left out, written without adding anything.

    The board is replaced whole on every revision, so an idea silently dropped
    is an idea that disappears off the screen while somebody is reading it."""
    return {
        "id": point["id"],
        "text": _words(point["text"], MAX_WORDS),
        "kind": KIND_STYLE.get(point["kind"], "idea"),
    }


def _plan(data: dict, points: list[Point]) -> tuple[str, list, list]:
    """Reads the model's plan, keeping only what maps onto real ideas."""
    by_id = {p["id"]: p for p in points}
    placed: set[str] = set()
    groups: list[canvas.PlannedGroup] = []

    raw_groups = data.get("grupos")
    for item in (raw_groups if isinstance(raw_groups, list) else [])[:MAX_GROUPS]:
        if not isinstance(item, dict):
            continue
        notes: list[canvas.PlannedNote] = []
        raw_notes = item.get("notas")
        for entry in (raw_notes if isinstance(raw_notes, list) else [])[
            :MAX_PER_GROUP
        ]:
            if not isinstance(entry, dict):
                continue
            idea = entry.get("idea")
            if not isinstance(idea, str) or idea not in by_id or idea in placed:
                continue
            text = _words(entry.get("texto"), MAX_WORDS)
            placed.add(idea)
            notes.append(
                {
                    "id": idea,
                    "text": text or _words(by_id[idea]["text"], MAX_WORDS),
                    "kind": KIND_STYLE.get(by_id[idea]["kind"], "idea"),
                }
            )
        if notes:
            groups.append({"title": _words(item.get("titulo"), 3), "notes": notes})

    left = [_fallback(p) for p in points if p["id"] not in placed]
    if left:
        # Their own column rather than tacked onto somebody else's theme: the
        # model did not say they belong there.
        if len(groups) < MAX_GROUPS:
            groups.append({"title": "Suelto" if groups else "", "notes": left})
        else:
            groups[-1]["notes"].extend(left)

    arrows: list[canvas.PlannedArrow] = []
    seen: set[tuple[str, str]] = set()
    raw_arrows = data.get("flechas")
    for item in raw_arrows if isinstance(raw_arrows, list) else []:
        if not isinstance(item, dict):
            continue
        source, target = item.get("de"), item.get("a")
        if not isinstance(source, str) or not isinstance(target, str):
            continue
        if source not in placed or target not in placed or source == target:
            continue
        if (source, target) in seen or (target, source) in seen:
            continue
        seen.add((source, target))
        arrows.append(
            {
                "source": source,
                "target": target,
                "label": _words(item.get("texto"), 2),
            }
        )

    return _words(data.get("titulo"), 4), groups, arrows


async def _draw(session_id: str, revision: int, elements: list[dict]) -> None:
    store.set_board(session_id, revision, elements)
    await emit(
        session_id,
        "architect.draw",
        {
            "revision": revision,
            # This is the complete state of the board, not an addition.
            "replace": True,
            "elements": elements,
        },
    )


async def architect(state: GraphState) -> dict:
    digest = state["digest"]
    # Only what the Orchestrator sent here. Questions and pending items are
    # somebody else's list, not a node on the board.
    points = state["routes"]["architect"]
    session_id = state["session_id"]
    revision = digest["revision"]
    if not points:
        return {}

    settings = get_settings()
    data: dict = {}
    started = time.time()
    if settings.openai_api_key:
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        try:
            resp = await client.chat.completions.create(
                model=settings.openai_architect_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "contexto": digest["summary"],
                                "repo": repo.summary(store.get(session_id).repo),
                                "ideas": [
                                    {"id": p["id"], "text": p["text"]}
                                    for p in points
                                ],
                            },
                            ensure_ascii=False,
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
            parsed = json.loads(resp.choices[0].message.content or "{}")
            if isinstance(parsed, dict):
                data = parsed
        except Exception:
            # One column of plain notes still beats an empty board.
            logger.exception("architect plan failed; drawing the ideas flat")

    title, groups, arrows = _plan(data, points)
    elements = canvas.build(title, groups, arrows)
    logger.info(
        "architect rev=%s groups=%s notes=%s arrows=%s in %.2fs",
        revision,
        len(groups),
        len(points),
        len(arrows),
        time.time() - started,
    )
    await _draw(session_id, revision, elements)
    return {}
