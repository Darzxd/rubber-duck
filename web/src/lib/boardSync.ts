"use client";

import { useCallback, useEffect, useRef } from "react";
import { useChannel } from "@portalsdk/react";
import type { BoardElement } from "@/components/canvas/boardElements";

/** Every change is sent as the affected elements in full, never as a delta, so
 * a dropped or reordered message cannot leave two boards disagreeing. */
export type BoardOp =
  | { k: "u"; els: BoardElement[] }
  | { k: "d"; ids: string[] };

/** Stamped on every op so a browser can tell its own echo apart. Portal's own
 * sender id cannot do this job: two tabs of one profile share the anonymous
 * token, so they arrive as the same user and each would ignore the other. */
type Sourced = BoardOp & { src: string };

// Portal caps a payload at 2KB. A long pen stroke is thinned until it fits
// rather than dropped: a slightly coarser curve beats a missing one.
const MAX_BYTES = 1900;
const THIN_ATTEMPTS = 6;

/** Sub-pixel precision costs bytes and buys nothing at any usable zoom. */
function round(element: BoardElement): BoardElement {
  if (element.kind !== "path") return element;
  return {
    ...element,
    points: element.points.map((p) => ({
      x: Math.round(p.x),
      y: Math.round(p.y),
    })),
  };
}

/** Drops every other point, keeping the ends so the stroke still starts and
 * finishes where it was drawn. */
function thin(element: BoardElement): BoardElement {
  if (element.kind !== "path" || element.points.length < 8) return element;
  const last = element.points.length - 1;
  return {
    ...element,
    points: element.points.filter((_, i) => i % 2 === 0 || i === last),
  };
}

function fit(op: BoardOp): BoardOp | null {
  let candidate: BoardOp =
    op.k === "u" ? { k: "u", els: op.els.map(round) } : op;
  for (let attempt = 0; attempt < THIN_ATTEMPTS; attempt++) {
    if (JSON.stringify(candidate).length <= MAX_BYTES) return candidate;
    if (candidate.k !== "u") return null;
    candidate = { k: "u", els: candidate.els.map(thin) };
  }
  return null;
}

function isSourced(v: unknown): v is Sourced {
  if (typeof v !== "object" || v === null) return false;
  const op = v as Record<string, unknown>;
  if (typeof op.src !== "string") return false;
  if (op.k === "u") return Array.isArray(op.els);
  if (op.k === "d") return Array.isArray(op.ids);
  return false;
}

/**
 * What the people in the room draw, over a Portal channel of its own. The
 * agents' pizarra arrives on the server stream instead; this one has no
 * backend behind it, so a browser is all it takes to see a teammate's stroke.
 *
 * Persistent messages are used rather than the activity signal the cursors
 * ride: activity is throttled per kind and expires after 5s, and a drawing has
 * to survive. The backfill is what makes a late joiner see the board at all.
 */
export function useBoardSync(
  sessionId: string,
  onRemote: (op: BoardOp) => void,
) {
  const { send, messages } = useChannel<Sourced>({
    channelId: `draw:${sessionId}`,
    history: 200,
  });

  // One per mounted board, so every tab is distinct even when they share a login.
  const src = useRef(Math.random().toString(36).slice(2));

  const applied = useRef(new Set<string>());
  // Held in a ref so a new handler identity does not replay the whole channel.
  const handler = useRef(onRemote);
  handler.current = onRemote;

  useEffect(() => {
    for (const message of messages) {
      if (applied.current.has(message.id)) continue;
      applied.current.add(message.id);
      // Own strokes are already on the board; re-applying them would fight
      // with whatever is being dragged right now.
      if (!isSourced(message.content)) continue;
      if (message.content.src === src.current) continue;
      handler.current(message.content);
    }
  }, [messages]);

  return useCallback(
    (op: BoardOp) => {
      if (op.k === "u" && op.els.length === 0) return;
      if (op.k === "d" && op.ids.length === 0) return;
      const payload = fit(op);
      if (!payload) return;
      void send({ content: { ...payload, src: src.current } }).catch(() => {});
    },
    [send],
  );
}
