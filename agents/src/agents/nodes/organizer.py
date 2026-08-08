import json
import logging
import re

from openai import AsyncOpenAI

from agents import organizer_store as store
from agents.bus import emit
from agents.settings import get_settings
from agents.state import Digest, Point, TranscriptChunk, point_id

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
- Recibís la conversación hasta ahora y el resumen que vos mismo escribiste en la pasada anterior.
- Devolvés el resumen COMPLETO, reescrito. No es una lista a la que se le agregan cosas: es un documento que vas corrigiendo. Si algo que escribiste antes ahora se entiende mejor, reescribilo. Si algo dejó de importar, sacalo.
- Repetí textualmente los `points` que siguen valiendo igual. Cambiar la redacción de un punto que no cambió hace parpadear la pizarra.

EL TEXTO VIENE DE RECONOCIMIENTO DE VOZ:
- Llega cortado a mitad de frase. Líneas seguidas suelen ser UNA sola idea: unilas.
- Tiene errores de audio. Podés corregir una palabra mal escuchada solo si suena casi igual a la correcta.
- Risas, muletillas y charla de prueba del sistema ("se escucha?", "probando") simplemente no aparecen en el resumen. No las menciones, no las comentes, ignoralas.

REGLA DURA — NO INVENTAR:
- Todo lo que escribas tiene que poder rastrearse a palabras que alguien dijo.
- No completes la idea de nadie. No agregues tecnologías, nombres ni decisiones que no aparecieron.
- Ante la duda entre escribir de más o de menos, escribí de menos.
- Si todavía no se dijo nada con sustancia, devolvé `points` vacío. Es una respuesta correcta.

QUÉ ES UN POINT:
Una idea concreta, en una línea corta, tal como se dijo: una propuesta, una decisión, un problema, una parte del sistema, un paso. Máximo 10. Lo más importante primero.

Formato de salida (JSON, sin prosa alrededor):
{
  "summary": "2 o 3 oraciones de qué se está hablando y a dónde va",
  "points": [
    {"text": "una idea concreta en pocas palabras", "author": "quién la dijo"}
  ]
}"""


def _text(v) -> str:
    return v.strip() if isinstance(v, str) else ""


def _points(v) -> list[Point]:
    """A model under load returns strings, nulls or half-built objects here.
    Anything unreadable is dropped, never guessed."""
    out: list[Point] = []
    seen: set[str] = set()
    for item in v if isinstance(v, list) else []:
        if not isinstance(item, dict):
            continue
        text = _text(item.get("text"))
        if not text:
            continue
        pid = point_id(text)
        if pid in seen:
            continue
        seen.add(pid)
        out.append({"id": pid, "text": text, "author": _text(item.get("author"))})
        if len(out) >= MAX_POINTS:
            break
    return out


async def summarize(session_id: str) -> Digest | None:
    """Rewrite the running summary over everything said so far. Returns the
    new digest when it actually changed, otherwise None."""
    settings = get_settings()
    if not settings.openai_api_key:
        return None

    previous = store.get(session_id).digest
    payload = {
        "conversacion": [
            f"{c['author']}: {c['text']}" for c in store.context(session_id)
        ],
        "resumen_anterior": {
            "summary": previous["summary"],
            "points": [
                {"text": p["text"], "author": p["author"]}
                for p in previous["points"]
            ],
        },
    }

    client = AsyncOpenAI(api_key=settings.openai_api_key)
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
    except Exception:
        logger.exception("organizer summarize failed; keeping previous digest")
        return None

    if not isinstance(data, dict):
        data = {}

    points = _points(data.get("points"))
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
        },
    )
    return digest
