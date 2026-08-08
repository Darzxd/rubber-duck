import json
import re
import uuid

from openai import AsyncOpenAI

from agents.organizer_buffer import (
    append,
    replace,
    should_organize,
    snapshot,
)
from agents.settings import get_settings
from agents.state import GraphState, TranscriptChunk

# Cheap filter — drops obvious noise before spending a token. Laughter,
# fillers, single-word backchannels.
_LAUGH = re.compile(r"^(ja|ha|je|he|ji|jo|ho|xd)+[.!?,;:]*$", re.IGNORECASE)
_FILLERS = {
    "si", "sí", "no", "ok", "okay", "vale", "eh", "ehh", "hmm", "aha",
    "ajá", "ya", "bueno", "claro", "listo", "hola", "chao", "adiós",
    "mm", "mhm", "uf", "uy", "ah", "oh", "eee", "pues",
}


def _is_noise(chunk: TranscriptChunk) -> bool:
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


SYSTEM_PROMPT = """Sos el Organizer de una pizarra colaborativa en vivo. Varias personas hablan y todo se transcribe. Tu tarea: convertir el caos en hilos temáticos que los demás agentes (Architect, Critic, Scribe) puedan procesar.

Dados los chunks de transcripción recientes:
1. Descartá lo que no vale — risas, muletillas, backchannels, respuestas monosilábicas sin contenido.
2. Agrupá los chunks relacionados en "hilos" temáticos. Un hilo es una mini-conversación sobre una idea, decisión, pregunta o tema concreto.
3. Marcá cada hilo como SETTLED (los participantes ya se movieron a otro tema o hubo pausa) o ONGOING (todavía se está discutiendo).

Sé estricto: si un hilo tiene solo 1 chunk y es débil, descartalo. Solo devolvé hilos con sustancia real.

Formato de salida (JSON, sin prosa alrededor):
{
  "threads": [
    {
      "topic": "título de 3-6 palabras",
      "chunk_ids": [índices 0-based en orden],
      "summary": "una oración de qué se dijo",
      "settled": true | false
    }
  ]
}

Si no hay nada que valga la pena, devolvé {"threads": []}."""


async def organizer(state: GraphState) -> dict:
    chunk = state["incoming"]
    session_id = state["session_id"]

    if _is_noise(chunk):
        return {"dispatch": []}

    append(session_id, chunk)

    if not should_organize(session_id):
        return {"dispatch": []}

    settings = get_settings()
    if not settings.openai_api_key:
        return {"dispatch": []}

    chunks = snapshot(session_id)
    payload = {
        "chunks": [
            {"i": i, "author": c["author"], "text": c["text"], "ts": c["ts"]}
            for i, c in enumerate(chunks)
        ]
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
        content = resp.choices[0].message.content or "{}"
        data = json.loads(content)
    except Exception:
        # Keep the buffer as-is so the next chunk retries.
        return {"dispatch": []}

    threads = data.get("threads", [])

    # Chunks used by any thread (settled or ongoing) leave the raw buffer.
    # Settled → dispatched now. Ongoing → we could keep them, but re-showing
    # them to the LLM every cycle wastes tokens; drop and let the next
    # organize call see fresh chunks if the topic continues.
    used_ids: set[int] = set()
    for t in threads:
        for cid in t.get("chunk_ids", []) or []:
            used_ids.add(cid)

    remaining = [c for i, c in enumerate(chunks) if i not in used_ids]
    replace(session_id, remaining)

    settled = [t for t in threads if t.get("settled") and t.get("chunk_ids")]
    if not settled:
        return {"dispatch": []}

    # Dispatch the first settled thread. Multiple settled threads on the same
    # turn is rare; if it happens we drop the extras (fanout comes later).
    first = settled[0]
    thread_chunks = [
        chunks[i] for i in first["chunk_ids"] if 0 <= i < len(chunks)
    ]

    return {
        "settled_thread": {
            "id": f"th_{uuid.uuid4().hex[:8]}",
            "chunks": thread_chunks,
            "settled": True,
            "topic": first.get("topic", ""),
            "summary": first.get("summary", ""),
        },
        "dispatch": ["architect"],
    }
