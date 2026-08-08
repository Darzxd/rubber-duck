import json
import logging
import re
import time

from openai import AsyncOpenAI

from agents import organizer_store as store
from agents.bus import emit
from agents.settings import get_settings
from agents.state import KINDS, Digest, Point, TranscriptChunk, point_id

logger = logging.getLogger("agents.organizer")

# Cheap filter — laughter and lone fillers never reach the model. This is the
# only judgement the Organizer makes about what people say.
_LAUGH = re.compile(r"^(ja|ha|je|he|ji|jo|ho|xd)+[.!?,;:]*$", re.IGNORECASE)
_FILLERS = {
    "si", "sí", "no", "ok", "okay", "vale", "eh", "ehh", "hmm", "aha",
    "ajá", "ya", "bueno", "claro", "listo", "hola", "chao", "adiós",
    "mm", "mhm", "uf", "uy", "ah", "oh", "eee", "pues",
    "dale", "obvio", "exacto", "perfecto", "genial", "nada",
}

# A summary longer than this stops being a summary.
MAX_POINTS = 10

# A few lines of run-up, so a fragment that starts mid-sentence still has
# something to attach to. The running summary is the real memory.
TAIL_CHUNKS = 8


def is_noise(chunk: TranscriptChunk) -> bool:
    text = chunk["text"].strip().lower()
    if not text:
        return True
    if _LAUGH.match(text):
        return True
    stripped = text.rstrip("¿?¡!.,;: ")
    words = stripped.split()
    if len(words) <= 1 and stripped in _FILLERS:
        return True
    return False


SYSTEM_PROMPT = """Sos el Organizer de una pizarra que se llena sola mientras un equipo de producto habla. Tu único trabajo es mantener un resumen vivo de lo que importa.

No sos un juez. No clasificás a la gente, no calificás lo que dicen, no decidís si alguien merece estar. Leés lo que se viene diciendo y escribís qué está pasando.

CÓMO TRABAJÁS:
- Recibís cuatro cosas: `reunion` (de qué vino a hablar el equipo), `resumen_anterior` (lo que vos mismo escribiste en la pasada anterior, con cada punto numerado), `dicho_antes` (unas líneas previas, solo para entender de qué venían hablando) y `nuevo` (lo que se dijo desde entonces).
- `reunion` es la vara. Un point tiene que ser sobre eso. Lo que no lo es, no entra, por más que alguien lo haya dicho con todas las letras. Si `reunion` viene vacío, el tema es lo que venga saliendo de la propia conversación.
- `resumen_anterior` es tu memoria. No vas a ver la conversación entera de nuevo: lo que no esté ahí, se perdió.
- No copias los puntos que ya escribiste. Los nombrás por su número en `keep`, en el orden en que querés que queden. Lo que no nombres, desaparece de la pizarra.
- En `add` van solo las ideas nuevas, las que todavía no tienen número.
- Reescribir un punto que no cambió hace parpadear la pizarra y te cuesta tiempo. Si sigue valiendo igual, va en `keep` y listo.
- Para corregir un punto: dejalo afuera de `keep` y escribí la versión buena en `add`. Hacelo solo si de verdad cambió lo que se entiende.

EL TEXTO VIENE DE RECONOCIMIENTO DE VOZ:
- Llega cortado a mitad de frase. Líneas seguidas suelen ser UNA sola idea: unilas.
- Tiene errores de audio. Podés corregir una palabra mal escuchada solo si suena casi igual a la correcta.
- Risas, muletillas y charla de prueba del sistema ("se escucha?", "probando") simplemente no aparecen en el resumen. No las menciones, no las comentes, ignoralas.

REGLA DURA — NO INVENTAR:
- Todo lo que escribas tiene que poder rastrearse a palabras que alguien dijo.
- No completes la idea de nadie. No agregues tecnologías, nombres ni decisiones que no aparecieron.
- Ante la duda entre escribir de más o de menos, escribí de menos.
- Si todavía no se dijo nada con sustancia, devolvé `points` vacío. Es una respuesta correcta.

QUÉ NUNCA ES UN POINT:
- Hablar de esta herramienta: la pizarra, el micrófono, los agentes, si se escucha, si anda, si funciona. "ya funciona", "está andando", "probando", "se ve la nota". Nada de eso es la reunión, es la gente mirando la pantalla.
- Saludos, despedidas, chistes, insultos, palabras sueltas, hablar del clima o del almuerzo.
- Que alguien esté de acuerdo o hable. "Ignacio dice que sí" no es un point; el point sería lo que dijo, si valía.

Ante cualquiera de estos, el point no existe. Ni siquiera reformulado.

QUÉ ES UN POINT:
Una idea concreta, en una línea corta, tal como se dijo: una propuesta, una decisión, un problema, una parte del sistema, un paso. Máximo 10. Lo más importante primero.

El `summary` cuenta de qué se está hablando, no quién habló. Nunca "Fulano dice que...".

Cada point lleva un `kind`, que dice qué tipo de cosa es. Es lo único que clasificás, y es sobre la frase, no sobre la persona:
- `decision`: el equipo ya lo resolvió. "vamos con Supabase", "queda descartado".
- `pregunta`: quedó preguntado y sin responder. "¿dónde guardamos la transcripción?".
- `pendiente`: falta hacerlo o falta definirlo. "falta registrar el dominio".
- `idea`: todo lo demás — una propuesta, un problema, una parte del sistema, un paso.

Ante la duda, `idea`.

Formato de salida (JSON, sin prosa alrededor):
{
  "summary": "una o dos oraciones de qué se está hablando, o null si sigue igual",
  "keep": [1, 2, 5],
  "add": [
    {"text": "una idea concreta en pocas palabras", "author": "quién la dijo", "kind": "idea"}
  ]
}

Si en `nuevo` no hay nada que valga la pena, devolvé todos los números en `keep` y `add` vacío."""


