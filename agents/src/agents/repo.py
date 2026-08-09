"""Reads a GitHub repo well enough for the agents to know what the team built.

The file tree and the README, over the public API — no cloning, no embeddings.
Somebody says "el cobro" and the point of this is that the agents can see there
is already a `lib/payments/` next to it.

The token, when there is one, belongs to whoever pasted it. It travels in a
header and is never stored, echoed back or logged."""

import base64
import logging
import re

import httpx

logger = logging.getLogger("agents.repo")

API = "https://api.github.com"

# People paste whatever the address bar had: the repo root, a file they were
# looking at, an ssh remote. Everything after the name is somebody's browsing
# history, not part of the repo.
_URL = re.compile(
    r"(?:https?://)?(?:www\.)?github\.com[/:]([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)"
)
_SHORT = re.compile(r"^([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)$")

# Directories that are somebody else's code or build output. Left in, they eat
# the whole budget and say nothing about what this team decided.
_SKIP_DIRS = {
    "node_modules", ".git", ".next", "dist", "build", "out", "vendor",
    "__pycache__", ".venv", "venv", "target", "coverage", ".turbo",
    ".pytest_cache", ".mypy_cache", "site-packages",
    # Configuration for coding assistants. It says what tools the team uses,
    # never what the product is, and it is bulky enough to crowd out src/.
    ".agents", ".claude", ".cursor", ".vscode", ".idea",
}

# Files nobody reads to understand a codebase.
_SKIP_EXT = {
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".avif",
    ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".pdf", ".zip",
    ".lock", ".map", ".snap", ".min.js", ".min.css",
}

# What the Critic gets to look at. Past this the list stops being readable and
# starts being a bill.
MAX_FILES = 300
# The README is a pitch as often as it is documentation; the top of it is the
# part that says what the thing is.
MAX_README = 1500


class RepoError(Exception):
    """Carries the reason the front has to act on, not a message to show."""

    def __init__(self, reason: str):
        # needs_token | not_found | rate_limited | bad_url | unreachable
        self.reason = reason
        super().__init__(reason)


def parse_url(url: str) -> tuple[str, str]:
    text = url.strip().rstrip("/")
    match = _URL.search(text) or _SHORT.match(text)
    if not match:
        raise RepoError("bad_url")
    name = match.group(2)
    return match.group(1), name[:-4] if name.endswith(".git") else name


def _interesting(path: str) -> bool:
    parts = path.split("/")
    if any(p in _SKIP_DIRS for p in parts[:-1]):
        return False
    name = parts[-1]
    return not any(name.endswith(ext) for ext in _SKIP_EXT)


def _headers(token: str) -> dict[str, str]:
    head = {"Accept": "application/vnd.github+json"}
    if token:
        head["Authorization"] = f"Bearer {token}"
    return head


def _raise_for(status: int, token: str) -> None:
    if status == 404:
        # GitHub answers 404 for a private repo you cannot see, so that nobody
        # can enumerate what exists. Private and missing are the same answer.
        raise RepoError("not_found" if token else "needs_token")
    if status in (401, 403):
        raise RepoError("rate_limited" if not token else "needs_token")
    raise RepoError("unreachable")


async def fetch(url: str, token: str = "") -> dict:
    """Returns the index, or raises RepoError with a reason the front can use."""
    owner, name = parse_url(url)
    headers = _headers(token)

    async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
        try:
            meta = await client.get(f"{API}/repos/{owner}/{name}")
        except httpx.HTTPError:
            raise RepoError("unreachable")
        if meta.status_code >= 400:
            _raise_for(meta.status_code, token)
        info = meta.json()
        branch = info.get("default_branch") or "main"

        tree_res = await client.get(
            f"{API}/repos/{owner}/{name}/git/trees/{branch}",
            params={"recursive": "1"},
        )
        files: list[str] = []
        truncated = False
        if tree_res.status_code < 400:
            body = tree_res.json()
            truncated = bool(body.get("truncated"))
            files = [
                node["path"]
                for node in body.get("tree", [])
                if node.get("type") == "blob" and _interesting(node.get("path", ""))
            ]

        readme = ""
        readme_res = await client.get(f"{API}/repos/{owner}/{name}/readme")
        if readme_res.status_code < 400:
            raw = readme_res.json().get("content", "")
            try:
                readme = base64.b64decode(raw).decode("utf-8", "replace")
            except ValueError:
                readme = ""

    logger.info(
        "indexed %s/%s: %s files%s", owner, name, len(files),
        " (tree truncated)" if truncated else "",
    )
    return {
        "url": f"https://github.com/{owner}/{name}",
        "owner": owner,
        "name": name,
        "description": (info.get("description") or "").strip(),
        "language": info.get("language") or "",
        "readme": readme[:MAX_README].strip(),
        "files": sorted(files)[:MAX_FILES],
        "total_files": len(files),
        "private": bool(info.get("private")),
    }


def summary(index: dict | None) -> str:
    """The short view every agent gets: what the thing is, not what is in it.

    The full file list is the Critic's business — it is the only one that has
    to name a path. Handing it to the Organizer would spend its 3s budget on
    text that cannot change what it writes."""
    if not index:
        return ""
    top: list[str] = []
    for path in index["files"]:
        head = path.split("/")[0] if "/" in path else path
        if head not in top:
            top.append(head)
    lines = [f"Repo: {index['owner']}/{index['name']}"]
    if index["language"]:
        lines.append(f"Lenguaje principal: {index['language']}")
    if index["description"]:
        lines.append(f"Descripción: {index['description']}")
    if top:
        lines.append(f"Estructura: {', '.join(top[:20])}")
    if index["readme"]:
        lines.append(f"README (recortado):\n{index['readme'][:700]}")
    return "\n".join(lines)
