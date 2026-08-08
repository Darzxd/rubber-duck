"""Replays the scripted meeting through the real Organizer so we can read the
summary it builds and keep tuning the prompt.

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
from agents.nodes.organizer import is_noise, summarize  # noqa: E402
from fixtures.meeting import SCRIPT  # noqa: E402

SESSION = "replay"

DIM = "\033[2m"
BOLD = "\033[1m"
RED = "\033[31m"
GREEN = "\033[32m"
CYAN = "\033[36m"
OFF = "\033[0m"


def load(path: str | None) -> list[tuple[str, str, float]]:
    if not path:
        return SCRIPT
    lines = Path(path).read_text(encoding="utf-8").splitlines()
    out = []
    for i, line in enumerate(line for line in lines if line.strip()):
        author, _, text = line.partition(":")
        out.append((author.strip(), text.strip(), i * 2.0))
    return out


def show_digest() -> None:
    digest = store.get(SESSION).digest
    if not digest["points"]:
        print(f"  {DIM}(sin resumen todavia){OFF}")
        return
    print(f"  {BOLD}{digest['summary']}{OFF}  {DIM}rev {digest['revision']}{OFF}")
    for p in digest["points"]:
        print(f"    {CYAN}{p['author']}{OFF} {p['text']}")


async def main() -> None:
    script = load(sys.argv[1] if len(sys.argv) > 1 else None)
    started = time.time()
    calls = 0
    redraws = 0

    print(f"{BOLD}replay · {len(script)} lineas{OFF}\n")

    for author, text, offset in script:
        chunk = {"author": author, "text": text, "ts": started + offset}

        if is_noise(chunk):
            print(f"{RED}✗{OFF} {DIM}{author}: {text}{OFF}  {RED}ruido{OFF}")
            continue

        print(f"{GREEN}·{OFF} {author}: {text}")
        store.add_chunk(SESSION, chunk)

        # The live loop debounces before it summarizes. Replaying has no real
        # pauses, so we use the gap the script itself declares: anything said
        # inside the debounce window rides along in the same pass.
        gap = next((o - offset for _, _, o in script if o > offset), loop.IDLE_SEC)
        if gap < loop.DEBOUNCE_SEC:
            continue

        store.take_pending(SESSION)
        calls += 1
        digest = await summarize(SESSION)
        if digest is None:
            print(f"{DIM}  ── pasada {calls}: sin cambios ──{OFF}\n")
            continue
        redraws += 1
        print(f"{DIM}  ── pasada {calls} ──{OFF}")
        show_digest()
        print()

    if store.get(SESSION).pending:
        store.take_pending(SESSION)
        calls += 1
        if await summarize(SESSION) is not None:
            redraws += 1

    print(f"\n{BOLD}final{OFF}  ·  {calls} llamadas al modelo  ·  {redraws} redibujos")
    show_digest()


if __name__ == "__main__":
    asyncio.run(main())
