import json
import logging
import re
import time
import uuid

from openai import AsyncOpenAI

from agents.bus import emit
from agents.organizer_buffer import (
    append,
    replace,
    should_organize,
    snapshot,
)
from agents.settings import get_settings
from agents.state import GraphState, TranscriptChunk

logger = logging.getLogger("agents.organizer")

# An ongoing thread whose first chunk is older than this gets dispatched
# anyway — a board that fills late beats one that never fills.
FORCE_SETTLE_SEC = 20.0

# Token ceiling for the rolling buffer of unsettled chunks.
MAX_BUFFER_CHUNKS = 24

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

IMPORTANTE — el texto viene de reconocimiento de voz automático, así que:
- Llega cortado a mitad de frase. Dos chunks seguidos suelen ser UNA sola idea: unilos.
- Tiene errores de transcripción. Si una palabra no encaja pero suena parecida a algo que sí encaja en el contexto técnico, asumí la corrección (ej. "agente OS" → "agente Ops", "sauna" → algo que rime en contexto). Si un chunk es puro ruido incomprensible, descartalo.
- No cites el texto literal: reconstruí lo que la persona quiso decir.

Dados los chunks de transcripción recientes:
1. Descartá lo que no vale — risas, muletillas, backchannels, respuestas monosilábicas sin contenido, y fragmentos ininteligibles.
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
        await emit(
            session_id,
            "organizer.status",
            {"stage": "noise_dropped", "text": chunk["text"]},
        )
        return {"dispatch": []}

    append(session_id, chunk)

    if not should_organize(session_id):
        await emit(
            session_id,
            "organizer.status",
            {
                "stage": "buffered",
                "text": chunk["text"],
                "buffer": len(snapshot(session_id)),
            },
        )
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
        logger.exception("organizer LLM call failed, keeping buffer")
        return {"dispatch": []}

    threads = data.get("threads", [])
    settled = [t for t in threads if t.get("settled") and t.get("chunk_ids")]
    ongoing = [
        t for t in threads if not t.get("settled") and t.get("chunk_ids")
    ]

    now = time.time()
    for t in ongoing[:]:
        ids = [i for i in t["chunk_ids"] if 0 <= i < len(chunks)]
        if ids and now - chunks[ids[0]]["ts"] >= FORCE_SETTLE_SEC:
            settled.append(t)
            ongoing.remove(t)

    # Settled chunks are dispatched; chunks in no thread were judged noise
    # and dropped. Only ongoing-thread chunks stay for the next cycle.
    keep_ids: set[int] = set()
    for t in ongoing:
        for cid in t.get("chunk_ids", []) or []:
            keep_ids.add(cid)

    remaining = [c for i, c in enumerate(chunks) if i in keep_ids]
    remaining = remaining[-MAX_BUFFER_CHUNKS:]
    replace(session_id, remaining)

    logger.info(
        "organized session=%s chunks=%d settled=%d ongoing=%d",
        session_id, len(chunks), len(settled), len(ongoing),
    )
    await emit(
        session_id,
        "organizer.status",
        {
            "stage": "organized",
            "chunks": len(chunks),
            "kept": len(remaining),
            "threads": [
                {"topic": t.get("topic", ""), "settled": bool(t in settled)}
                for t in settled + ongoing
            ],
        },
    )

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
