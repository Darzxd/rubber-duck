"use client";

import { useEffect, useRef, useState } from "react";

import type { BoardElement } from "@/components/canvas/boardElements";
import {
  applyOp,
  deriveElements,
  emptyState,
  fromSnapshot,
  isArchitectOp,
  type ArchitectSnapshot,
  type ArchitectState,
} from "@/lib/architectBoard";

export type Board = {
  revision: number;
  elements: BoardElement[];
};

/** The team's repo once somebody connected it. The file list stays on the
 * server: what the board needs to know is which repo, not what is in it. */
export type ConnectedRepo = {
  url: string;
  owner: string;
  name: string;
  description: string;
  language: string;
  files: number;
  private: boolean;
};

const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8000";

type Payload = { event: string; content: Record<string, unknown> };

function isSnapshot(v: unknown): v is ArchitectSnapshot {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    Array.isArray(s.nodes) &&
    Array.isArray(s.annotations) &&
    Array.isArray(s.arrows) &&
    Array.isArray(s.titles)
  );
}

function toRepo(v: unknown): ConnectedRepo | null {
  if (typeof v !== "object" || v === null) return null;
  const r = v as Record<string, unknown>;
  if (typeof r.owner !== "string" || typeof r.name !== "string") return null;
  return {
    url: typeof r.url === "string" ? r.url : "",
    owner: r.owner,
    name: r.name,
    description: typeof r.description === "string" ? r.description : "",
    language: typeof r.language === "string" ? r.language : "",
    files: typeof r.files === "number" ? r.files : 0,
    private: r.private === true,
  };
}

/** One agent's cursor as it moves across the pizarra. The `x/y` are in board
 *  coordinates, so the pointer sits on the sticky it just placed. */
export type AgentCursorState = { x: number; y: number };

export type KnownAgent = "architect" | "critic";

export type SessionStream = {
  board: Board;
  brief: string;
  repo: ConnectedRepo | null;
  cursors: Partial<Record<KnownAgent, AgentCursorState>>;
};

const KNOWN_AGENTS: KnownAgent[] = ["architect", "critic"];
// How long a cursor stays visible after the last op. Long enough for the eye
// to catch the move, short enough that a quiet agent does not leave a ghost
// sitting on the last sticky it touched.
const CURSOR_TIMEOUT_MS = 3000;

/** One connection for the pizarra: bootstraps from /digest and folds every
 *  agent op into a reducer that renders as canvas primitives. */
export function useSessionStream(sessionId: string): SessionStream {
  const [brief, setBrief] = useState("");
  const [repo, setRepo] = useState<ConnectedRepo | null>(null);
  // The Architect's board is kept as its structured state and derived to
  // elements on render — a single mutable reducer plus a version counter that
  // triggers React updates whenever an op lands.
  const architect = useRef<ArchitectState>(emptyState());
  const [revision, setRevision] = useState(0);
  const [cursors, setCursors] = useState<
    Partial<Record<KnownAgent, AgentCursorState>>
  >({});
  // A pending clear timer per agent, so a burst of cursor updates keeps
  // resetting the same countdown instead of blinking off between ops.
  const cursorTimers = useRef<
    Partial<Record<KnownAgent, ReturnType<typeof setTimeout>>>
  >({});

  // Whoever opens the link late still sees the pizarra and the brief: the
  // stream only carries what happens from now on.
  useEffect(() => {
    let live = true;
    fetch(`${AGENTS_URL}/digest/${sessionId}`)
      .then((r) => r.json())
      .then((data: Record<string, unknown>) => {
        if (!live) return;
        if (typeof data.brief === "string") setBrief(data.brief);
        setRepo(toRepo(data.repo));

        // The structured snapshot is authoritative for a late-joiner. Ops
        // that arrive after this reflect changes since it was taken.
        const snapshot = data.architectBoard;
        if (isSnapshot(snapshot)) {
          architect.current = fromSnapshot(snapshot);
          const digest = data.digest as Record<string, unknown> | undefined;
          const rev =
            digest && typeof digest.revision === "number" ? digest.revision : 0;
          setRevision(rev);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [sessionId]);

  useEffect(() => {
    const es = new EventSource(`${AGENTS_URL}/events/${sessionId}`);

    es.onmessage = (msg) => {
      let payload: Payload;
      try {
        payload = JSON.parse(msg.data) as Payload;
      } catch {
        return;
      }
      const { revision: rev, brief: text } = payload.content;

      if (payload.event === "session.brief") {
        if (typeof text === "string") setBrief(text);
        return;
      }

      if (payload.event === "session.repo") {
        const connected = toRepo(payload.content);
        if (connected) setRepo(connected);
        return;
      }

      if (payload.event === "architect.op") {
        const op = payload.content.op;
        if (!isArchitectOp(op)) return;
        architect.current = applyOp(architect.current, op);
        // Bump the revision so React re-renders. Using the op's revision when
        // present keeps the counter in sync with the backend, but any change
        // will do here — the state itself is the source of truth.
        setRevision((prev) => (typeof rev === "number" ? rev : prev + 1));
        return;
      }

      if (payload.event === "agent.cursor") {
        const c = payload.content;
        const agent = c.agent;
        if (
          typeof agent !== "string" ||
          !KNOWN_AGENTS.includes(agent as KnownAgent) ||
          typeof c.x !== "number" ||
          typeof c.y !== "number"
        ) {
          return;
        }
        const known = agent as KnownAgent;
        setCursors((prev) => ({
          ...prev,
          [known]: { x: c.x as number, y: c.y as number },
        }));
        const timer = cursorTimers.current[known];
        if (timer) clearTimeout(timer);
        cursorTimers.current[known] = setTimeout(() => {
          setCursors((prev) => {
            const next = { ...prev };
            delete next[known];
            return next;
          });
          delete cursorTimers.current[known];
        }, CURSOR_TIMEOUT_MS);
      }
    };

    return () => {
      es.close();
      // Drop any pending cursor-clear timers so an unmount does not schedule
      // work into a component that no longer exists.
      for (const t of Object.values(cursorTimers.current)) {
        if (t) clearTimeout(t);
      }
      cursorTimers.current = {};
    };
  }, [sessionId]);

  // Elements are derived on every render from the reducer's state. React sees
  // a fresh array whenever the revision moves, which is when an op landed.
  const board: Board = {
    revision,
    elements: deriveElements(architect.current),
  };

  return { board, brief, repo, cursors };
}
