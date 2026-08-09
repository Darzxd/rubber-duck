import json
import logging
import time

from openai import AsyncOpenAI

from agents import organizer_store as store
from agents.bus import emit
from agents.settings import get_settings
from agents.state import GraphState, Point

logger = logging.getLogger("agents.critic")

# The panel holds a few notes, and a critic that answers everything is a critic
# nobody reads.
MAX_NOTES = 4
MAX_WORDS = 18

SYSTEM_PROMPT = """Sos el Critic. El equipo está hablando y proponiendo cosas; vos tenés el repo del proyecto delante. Tu trabajo es avisar cuando lo que se propone choca con lo que ya está escrito, o confirmar que ya existe.

QUÉ RECIBÍS:
- `repo`: cómo se llama, de qué es, y la lista de archivos que tiene.
- `propuestas`: lo que alguien acaba de proponer, cada una con su `id`.

REGLA DURA — SIN EVIDENCIA NO HAY NOTA:
- Toda nota tuya nombra UN archivo de la lista, copiado tal cual. Si no podés señalar un archivo, no escribís la nota.
- No inventes archivos. No adivines rutas que "deberían" existir. Si el repo no tiene nada que ver con la propuesta, no hay nota y está perfecto.
- No opines sobre si la idea es buena. No sugieras alternativas.
- NUNCA escribas que algo no está. "No hay nada de pagos en el repo" no es una nota: es la ausencia de una nota. Si buscaste y no encontraste, esa propuesta simplemente no aparece en tu respuesta. Adjuntar un archivo cualquiera para poder decir que algo falta es la peor cosa que podés hacer, porque el archivo queda pareciendo evidencia de algo que no dice.
- El archivo que nombrás tiene que ser el archivo del que estás hablando. No es un adjunto: es la prueba.
- No repitas la ruta dentro del texto, ya se muestra al lado.
- Una lista de archivos dice cómo se llaman las cosas, no cómo funcionan por dentro. No afirmes qué hace un archivo más allá de lo que su nombre y su ubicación dicen.

CUÁNDO SÍ ESCRIBÍS:
- `existe`: lo que proponen ya está hecho. Proponen "guardar sesiones" y hay `lib/sessions.ts`.
- `choca`: lo que proponen convive mal con algo que ya está. Proponen Stripe y hay `lib/payments/mercadopago.ts`.

CÓMO ESCRIBÍS:
- `texto`: una línea, máximo 18 palabras, en español. Directo, sin rodeos, sin saludar. "Ya hay integración con MercadoPago." No "Me parece importante señalar que...".
- Máximo 4 notas. Si solo una vale la pena, una sola. Cero es una respuesta correcta y frecuente.

Formato de salida (JSON, sin prosa alrededor):
{"notas": [{"propuesta": "id_de_la_propuesta", "texto": "una línea", "archivo": "ruta/exacta/del/repo.ts", "tipo": "existe"}]}"""


def _words(v, limit: int) -> str:
    if not isinstance(v, str):
        return ""
    return " ".join(v.split()[:limit])


# A note that reports an absence cannot be evidenced by a file, so the model
# reaches for whichever path is nearest and the note ends up pointing at
# something that does not back it. Told not to, it does it anyway; caught here,
# it cannot.
_ABSENCE = (
    "no hay", "no existe", "no se encontr", "no aparece", "no está", "no esta",
    "no tiene", "no cuenta con", "no figura", "no incluye", "falta", "no se ve",
    "no hay ningún", "ningún archivo", "ninguna referencia",
)


def _without_path(text: str, path: str) -> str:
    """The path is printed beside the note, so inside it is said twice."""
    for form in (path, path.rsplit("/", 1)[-1]):
        for lead in (f" en {form}", f" de {form}", f" dentro de {form}", f" {form}"):
            text = text.replace(lead, "")
    text = " ".join(text.split()).rstrip(" ,;:")
    if text and text[-1] not in ".!?":
        text += "."
    return text


def _reports_absence(text: str) -> bool:
    head = text.strip().lower()
    return any(head.startswith(p) for p in _ABSENCE) or any(
        f" {p}" in head for p in ("no hay ", "no existe ", "no se encontr")
    )


def _read(data: dict, points: list[Point], files: set[str]) -> list[dict]:
    """Keeps only the notes that point at a file the repo actually has.

    This is what makes the hard rule hold: the model can claim whatever it
    likes, but a path it invented is not in `files`, so the note never exists."""
    by_id = {p["id"]: p for p in points}
    notes: list[dict] = []
    seen: set[str] = set()

    raw = data.get("notas")
    for item in (raw if isinstance(raw, list) else [])[:MAX_NOTES]:
        if not isinstance(item, dict):
            continue
        path = item.get("archivo")
        if not isinstance(path, str) or path.strip() not in files:
            continue
        text = _words(item.get("texto"), MAX_WORDS)
        if not text or _reports_absence(text):
            continue
        point = item.get("propuesta")
        if not isinstance(point, str) or point not in by_id:
            continue
        if point in seen:
            continue
        seen.add(point)
        stance = item.get("tipo")
        notes.append(
            {
                "id": f"c_{point}",
                "point": point,
                "about": by_id[point]["text"],
                "text": _without_path(text, path.strip()),
                "path": path.strip(),
                "stance": stance if stance in ("existe", "choca") else "existe",
            }
        )
    return notes


async def critic(state: GraphState) -> dict:
    session_id = state["session_id"]
    revision = state["digest"]["revision"]
    points = state["routes"]["critic"]
    index = store.get(session_id).repo

    # Without a repo there is no evidence to find, and a critic with no
    # evidence has nothing to say. It stays quiet instead of guessing.
    if not points or not index:
        return {}

    settings = get_settings()
    if not settings.openai_api_key:
        return {}

    files = set(index["files"])
    started = time.time()
    data: dict = {}
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    try:
        resp = await client.chat.completions.create(
            model=settings.openai_critic_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "repo": {
                                "nombre": f"{index['owner']}/{index['name']}",
                                "descripcion": index["description"],
                                "lenguaje": index["language"],
                                "archivos": index["files"],
                            },
                            "propuestas": [
                                {"id": p["id"], "text": p["text"]} for p in points
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
        # Saying nothing is the correct failure for this agent: a note it could
        # not verify is exactly what it is not allowed to write.
        logger.exception("critic failed; staying quiet")
        return {}

    notes = _read(data, points, files)
    logger.info(
        "critic rev=%s checked=%s notes=%s in %.2fs",
        revision,
        len(points),
        len(notes),
        time.time() - started,
    )
    if not notes:
        return {}

    # The whole panel, not the delta: the front should never have to merge.
    everything = store.add_critic_notes(session_id, revision, notes)
    await emit(session_id, "critic.notes", {"revision": revision, "notes": everything})
    return {}
