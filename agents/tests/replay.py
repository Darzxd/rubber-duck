"""Replays the scripted meeting through the real Organizer so we can read what
it understood and keep tuning the prompt.

    uv run python tests/replay.py           # the fixture meeting
    uv run python tests/replay.py mine.txt  # "Author: line" per row

This costs real tokens. It is a tool for iterating, not part of the suite.
"""

import asyncio
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from agents import organizer_loop as loop  # noqa: E402
from agents import organizer_store as store  # noqa: E402
from agents.nodes.organizer import is_noise, reconcile  # noqa: E402
from fixtures.meeting import SCRIPT  # noqa: E402

SESSION = "replay"

DIM = "\033[2m"
BOLD = "\033[1m"
RED = "\033[31m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
CYAN = "\033[36m"
OFF = "\033[0m"


def load(path: str | None) -> list[tuple[str, str, float]]:
    if not path:
        return SCRIPT
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    out = []
    for i, line in enumerate(l for l in lines if l.strip()):
        author, _, text = line.partition(":")
        out.append((author.strip(), text.strip(), i * 2.0))
    return out


def show_threads() -> None:
    threads = store.get(SESSION).threads.values()
    if not threads:
        print(f"  {DIM}(sin hilos){OFF}")
        return
    for t in threads:
        mark = f"{GREEN}settled{OFF}" if t["status"] == "settled" else f"{YELLOW}ongoing{OFF}"
        print(f"  {BOLD}{t['topic'] or '(sin titulo)'}{OFF}  [{mark}]")
        if t["summary"]:
            print(f"    {DIM}{t['summary']}{OFF}")
        for it in t["intents"]:
            print(f"    {CYAN}{it['author']}{OFF} quiere {it['wants']}")
        for q in t.get("open_questions") or []:
            print(f"    {DIM}? {q}{OFF}")


async def main() -> None:
    script = load(sys.argv[1] if len(sys.argv) > 1 else None)
    started = time.time()
    calls = 0
    settled: list[str] = []

    print(f"{BOLD}replay · {len(script)} lineas{OFF}\n")

    for author, text, offset in script:
        chunk = {"author": author, "text": text, "ts": started + offset}

        if is_noise(chunk):
            print(f"{RED}✗{OFF} {DIM}{author}: {text}{OFF}  {RED}ruido{OFF}")
            continue

        print(f"{GREEN}·{OFF} {author}: {text}")
        store.add_chunk(SESSION, chunk)

        # The loop reconciles on a lull. Replaying has no real pauses, so we
        # use the gap the script itself declares.
        gap = next(
            (o - offset for _, _, o in script if o > offset), loop.QUIET_SEC
        )
        pending = len(store.get(SESSION).pending)
        if pending < loop.MAX_PENDING and gap < loop.QUIET_SEC:
            continue

        calls += 1
        ready = await reconcile(SESSION, store.take_pending(SESSION))
        for t in ready:
            settled.append(t["topic"])
            print(f"  {GREEN}→ settled:{OFF} {t['topic']}")
        print(f"{DIM}  ── pasada {calls} ──{OFF}")
        show_threads()
        print()

    if store.get(SESSION).pending:
        calls += 1
        await reconcile(SESSION, store.take_pending(SESSION))

    print(f"\n{BOLD}final{OFF}  ·  {calls} llamadas al modelo")
    show_threads()
    print(f"\n{DIM}settled: {settled or 'ninguno'}{OFF}")


if __name__ == "__main__":
    asyncio.run(main())
