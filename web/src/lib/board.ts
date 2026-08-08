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

const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8000";

const EMPTY: Board = { revision: 0, nodes: [], edges: [] };

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

export function useBoardEvents(sessionId: string): Board {
  const [board, setBoard] = useState<Board>(EMPTY);
  // Frames can arrive out of order after a reconnect. An older revision would
  // undo a drawing the user already saw, so it never reaches the board. The
  // same revision may come twice: nodes first, arrows a moment later.
  const seen = useRef(0);

  useEffect(() => {
    seen.current = 0;
    const es = new EventSource(`${AGENTS_URL}/events/${sessionId}`);

    es.onmessage = (msg) => {
      let payload: Payload;
      try {
        payload = JSON.parse(msg.data) as Payload;
      } catch {
        return;
      }
      if (payload.event !== "architect.draw") return;

      const { revision, nodes, edges } = payload.content;
      if (typeof revision !== "number" || revision < seen.current) return;
      if (!Array.isArray(nodes)) return;
      seen.current = revision;

      setBoard({
        revision,
        nodes: nodes.filter(isNode),
        edges: Array.isArray(edges) ? edges.filter(isEdge) : [],
      });
    };

    return () => es.close();
  }, [sessionId]);

  return board;
}
