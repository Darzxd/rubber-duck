# CLAUDE.md — pizarra

Hackathon repo (39h). Move fast, keep the two apps independent.

## Structure

- `web/` — frontend app. Has its own deps and build. Do not add root-level tooling to manage it.
- `agents/` — agents backend. Has its own deps and build. Same rule.
- `shared/protocol.ts` — the ONLY file both apps import from. Must stay dependency-free.

## Rules

- Do NOT create a root `package.json`, workspace config (pnpm/yarn/npm workspaces, turbo, nx), or shared `node_modules`. The two apps are intentionally decoupled.
- Do NOT add anything to `shared/` other than the contract. No utils, no clients, no runtime code.
- Any change to `shared/protocol.ts` is a breaking change — update `web/` and `agents/` in the same commit.
- Env vars for both apps live in the root `.env` (see `.env.example`). Each app reads what it needs.
- Hackathon mode: favor working code over abstractions. Skip refactors unless something is actually blocking.
