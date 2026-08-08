# CLAUDE.md

Collaborative whiteboard that fills itself while a product team talks. Built for a 39-hour hackathon (Portal, Aug 7–9 2026). Two people. The goal is to win.

---

## ⚠️ Read this first

Every session starts with the person identifying themselves: **"soy Ignacio"** or **"soy Nico"**. Do not start work until you know who you are talking to — the role decides the branch, the scope, and the answer.

If nobody said it yet, ask. One line: *"¿Ignacio o Nico?"*

---

## Who we are

**Ignacio** — everything that is not design: the four agents, the repo index, the canvas internals (the six tools, layout), sessions, persistence, Portal wiring, deployment. Works on `main`.

**Nico** — design only: visual structure of the canvas, per-author colors, first-entry flow (asking for microphone permission), the create/share link screen, the read-only view. Does not touch sessions, agents, or Portal. Works on `nico-branch`.

Nico is still getting comfortable with Claude Code. When working with him:

- Give complete, ready-to-run files. No fragments, no "add this somewhere in your component".
- Always say the exact file path where the code goes, and whether the file is new or edited.
- One step at a time. Wait for him to confirm it works before moving to the next.
- Do not assume terminal or git knowledge — write out the exact command to run.
- If something breaks, ask what he sees on screen before guessing.
- He will ask questions as he designs. Answer them, do not redirect him to docs.

If Nico asks something about backend, give the short answer and say it belongs to Ignacio.

---

## What we are building

Several people join a session by link — no login, they just type their name. Their browsers capture the microphone and publish the live transcript. Four agents listen:

- **Organizer** — groups the conversation into topic threads and dispatches each thread once it settles. Filters out what does not deserve the canvas. It is the only one that dispatches, so it controls the pace.
- **Architect** — turns a settled thread into nodes and connections. Only draws what was said.
- **Critic** — checks proposals against the team's GitHub repo and sticks short notes with a file path. No evidence in the code, no note.
- **Scribe** — keeps live lists of decisions, open items, and open questions.

When the session closes, a read-only link remains with the canvas and the decisions.

---

## Closed decisions (do not re-litigate)

- Web. Each browser captures its own microphone.

---

## Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Canvas:** React Flow for rendering, dagre for layout
- **Realtime:** Portal (transcription, canvas ops, thread state, scribe lists, agent dispatch, presence)
- **Transcription capture:** Web Speech API in each browser
- **Persistence:** Supabase — one table, `sessions(id, name, created_at, snapshot jsonb, closed_at)`
- **Deploy:** Vercel

Node 20+. Package manager: `npm`.

---

## Running it locally

```bash
npm install
cp .env.local.example .env.local   # fill in the keys
npm run dev                        # http://localhost:3000
```

- `.env.local` is gitignored and **never** committed. `.env.local.example` holds the key names with empty values.
- Microphone capture needs a secure context: `localhost` works in dev, everything else needs HTTPS.
- The deployed origin must be registered in Portal or the browser blocks the connection. Deploy on day one with the app empty, get the URL, register it — do not leave this for the end.

---

## Frontend rules

- **Everything is a component. No full-page files.** A page composes components, it does not contain markup. If a file is growing past ~150 lines, it is holding a component that has not been extracted yet.
- One component per file, named after the component.
- Components live in `components/`, grouped by area: `components/canvas/`, `components/session/`, `components/agents/`.
- Pages under `app/` only wire components together and handle routing.
- Presentational components take props and render. No data fetching, no Portal subscriptions inside them.

---

## Hard constraints

- Only commits between **Friday 19:00 and Sunday 10:00 (UTC-5)** count.
- Must be deployed and working, not localhost. The domain origin must be registered in Portal or the browser blocks it.
- Public GitHub repo. The secret key is never committed.
- Recorded demo: **90 seconds max**.
- Submission: Sunday before 10:00.

---

## Git workflow

Two people, one repo, no time for merge archaeology.

- **Ignacio commits to `main`. Nico commits to `nico-branch`.** Never the other way around.
- **Before pushing anything, check `main` for new commits.** `git fetch origin && git log --oneline HEAD..origin/main`. If there is something new, pull it first.
- **Nico rebases on `main` regularly** (`git pull --rebase origin main`) so the branch never drifts far. Small, frequent syncs — not one big merge at hour 30.
- **Ignacio pulls Nico's branch regularly too** so both sides stay level. Nobody discovers a conflict at the end.
- Merge `nico-branch` into `main` often, in small pieces. A branch that lives 20 hours without merging is a failed branch.
- No `git commit --amend` on commits already made, unless explicitly told.

---

## Committing while you work

