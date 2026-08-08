"use client";

import { useEffect, useRef, useState } from "react";

export type BoardNode = {
  id: string;
  label: string;
  author?: string;
};

export type BoardEdge = {
  source: string;
  target: string;
  label?: string;
};

export type Board = {
  revision: number;
  nodes: BoardNode[];
  edges: BoardEdge[];
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

const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8000";

const EMPTY: Board = { revision: 0, nodes: [], edges: [] };

const KINDS: NoteKind[] = ["idea", "decision", "pregunta", "pendiente"];

type Payload = { event: string; content: Record<string, unknown> };

function isNode(v: unknown): v is BoardNode {
  if (typeof v !== "object" || v === null) return false;
  const n = v as Record<string, unknown>;
  return typeof n.id === "string" && typeof n.label === "string";
}

function isEdge(v: unknown): v is BoardEdge {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return typeof e.source === "string" && typeof e.target === "string";
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

export type SessionStream = {
  board: Board;
  notes: Note[];
  brief: string;
};

/** One connection for every agent surface: each frame lands where it belongs. */
export function useSessionStream(sessionId: string): SessionStream {
  const [board, setBoard] = useState<Board>(EMPTY);
  const [notes, setNotes] = useState<Note[]>([]);
  const [brief, setBrief] = useState("");
  // Frames can arrive out of order after a reconnect. An older revision would
  // undo a drawing the user already saw, so it never reaches the board. The
  // same revision may come twice: nodes first, arrows a moment later.
  const drawn = useRef(0);
  const written = useRef(0);

  // Whoever opens the link late still sees the pad and the brief: the stream
  // only carries what happens from now on.
  useEffect(() => {
    let live = true;
    fetch(`${AGENTS_URL}/digest/${sessionId}`)
      .then((r) => r.json())
      .then((data: Record<string, unknown>) => {
        if (!live) return;
        if (typeof data.brief === "string") setBrief(data.brief);
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
    const es = new EventSource(`${AGENTS_URL}/events/${sessionId}`);

    es.onmessage = (msg) => {
      let payload: Payload;
      try {
        payload = JSON.parse(msg.data) as Payload;
      } catch {
        return;
      }
      const { revision, nodes, edges, notes: pad, brief: text } = payload.content;

      if (payload.event === "session.brief") {
        if (typeof text === "string") setBrief(text);
        return;
      }

      if (payload.event === "architect.draw") {
        if (typeof revision !== "number" || revision < drawn.current) return;
        if (!Array.isArray(nodes)) return;
        drawn.current = revision;
        setBoard({
          revision,
          nodes: nodes.filter(isNode),
          edges: Array.isArray(edges) ? edges.filter(isEdge) : [],
        });
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

  return { board, notes, brief };
}
