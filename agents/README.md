# agents

Python + FastAPI + LangGraph. Runs the four agents (Organizer, Architect, Critic, Scribe) as a single service.

## Run

```bash
uv sync
uv run agents          # uvicorn on $AGENTS_PORT (default 8000), --reload
# or
uv run uvicorn agents.main:app --reload --port 8000
```

Env vars come from `../.env` (root) or `./.env`. See `../.env.example`.

## Endpoints

- `GET /health` — liveness.
- `POST /ingest` — receive a transcript chunk: `{ session_id, author, text, ts }`. Runs it through the graph.

## Graph

`START → organizer → { architect | critic | scribe }* → END`

Organizer is the only node that dispatches. Architect / Critic / Scribe run in parallel on a settled thread and publish their outputs to the Portal channel.

## Portal

`portal.publish(channel_id, event, content)` POSTs to `PORTAL_API_URL/v1/publish` with `PORTAL_SECRET`. When `PORTAL_SECRET` is empty, publish is a no-op — safe for local dev without hitting Portal.
