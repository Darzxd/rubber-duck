"""Asks OpenAI which realtime transcription options it actually accepts.

Mints a throwaway session per variant and reports what came back. Nothing here
touches the live config, so it is safe to run during a session.

    uv run python tests/probe_realtime.py
"""

import asyncio
import json

import httpx

from agents.settings import get_settings

URL = "https://api.openai.com/v1/realtime/client_secrets"

RED = "\033[31m"
GREEN = "\033[32m"
DIM = "\033[2m"
BOLD = "\033[1m"
OFF = "\033[0m"

KEYWORDS = ["Supabase", "Portal", "React Flow", "Vercel", "Next.js"]

# Shapes taken from the realtime-transcription guide, not guessed.
VARIANTS: dict[str, dict] = {
    "current (gpt-4o-transcribe + semantic_vad low)": {
        "input": {
            "transcription": {"model": "gpt-4o-transcribe", "language": "es"},
            "turn_detection": {"type": "semantic_vad", "eagerness": "low"},
        },
        "include": ["item.input_audio_transcription.logprobs"],
    },
    "live-transcribe, no turn_detection key": {
        "input": {
            "transcription": {"model": "gpt-live-transcribe", "languages": ["es"]},
        },
    },
    "live-transcribe, turn_detection=null": {
        "input": {
            "transcription": {"model": "gpt-live-transcribe", "languages": ["es"]},
            "turn_detection": None,
        },
    },
    "live-transcribe + delay=high": {
        "input": {
            "transcription": {
                "model": "gpt-live-transcribe",
                "languages": ["es"],
                "delay": "high",
            },
            "turn_detection": None,
        },
    },
    "live-transcribe + delay=xhigh": {
        "input": {
            "transcription": {
                "model": "gpt-live-transcribe",
                "languages": ["es"],
                "delay": "xhigh",
            },
            "turn_detection": None,
        },
    },
    "live-transcribe + keywords": {
        "input": {
            "transcription": {
                "model": "gpt-live-transcribe",
                "languages": ["es"],
                "keywords": KEYWORDS,
                "delay": "high",
            },
            "turn_detection": None,
        },
    },
    "live-transcribe + server_vad": {
        "input": {
            "transcription": {"model": "gpt-live-transcribe", "languages": ["es"]},
            "turn_detection": {"type": "server_vad", "silence_duration_ms": 600},
        },
    },
    "live-transcribe + semantic_vad low": {
        "input": {
            "transcription": {"model": "gpt-live-transcribe", "languages": ["es"]},
            "turn_detection": {"type": "semantic_vad", "eagerness": "low"},
        },
    },
    "live-transcribe + logprobs include": {
        "input": {
            "transcription": {"model": "gpt-live-transcribe", "languages": ["es"]},
            "turn_detection": None,
        },
        "include": ["item.input_audio_transcription.logprobs"],
    },
    "gpt-transcribe, turn_detection=null": {
        "input": {
            "transcription": {"model": "gpt-transcribe", "language": "es"},
            "turn_detection": None,
        },
    },
    "gpt-transcribe + semantic_vad low": {
        "input": {
            "transcription": {"model": "gpt-transcribe", "language": "es"},
            "turn_detection": {"type": "semantic_vad", "eagerness": "low"},
        },
    },
}


async def probe(client: httpx.AsyncClient, name: str, variant: dict) -> None:
    session: dict = {
        "type": "transcription",
        "audio": {"input": variant["input"]},
    }
    if variant.get("include"):
        session["include"] = variant["include"]

    r = await client.post(
        URL,
        headers={"Content-Type": "application/json"},
        json={"session": session},
    )
    if r.status_code < 400:
        got = r.json()["session"]["audio"]["input"]
        print(f"{GREEN}✓{OFF} {BOLD}{name}{OFF}")
        print(f"    {DIM}transcription: {json.dumps(got.get('transcription'))}{OFF}")
        print(f"    {DIM}turn_detection: {json.dumps(got.get('turn_detection'))}{OFF}")
        return

    detail = r.json().get("error", {})
    print(f"{RED}✗{OFF} {BOLD}{name}{OFF}  {r.status_code}")
    print(f"    {RED}{detail.get('message', r.text)[:200]}{OFF}")
    if detail.get("param"):
        print(f"    {DIM}param: {detail['param']}{OFF}")


async def main() -> None:
    key = get_settings().openai_api_key
    if not key:
        raise SystemExit("OPENAI_API_KEY is not set")

    async with httpx.AsyncClient(
        timeout=20.0, headers={"Authorization": f"Bearer {key}"}
    ) as client:
        for name, inp in VARIANTS.items():
            await probe(client, name, inp)
            print()


if __name__ == "__main__":
    asyncio.run(main())