def _text(v) -> str:
    return v.strip() if isinstance(v, str) else ""


def _rebuild(data: dict, previous: list[Point]) -> list[Point] | None:
    """Builds the new list out of the numbers the model kept and the ideas it
    added. Returns None when the answer was too broken to act on — the board
    then keeps what it already had.

    A model under load returns strings, nulls or half-built objects here.
    Anything unreadable is dropped, never guessed."""
    keep = data.get("keep")
    add = data.get("add")
    if not isinstance(keep, list) and not isinstance(add, list):
        return None

    out: list[Point] = []
    seen: set[str] = set()

    for n in keep if isinstance(keep, list) else []:
        if not isinstance(n, int) or isinstance(n, bool):
            continue
        if not 1 <= n <= len(previous):
            continue
        point = previous[n - 1]
        if point["id"] in seen:
            continue
        seen.add(point["id"])
        out.append(point)

    for item in add if isinstance(add, list) else []:
        if not isinstance(item, dict):
            continue
        text = _text(item.get("text"))
        if not text:
            continue
        pid = point_id(text)
        if pid in seen:
            continue
        seen.add(pid)
        kind = _text(item.get("kind")).lower()
        out.append(
            {
                "id": pid,
                "text": text,
                "author": _text(item.get("author")),
                "kind": kind if kind in KINDS else "idea",
            }
        )

    return out[:MAX_POINTS]


async def summarize(session_id: str, fresh: list[TranscriptChunk]) -> Digest | None:
    """Rewrite the running summary over what was just said. Returns the new
    digest when it actually changed, otherwise None."""
    settings = get_settings()
    if not settings.openai_api_key:
        return None

    # Only the new speech goes up. Re-sending the whole conversation every pass
    # made each call slower than the last, and the summary already carries
    # everything worth remembering.
    heard = store.context(session_id)
    before = heard[: len(heard) - len(fresh)][-TAIL_CHUNKS:]

    state = store.get(session_id)
    previous = state.digest
    payload = {
        "reunion": state.brief,
        "dicho_antes": [f"{c['author']}: {c['text']}" for c in before],
        "nuevo": [f"{c['author']}: {c['text']}" for c in fresh],
        "resumen_anterior": {
            "summary": previous["summary"],
            "points": [
                {"n": i, "text": p["text"], "author": p["author"], "kind": p["kind"]}
                for i, p in enumerate(previous["points"], start=1)
            ],
        },
    }

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    started = time.time()
    try:
        resp = await client.chat.completions.create(
            model=settings.openai_organizer_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": json.dumps(payload, ensure_ascii=False),
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        data = json.loads(resp.choices[0].message.content or "{}")
        logger.info("summarize took %.1fs session=%s", time.time() - started, session_id)
    except Exception:
        logger.exception("organizer summarize failed; keeping previous digest")
        return None

    if not isinstance(data, dict):
        data = {}

    points = _rebuild(data, previous["points"])
    if points is None:
        return None
    summary = _text(data.get("summary")) or previous["summary"]

    unchanged = [p["id"] for p in points] == [
        p["id"] for p in previous["points"]
    ] and summary == previous["summary"]
    if unchanged:
        return None

    digest: Digest = {
        "summary": summary,
        "points": points,
        "revision": previous["revision"] + 1,
    }
    store.set_digest(session_id, digest)

    await emit(
        session_id,
        "organizer.digest",
        {
            "revision": digest["revision"],
            "summary": digest["summary"],
            "points": digest["points"],
            # When the oldest line in this pass was spoken, so a watcher can
            # tell how long the board took to catch up with the room.
            "spoken_at": fresh[0]["ts"] if fresh else None,
            # The model's share of that wait. What it does not account for is
            # time the batch spent queued behind the previous pass.
            "took": round(time.time() - started, 2),
            "batch": len(fresh),
        },
    )
    return digest