- **Commit every time something new works.** Not at the end of the day, not when the feature is "done" — every working piece.
- A new component that renders = a commit. A color scheme applied = a commit. A button that does its thing = a commit.
- Small commits are how we roll back fast when something breaks at 3am. A 6-hour commit is a 6-hour rollback.
- Nico: commit on `nico-branch` constantly. If you have been working for 30 minutes without committing, commit now.

---

## Commits

Format:

```
type(scope): message
```

- **8 to 10 words maximum**, in English, imperative mood.
- `type`: `feat`, `fix`, `refactor`, `chore`, `style`, `docs`.
- `scope`: the part of the system touched — `organizer`, `architect`, `critic`, `scribe`, `canvas`, `tools`, `session`, `portal`, `ui`, `deploy`.

Good:

```
feat(architect): turn settled thread into nodes and edges
fix(canvas): keep human-moved node anchored on relayout
style(ui): set per-author color on sticky notes
```

Bad:

```
several improvements
wip
update files
```

**Never** add credits, signatures, footers, or any mention of Claude / Anthropic / AI. No `Co-Authored-By`, no `🤖 Generated with Claude Code`, no `Assisted by`. Just the clean message.

---

## Language

- All code, names, comments, commit messages, and README in **English**.
- Our conversation stays in Spanish. What ends up written in the repo does not.

---

## Tests

- Test what the demo depends on, nothing else. A broken canvas op kills the demo; an untested helper does not.
- Priority order: the six canvas tools (`crear_nodo`, `conectar`, `editar_nodo`, `mover_nodo`, `pegar_nota`, `borrar`), then session join/close, then agent output parsing.
- Agent output must be tested against malformed responses. An agent returning bad JSON mid-demo must not crash the canvas — it must be ignored.
- Tests live under `tests/`, mirroring the structure of the code they cover.
- Real verification is still two browser tabs and a microphone. Passing tests is not proof the demo works.

---

## 🔒 Operating protocols

Permanent rules. They apply to every session, no exceptions.

### 1. Verifiable closure

No task or session is finished on the agent's narrative report. Before closing, print this block and let the human confirm it:

```
Shipped:     (what got done)
Tested:      (what was tested and how)
Failed:      (what broke)
Unverified:  (what was NOT verified yet)
Next:        (what comes next)
```

"Tests pass" is not closure. Closure explicitly includes what was left unverified. If `Unverified` is empty, justify it — there is almost always something.

### 2. Destructive actions need a written rollback

Before any `git push --force`, deleting files or folders, `git reset --hard`, touching the deployed app, dropping a table, or anything that destroys state, answer these four in writing first:

```
What can be lost?
What backup exists?
How do I go back?
Which commit or branch is the rollback point?
```

Without those four answers, do not execute. Then ask the human for explicit confirmation. "I'm going to do it, just letting you know" is not confirmation.

### 3. Secrets and credentials

Never treat real credentials as ordinary setup data. Never print secrets to logs or stdout. Before writing or committing any file that might contain credentials, check:

```
Are there real tokens or credentials in this file?
Is it in .gitignore?
Is there a separate .env.local.example with no real values?
Did I print any secret to logs or output?
Does anything need rotating (because it leaked, even briefly)?
```

If the answer to "did I print a secret" is yes — even for a second, even in a discarded run — rotate it. There is no "it barely happened". The repo is public: `.env.local`, tokens, API keys, the Portal secret key are never committed, never logged, never pasted elsewhere.

### 4. Debug protocol — no blind retries

If a command fails, repeating the same command hoping for a different result is forbidden. Instead:

1. State which assumption failed (what you believed was true and was not).
2. Give three possible alternative paths.
3. Pick the safest one and say why.
4. Verify with a non-interactive command before re-running the original operation.

"Let's try again", "maybe it was intermittent", "I'll retry" are banned as responses to an error. Diagnose first, act after.

### 5. Audits with verifiable sources

When asked to read or audit long files thoroughly, before any summary, print:

```
Lines read with exact offsets (e.g. lines 1-200, 201-400).
Files or sections skipped, if any, and why.
One exact quote backing each conclusion.
```

"I read it all" is not accepted without that evidence. If you did not read the whole file — context limits or choice — say so and list what was left out. Respect the ranges the human sets: if asked to audit lines X–Y, do not extrapolate beyond them.

### 6. Product rules written before, not after

Before any UI, copy, user-facing message, or product decision, the standard gets written first:

```
Who is the user?
What tone do we use?
What do we NOT do?
```

Do not improvise product. If the rule is not written in this file or in the repo, ask for it before acting. This applies especially to error copy, empty states, the microphone permission prompt, agent system prompts, and anything a session participant will read on screen.

---

## How to help

- A working demo beats clean code. Always.
- If something can be cut, say so **before** helping to build it.
- Synthetic data and decent prompts are enough. Nobody is auditing accuracy.
- Call it out when we are over-tuning a prompt instead of shipping.
- Short answers. We are against the clock.