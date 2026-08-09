"use client";

import type { KnownAgent } from "@/lib/board";

const COLOUR: Record<KnownAgent, string> = {
  architect: "#3b82f6",
  critic: "#f97316",
};

const LABEL: Record<KnownAgent, string> = {
  architect: "Architect",
  critic: "Critic",
};

/** A floating pointer that shows where an agent is about to act on the board.
 *
 * The transform transitions smoothly, so the cursor is seen sliding from the
 * last op to the next — the way another person's cursor moves in a shared
 * doc, not a jump-cut. */
export default function AgentCursor({
  agent,
  x,
  y,
}: {
  agent: KnownAgent;
  x: number;
  y: number;
}) {
  const colour = COLOUR[agent];
  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-40 flex items-start gap-1 transition-transform duration-300 ease-out"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg
        viewBox="0 0 16 16"
        width="18"
        height="18"
        aria-hidden="true"
        style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.28))" }}
      >
        <path
          d="M2 2 L2 12 L5 9 L8 14 L10 13 L7 8 L12 8 Z"
          fill={colour}
          stroke="#ffffff"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="mt-3 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: colour }}
      >
        {LABEL[agent]}
      </span>
    </div>
  );
}
