"""Talks to a running backend as if two people were in a session.

Posts the scripted meeting to /ingest respecting the pauses in the script, so
the Organizer loop, the dispatch and /working all behave exactly as they would
with real microphones. Skips the transcriber — use tests/listen.py for that.

    uv run python tests/simulate.py             # real timing
    uv run python tests/simulate.py --fast 4    # 4x speed
    uv run python tests/simulate.py --session demo
"""

import argparse
import asyncio
import sys
import time
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).parent))

from fixtures.meeting import SCRIPT  # noqa: E402

DIM = "\033[2m"
BOLD = "\033[1m"
CYAN = "\033[36m"
OFF = "\033[0m"


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8000")
    ap.add_argument("--session", default="sim")
    ap.add_argument("--fast", type=float, default=1.0)
    args = ap.parse_args()

    started = time.time()
    print(f"{BOLD}simulando {len(SCRIPT)} lineas en {args.session}{OFF}")
    print(f"{DIM}mira {args.url}/working?session={args.session}{OFF}\n")

    async with httpx.AsyncClient(timeout=10.0) as client:
        clock = 0.0
        for author, text, offset in SCRIPT:
            await asyncio.sleep(max(0.0, (offset - clock) / args.fast))
            clock = offset

            r = await client.post(
                f"{args.url}/ingest",
                json={
                    "session_id": args.session,
                    "author": author,
                    "text": text,
                    "ts": started + offset,
                },
            )
            queued = r.json().get("queued")
            mark = f"{CYAN}→{OFF}" if queued else f"{DIM}✗{OFF}"
            print(f"{mark} {author}: {text}")

    # The loop closes a thread only after the silence convinces it. Wait for
    # that instead of guessing a number.
    print(f"\n{DIM}esperando a que el organizer cierre los hilos...{OFF}")
    deadline = time.time() + 90
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            data = (
                await client.get(f"{args.url}/threads/{args.session}")
            ).json()
            open_threads = [
                t for t in data["threads"] if t["status"] != "settled"
            ]
            if data["threads"] and not open_threads and not data["pending"]:
                break
            if time.time() > deadline:
                print(f"{DIM}  (timeout, muestro como quedo){OFF}")
                break
            await asyncio.sleep(2)

    print(f"\n{BOLD}lo que entendio{OFF}")
    for t in data["threads"]:
        print(
            f"  {BOLD}{t['topic']}{OFF}  [{t['status']}]  {t['chunks']} chunks"
        )
        print(f"    {DIM}{t['summary']}{OFF}")
        for it in t["intents"]:
            print(f"    {CYAN}{it['author']}{OFF} quiere {it['wants']}")
        for q in t["open_questions"]:
            print(f"    {DIM}? {q}{OFF}")
    print(f"\n{DIM}pendientes sin procesar: {data['pending']}{OFF}")


if __name__ == "__main__":
    asyncio.run(main())
