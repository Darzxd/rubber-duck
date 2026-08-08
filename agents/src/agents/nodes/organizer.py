import json
import logging
import re
import time

from openai import AsyncOpenAI

from agents import organizer_store as store
from agents.bus import emit
from agents.settings import get_settings
from agents.state import Intent, Thread, TranscriptChunk

logger = logging.getLogger("agents.organizer")

# Cheap filter — drops obvious noise before spending a token. Laughter,
# fillers, single-word backchannels.
_LAUGH = re.compile(r"^(ja|ha|je|he|ji|jo|ho|xd)+[.!?,;:]*$", re.IGNORECASE)
_FILLERS = {
    "si", "sí", "no", "ok", "okay", "vale", "eh", "ehh", "hmm", "aha",
    "ajá", "ya", "bueno", "claro", "listo", "hola", "chao", "adiós",
    "mm", "mhm", "uf", "uy", "ah", "oh", "eee", "pues",
    "dale", "obvio", "exacto", "perfecto", "genial", "nada",
}

# How much of a thread we replay to the model. Enough to revise it, not so
# much that a long thread dominates the prompt.
RECENT_CHUNKS = 8

# A thread has to carry real material before anyone draws it. The model
# happily settles a single stray sentence if we let it.
MIN_CHUNKS = 2
MIN_SPOKEN_CHARS = 80


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


SYSTEM_PROMPT = """Sos el Organizer de una pizarra colaborativa en vivo. Escuchás una reunión y mantenés, en todo momento, una lista de HILOS abiertos. No procesás frases sueltas: revisás y corregís tu propia lista cada vez que llega algo nuevo.

EL TEXTO VIENE DE RECONOCIMIENTO DE VOZ:
- Llega cortado a mitad de frase. Chunks seguidos suelen ser UNA sola idea: unilos.
- Tiene errores de audio. Podés corregir una palabra mal escuchada solo si suena casi igual a la correcta.
- El reconocedor a veces ALUCINA frases que nadie dijo. Si un chunk no tiene nada que ver con lo que se venía hablando y aparece solo, descartalo.

REGLA DURA — NO INVENTAR:
- Todo lo que escribas en topic, summary e intents tiene que poder rastrearse a palabras que alguien dijo en los chunks.
- No completes la idea de nadie. No agregues tecnologías, nombres, decisiones ni objetivos que no aparecieron.
- Si no entendés qué quiere alguien, no le pongas intent. Un hilo con intents vacíos es correcto.
- Ante la duda entre escribir de más o de menos, escribí de menos.

QUÉ RECIBÍS:
- `threads`: los hilos que ya venías siguiendo, con su id.
- `new_chunks`: lo que se dijo desde tu última pasada.

QUÉ TENÉS QUE HACER, en este orden:
1. Asigná cada chunk nuevo a un hilo existente (por su id) si continúa ese tema. Solo abrí un hilo nuevo si de verdad es otro tema.
2. Revisá los hilos que tocaste: si ahora entendés mejor de qué se trata, REESCRIBÍ su topic y su summary. Un hilo mejora a medida que la gente habla.
3. Por cada participante del hilo, anotá qué quiere concretamente (`intents`). Ej: "Ignacio quiere un diagrama del core bancario conectado a IA". Si alguien solo acompaña, no lo anotes.
4. Anotá las preguntas que quedaron abiertas (`open_questions`), si las hay.
5. Marcá `settled` SOLO cuando el tema está lo bastante desarrollado como para dibujarlo y la conversación ya se movió a otra cosa. Un hilo con una sola frase trivial NO se marca settled: se descarta.

DESCARTAR (`drop`): charla de prueba del sistema ("probando", "esta sesión cuál es", "se escucha?"), saludos, risas, y cualquier hilo sin sustancia. Es preferible descartar que dibujar basura.

PRIORIDAD: lo que importa es la sustancia del producto — ideas, decisiones, arquitectura, problemas, propuestas. La charla operativa sobre la propia herramienta casi nunca merece un hilo.

Formato de salida (JSON, sin prosa alrededor):
{
  "threads": [
    {
      "id": "id existente, o null si es nuevo",
      "topic": "título de 3-6 palabras",
      "summary": "2 oraciones de qué se está discutiendo y a dónde va",
      "intents": [{"author": "nombre", "wants": "qué quiere, concreto"}],
      "open_questions": ["pregunta sin responder"],
      "settled": true | false,
      "chunk_ids": [índices 0-based de new_chunks que caen en este hilo]
    }
  ],
  "drop": [índices de new_chunks que no valen nada]
}"""


