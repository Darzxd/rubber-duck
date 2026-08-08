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

VARIANTS: dict[str, dict] = {
    "current (gpt-4o-transcribe + server_vad)": {
        "transcription": {"model": "gpt-4o-transcribe", "language": "es"},
        "turn_detection": {"type": "server_vad", "silence_duration_ms": 600},
    },
    "keywords field": {
        "transcription": {
            "model": "gpt-4o-transcribe",
            "language": "es",
            "keywords": ["Supabase", "Portal", "rubber-duck"],
        },
        "turn_detection": {"type": "server_vad", "silence_duration_ms": 600},
    },
    "semantic_vad eagerness=high": {
        "transcription": {"model": "gpt-4o-transcribe", "language": "es"},
        "turn_detection": {"type": "semantic_vad", "eagerness": "high"},
    },
    "semantic_vad eagerness=low": {
        "transcription": {"model": "gpt-4o-transcribe", "language": "es"},
        "turn_detection": {"type": "semantic_vad", "eagerness": "low"},
    },
    "gpt-live-transcribe + server_vad": {
        "transcription": {"model": "gpt-live-transcribe", "languages": ["es"]},
        "turn_detection": {"type": "server_vad", "silence_duration_ms": 600},
    },
    "gpt-live-transcribe + semantic_vad": {
        "transcription": {"model": "gpt-live-transcribe", "languages": ["es"]},
        "turn_detection": {"type": "semantic_vad", "eagerness": "high"},
    },
    "gpt-live-transcribe delay=minimal": {
        "transcription": {
            "model": "gpt-live-transcribe",
            "languages": ["es"],
            "delay": "minimal",
        },
        "turn_detection": {"type": "semantic_vad", "eagerness": "high"},
    },
    "gpt-realtime-whisper + server_vad": {
        "transcription": {"model": "gpt-realtime-whisper", "language": "es"},
        "turn_detection": {"type": "server_vad", "silence_duration_ms": 600},
    },
    "gpt-realtime-whisper + semantic_vad": {
        "transcription": {"model": "gpt-realtime-whisper", "language": "es"},
        "turn_detection": {"type": "semantic_vad", "eagerness": "high"},
    },
    "gpt-realtime-whisper + keywords": {
        "transcription": {
            "model": "gpt-realtime-whisper",
            "language": "es",
            "keywords": ["Supabase", "Portal"],
        },
        "turn_detection": {"type": "semantic_vad", "eagerness": "high"},
    },
    "gpt-live-transcribe alone (no turn_detection)": {
        "transcription": {"model": "gpt-live-transcribe", "languages": ["es"]},
    },
    "gpt-live-transcribe + keywords": {
        "transcription": {
            "model": "gpt-live-transcribe",
            "languages": ["es"],
            "keywords": ["Supabase", "Portal"],
        },
    },
    "diarize model": {
        "transcription": {
            "model": "gpt-4o-transcribe-diarize",
            "language": "es",
        },
        "turn_detection": {"type": "server_vad", "silence_duration_ms": 600},
    },
}


async def probe(client: httpx.AsyncClient, name: str, inp: dict) -> None:
    r = await client.post(
        URL,
        headers={"Content-Type": "application/json"},
        json={
            "session": {
                "type": "transcription",
                "audio": {"input": inp},
                "include": ["item.input_audio_transcription.logprobs"],
            }
        },
    )
    if r.status_code < 400:
        got = r.json()["session"]["audio"]["input"]
        print(f"{GREEN}✓{OFF} {BOLD}{name}{OFF}")
        print(f"    {DIM}transcription: {json.dumps(got['transcription'])}{OFF}")
        print(f"    {DIM}turn_detection: {json.dumps(got['turn_detection'])}{OFF}")
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
