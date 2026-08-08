"use client";

import IdeaNode from "./IdeaNode";
import type { Board } from "@/lib/board";
import { NODE_H, NODE_W, useBoardLayout } from "@/lib/layout";

type BoardGraphProps = {
  board: Board;
};

export default function BoardGraph({ board }: BoardGraphProps) {
  const { placed, place } = useBoardLayout(board);
  const at = new Map(placed.map((n) => [n.id, n]));

  return (
    <>
      {/* Edges sit under the notes and never intercept a click. */}
      <svg className="pointer-events-none absolute inset-0 size-full overflow-visible">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L8,4 L0,8 z" className="fill-neutral-400" />
          </marker>
        </defs>
        {board.edges.map((e) => {
          const a = at.get(e.source);
          const b = at.get(e.target);
          if (!a || !b) return null;
          return (
            <line
              key={`${e.source}->${e.target}`}
              x1={a.x + NODE_W / 2}
              y1={a.y + NODE_H / 2}
              x2={b.x + NODE_W / 2}
              y2={b.y + NODE_H / 2}
              markerEnd="url(#arrow)"
              className="stroke-neutral-300 dark:stroke-neutral-600"
              strokeWidth={2}
            />
          );
        })}
      </svg>

      {placed.map((node) => (
        <IdeaNode key={node.id} node={node} onMove={place} />
      ))}
    </>
  );
}
