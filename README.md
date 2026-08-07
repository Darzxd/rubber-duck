# rubber-duck

Hackathon monorepo (39h). Two independent apps that share only `shared/protocol.ts`.

## Layout

```
pizarra/
  web/       # frontend app (own deps, own build)
  agents/    # agents backend (own deps, own build)
  shared/
    protocol.ts   # single source of truth for the contract between web and agents
```

`web/` and `agents/` are fully independent — no shared `package.json`, no root
install, no workspace tooling. The only cross-app coupling is `shared/protocol.ts`.

## Setup

```bash
cp .env.example .env
```

Then set up each app on its own inside `web/` and `agents/`.

## Contract

Both apps import types from `../shared/protocol.ts`. Keep that file
dependency-free and treat any change to it as a breaking change that requires
updating both apps in the same commit.
