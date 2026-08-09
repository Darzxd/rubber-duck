"use client";

import { useEffect, useRef, useState } from "react";

import type { BoardElement } from "@/components/canvas/boardElements";

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

// What each kind of element needs on top of the common style fields. An
// element missing one of these would render as a hole in the board, so it
// never gets there — the renderer is Nico's and assumes they are present.
const SHAPE: Record<string, string[]> = {
  path: ["points"],
  rect: ["x", "y", "w", "h"],
  ellipse: ["x", "y", "w", "h"],
  triangle: ["x", "y", "w", "h"],
  arrow: ["x1", "y1", "x2", "y2"],
  text: ["x", "y", "text"],
  note: ["x", "y", "text", "tag", "tone"],
  image: ["x", "y", "w", "h", "src"],
  poll: ["x", "y", "question", "options"],
  table: ["x", "y", "cells", "cellW", "cellH"],
};

function isElement(v: unknown): v is BoardElement {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  if (typeof e.id !== "string" || typeof e.color !== "string") return false;
  if (typeof e.width !== "number" || typeof e.opacity !== "number") return false;
  const needs = SHAPE[e.kind as string];
  return Array.isArray(needs) && needs.every((key) => e[key] !== undefined);
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
  const [board, setBoard] = useState<Board>(EMPTY);
  const [notes, setNotes] = useState<Note[]>([]);
  const [brief, setBrief] = useState("");
  const [repo, setRepo] = useState<ConnectedRepo | null>(null);
  const [criticNotes, setCriticNotes] = useState<CriticNote[]>([]);
  // Frames can arrive out of order after a reconnect. An older revision would
  // undo a drawing the user already saw, so it never reaches the board. The
  // same revision may come twice: nodes first, arrows a moment later.
  const drawn = useRef(0);
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

        const drawing = data.board as Record<string, unknown> | undefined;
        if (
          drawing &&
          Array.isArray(drawing.elements) &&
          typeof drawing.revision === "number" &&
          drawing.revision >= drawn.current
        ) {
          drawn.current = drawing.revision;
          setBoard({
            revision: drawing.revision,
            elements: drawing.elements.filter(isElement),
          });
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
    drawn.current = 0;
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
      const { revision, elements, notes: pad, brief: text } = payload.content;

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
        if (typeof revision !== "number" || revision < checked.current) return;
        if (!Array.isArray(pad)) return;
        checked.current = revision;
        // The panel arrives whole every time, so this replaces rather than
        // appends: the server already decided which findings still stand.
        setCriticNotes(pad.filter(isCriticNote));
        return;
      }

      if (payload.event === "architect.draw") {
        if (typeof revision !== "number" || revision < drawn.current) return;
        if (!Array.isArray(elements)) return;
        drawn.current = revision;
        setBoard({ revision, elements: elements.filter(isElement) });
        return;
      }

      if (payload.event === "notetaker.pad") {
        if (typeof revision !== "number" || revision < written.current) return;
        if (!Array.isArray(pad)) return;
        written.current = revision;
        setNotes(pad.filter(isNote).map(toNote));
      }
    };

    return () => es.close();
  }, [sessionId]);

  return { board, notes, brief, repo, criticNotes };
}
