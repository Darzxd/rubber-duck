"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dagre from "@dagrejs/dagre";
import type { Board, BoardEdge, BoardNode } from "./board";

export const NODE_W = 208;
export const NODE_H = 104;

/** Where the graph starts inside the endless surface. */
const ORIGIN_X = 120;
const ORIGIN_Y = 100;

/**
 * How long a node stays where a human left it before the layout is allowed to
 * think about it again. Nothing is more hostile than a board that moves the
 * thing you are pointing at.
 */
const HUMAN_LOCK_MS = 10_000;

export type Placed = BoardNode & { x: number; y: number };

export type Point = { x: number; y: number };

function run(
  nodes: BoardNode[],
  edges: BoardEdge[],
  fixed: Map<string, Point>,
): Placed[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 56, ranksep: 88, marginx: 0, marginy: 0 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  }
  dagre.layout(g);

  return nodes.map((n) => {
    const held = fixed.get(n.id);
    if (held) return { ...n, ...held };
    const { x, y } = g.node(n.id);
    // dagre reports centres; the DOM wants a corner.
    return { ...n, x: ORIGIN_X + x - NODE_W / 2, y: ORIGIN_Y + y - NODE_H / 2 };
  });
}

/**
 * Turns a board into placed nodes. New ideas get a spot from dagre; anything
 * already on screen keeps its own while the human lock holds.
 */
export function useBoardLayout(board: Board) {
  const [placed, setPlaced] = useState<Placed[]>([]);
  const moved = useRef(new Map<string, Point>());
  const lockedUntil = useRef(0);
  const positions = useRef(new Map<string, Point>());

  useEffect(() => {
    const fixed = new Map(moved.current);
    if (Date.now() < lockedUntil.current) {
      for (const [id, p] of positions.current) if (!fixed.has(id)) fixed.set(id, p);
    }

    const next = run(board.nodes, board.edges, fixed);
    positions.current = new Map(next.map((n) => [n.id, { x: n.x, y: n.y }]));
    setPlaced(next);
  }, [board]);

  const place = useCallback((id: string, at: Point) => {
    moved.current.set(id, at);
    positions.current.set(id, at);
    lockedUntil.current = Date.now() + HUMAN_LOCK_MS;
    setPlaced((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...at } : n)),
    );
  }, []);

  return { placed, place };
}
