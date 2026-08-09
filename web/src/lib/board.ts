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

export type NoteKind = "idea" | "decision" | "pregunta" | "pendiente";

/** One entry of the Notetaker's pad, already ordered by what it thinks matters. */
export type Note = {
  id: string;
  title: string;
  body: string;
  author: string;
  kind: NoteKind;
  weight: number;
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

/** One finding of the Critic. `path` is the evidence, not a decoration: a note
 * that cannot name a file the repo has never leaves the server. */
export type CriticNote = {
  id: string;
  point: string;
  about: string;
  text: string;
  path: string;
  stance: "existe" | "choca";
};

const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8000";

const EMPTY: Board = { revision: 0, elements: [] };

const KINDS: NoteKind[] = ["idea", "decision", "pregunta", "pendiente"];

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

function isNote(v: unknown): v is Note {
  if (typeof v !== "object" || v === null) return false;
  const n = v as Record<string, unknown>;
  return typeof n.id === "string" && typeof n.title === "string";
}

function toNote(v: Record<string, unknown>): Note {
  const kind = v.kind;
  return {
    id: v.id as string,
    title: v.title as string,
    body: typeof v.body === "string" ? v.body : "",
    author: typeof v.author === "string" ? v.author : "",
    kind: KINDS.includes(kind as NoteKind) ? (kind as NoteKind) : "idea",
    weight: typeof v.weight === "number" ? v.weight : 3,
  };
}

function isCriticNote(v: unknown): v is CriticNote {
  if (typeof v !== "object" || v === null) return false;
  const n = v as Record<string, unknown>;
  return (
    typeof n.id === "string" &&
    typeof n.text === "string" &&
    typeof n.path === "string"
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

export type SessionStream = {
  board: Board;
  notes: Note[];
  brief: string;
  repo: ConnectedRepo | null;
  criticNotes: CriticNote[];
};

/** One connection for every agent surface: each frame lands where it belongs. */
export function useSessionStream(sessionId: string): SessionStream {
  const [notes, setNotes] = useState<Note[]>([]);
  const [brief, setBrief] = useState("");
  const [repo, setRepo] = useState<ConnectedRepo | null>(null);
  const [criticNotes, setCriticNotes] = useState<CriticNote[]>([]);
  // The Architect's board is kept as its structured state and derived to
  // elements on render — a single mutable reducer plus a version counter that
  // triggers React updates whenever an op lands.
  const architect = useRef<ArchitectState>(emptyState());
  const [revision, setRevision] = useState(0);

  const written = useRef(0);
  const checked = useRef(0);

  // Whoever opens the link late still sees the pad and the brief: the stream
  // only carries what happens from now on.
  useEffect(() => {
    let live = true;
    fetch(`${AGENTS_URL}/digest/${sessionId}`)
      .then((r) => r.json())
      .then((data: Record<string, unknown>) => {
        if (!live) return;
        if (typeof data.brief === "string") setBrief(data.brief);
        setRepo(toRepo(data.repo));
        if (Array.isArray(data.criticNotes)) {
          setCriticNotes(data.criticNotes.filter(isCriticNote));
        }

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

        const pad = data.notepad as Record<string, unknown> | undefined;
        if (!pad || !Array.isArray(pad.notes)) return;
        if (typeof pad.revision !== "number") return;
        if (pad.revision < written.current) return;
        written.current = pad.revision;
        setNotes(pad.notes.filter(isNote).map(toNote));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [sessionId]);

  useEffect(() => {
    written.current = 0;
    checked.current = 0;
    const es = new EventSource(`${AGENTS_URL}/events/${sessionId}`);

    es.onmessage = (msg) => {
      let payload: Payload;
      try {
        payload = JSON.parse(msg.data) as Payload;
      } catch {
        return;
      }
      const { revision: rev, notes: pad, brief: text } = payload.content;

      if (payload.event === "session.brief") {
        if (typeof text === "string") setBrief(text);
        return;
      }

      if (payload.event === "session.repo") {
        const connected = toRepo(payload.content);
        if (connected) setRepo(connected);
        return;
      }

      if (payload.event === "critic.notes") {
        if (typeof rev !== "number" || rev < checked.current) return;
        if (!Array.isArray(pad)) return;
        checked.current = rev;
        // The panel arrives whole every time, so this replaces rather than
        // appends: the server already decided which findings still stand.
        setCriticNotes(pad.filter(isCriticNote));
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

      if (payload.event === "notetaker.pad") {
        if (typeof rev !== "number" || rev < written.current) return;
        if (!Array.isArray(pad)) return;
        written.current = rev;
        setNotes(pad.filter(isNote).map(toNote));
      }
    };

    return () => es.close();
  }, [sessionId]);

  // Elements are derived on every render from the reducer's state. React sees
  // a fresh array whenever the revision moves, which is when an op landed.
  const board: Board = {
    revision,
    elements: deriveElements(architect.current),
  };

  return { board, notes, brief, repo, criticNotes };
}
