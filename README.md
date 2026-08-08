# Collaborative whiteboard

A whiteboard that fills itself while a product team talks. People join a session by link — no login, they just type their name. Their browsers capture the microphone and publish the live transcript, and four agents listen and draw: an Organizer that groups the conversation into threads, an Architect that turns settled threads into nodes and connections, a Critic that checks proposals against the team's GitHub repo, and a Scribe that keeps live lists of decisions, open items and questions.

When the session closes, a read-only link remains with the canvas and the decisions.

Built for the Portal hackathon, August 7–9 2026.

## Stack

Next.js (App Router) + React + TypeScript, Tailwind CSS, React Flow with dagre for canvas layout, Portal for realtime, Supabase for session persistence, deployed on Vercel.

## Setup

Requires Node 20+.

```bash
npm install
cp .env.local.example .env.local   # fill in the keys
npm run dev                        # http://localhost:3000
```

`.env.local` is gitignored and must never be committed. `.env.local.example` holds the key names with empty values.

Microphone capture needs a secure context — `localhost` works in dev, anything else needs HTTPS. The deployed origin has to be registered in Portal or the browser blocks the connection.

## Working in this repo

**Branches.** Ignacio commits to `main`, Nico commits to `nico-branch`. Before pushing, always check `main` for new commits and pull first. Merge `nico-branch` into `main` often, in small pieces.

**Commit constantly.** Every time something new works, commit. A component that renders, a color scheme applied, a button doing its thing — each one is a commit. Do not save it all for the end: small commits are what let us roll back fast when something breaks. If you have been working 30 minutes without committing, commit now.

**Commit format.** `type(scope): message`, 8 to 10 words max, English, imperative.

```
feat(architect): turn settled thread into nodes and edges
fix(canvas): keep human-moved node anchored on relayout
style(ui): set per-author color on sticky notes
```

Types: `feat`, `fix`, `refactor`, `chore`, `style`, `docs`. Scopes: `organizer`, `architect`, `critic`, `scribe`, `canvas`, `tools`, `session`, `portal`, `ui`, `deploy`.

**Components, not pages.** Everything is a component. Pages under `app/` only compose components and handle routing — they hold no markup of their own. One component per file, grouped by area under `components/`.