def is_substantial(t: Thread) -> bool:
    if not t["topic"] or len(t["chunks"]) < MIN_CHUNKS:
        return False
    return sum(len(c["text"]) for c in t["chunks"]) >= MIN_SPOKEN_CHARS


def _text(v) -> str:
    return v.strip() if isinstance(v, str) else ""


def _intents(v) -> list[Intent]:
    """A model under load returns strings, nulls or half-built objects here.
    Anything we cannot read as an intent is dropped, never guessed."""
    out: list[Intent] = []
    for item in v if isinstance(v, list) else []:
        if not isinstance(item, dict):
            continue
        author, wants = _text(item.get("author")), _text(item.get("wants"))
        if author and wants:
            out.append({"author": author, "wants": wants})
    return out


def _questions(v) -> list[str]:
    return [q.strip() for q in v if isinstance(q, str) and q.strip()] if isinstance(v, list) else []


def _indices(v, size: int) -> list[int]:
    seen: set[int] = set()
    for i in v if isinstance(v, list) else []:
        if isinstance(i, bool) or not isinstance(i, int):
            continue
        if 0 <= i < size:
            seen.add(i)
    return sorted(seen)


def _thread_view(t: Thread) -> dict:
    return {
        "id": t["id"],
        "topic": t["topic"],
        "summary": t["summary"],
        "intents": t["intents"],
        "participants": t["participants"],
        "recent": [
            f"{c['author']}: {c['text']}" for c in t["chunks"][-RECENT_CHUNKS:]
        ],
        "seconds_quiet": round(time.time() - t["last_touched"], 1),
    }


async def reconcile(
    session_id: str, new_chunks: list[TranscriptChunk]
) -> list[Thread]:
    """Fold new speech into the live thread list. Returns threads that just
    became settled and are ready to dispatch."""
    settings = get_settings()
    if not settings.openai_api_key:
        return []

    open_threads = store.ongoing(session_id)
    payload = {
        "threads": [_thread_view(t) for t in open_threads],
        "new_chunks": [
            {"i": i, "author": c["author"], "text": c["text"]}
            for i, c in enumerate(new_chunks)
        ],
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
        logger.exception("organizer reconcile failed; chunks stay pending")
        # Put them back so the next tick retries instead of losing speech.
        for c in new_chunks:
            store.add_chunk(session_id, c)
        return []

    if not isinstance(data, dict):
        data = {}

    now = time.time()
    ready: list[Thread] = []

    specs = data.get("threads")
    for spec in specs if isinstance(specs, list) else []:
        if not isinstance(spec, dict):
            continue

        ids = _indices(spec.get("chunk_ids"), len(new_chunks))
        joined = [new_chunks[i] for i in ids]

        tid = spec.get("id")
        existing = (
            store.get(session_id).threads.get(tid)
            if isinstance(tid, str) and tid
            else None
        )

        if existing is None:
            if not joined:
                continue
            existing = Thread(
                id=store.new_thread_id(),
                topic="",
                summary="",
                chunks=[],
                participants=[],
                intents=[],
                status="ongoing",
                created_at=now,
                last_touched=now,
                dispatched=False,
            )

        existing["chunks"] = existing["chunks"] + joined
        existing["topic"] = _text(spec.get("topic")) or existing["topic"]
        existing["summary"] = _text(spec.get("summary")) or existing["summary"]
        existing["intents"] = _intents(spec.get("intents")) or existing["intents"]
        existing["open_questions"] = _questions(spec.get("open_questions"))
        existing["participants"] = sorted(
            {c["author"] for c in existing["chunks"]}
        )
        if joined:
            existing["last_touched"] = now

        if (
            spec.get("settled") is True
            and not existing["dispatched"]
            and is_substantial(existing)
        ):
            existing["status"] = "settled"
            ready.append(existing)

        store.upsert_thread(session_id, existing)

    dropped = [
        new_chunks[i] for i in _indices(data.get("drop"), len(new_chunks))
    ]
    if dropped:
        await emit(
            session_id,
            "organizer.status",
            {
                "stage": "dropped",
                "texts": [c["text"] for c in dropped],
            },
        )

    await emit(
        session_id,
        "organizer.status",
        {
            "stage": "organized",
            "chunks": len(new_chunks),
            "pending": len(store.get(session_id).pending),
            "threads": [
                {
                    "id": t["id"],
                    "topic": t["topic"],
                    "settled": t["status"] == "settled",
                    "intents": t["intents"],
                    "participants": t["participants"],
                }
                for t in store.get(session_id).threads.values()
            ],
        },
    )

    return ready
