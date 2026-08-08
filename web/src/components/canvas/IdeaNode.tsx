"use client";

import { useRef } from "react";
import { NODE_H, NODE_W, type Placed, type Point } from "@/lib/layout";
import { colorForAuthor } from "./authors";

type IdeaNodeProps = {
  node: Placed;
  onMove: (id: string, at: Point) => void;
};

export default function IdeaNode({ node, onMove }: IdeaNodeProps) {
  const origin = useRef<{
    px: number;
    py: number;
    x: number;
    y: number;
    scale: number;
  } | null>(null);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    // Stops the surface underneath from reading this as a pan.
    event.stopPropagation();
    // The board zoom lives above us. What it did to our own width is the same
    // thing it will do to the drag, so we read the factor off ourselves.
    const scale = event.currentTarget.getBoundingClientRect().width / NODE_W;
    origin.current = {
      px: event.clientX,
      py: event.clientY,
      x: node.x,
      y: node.y,
      scale: scale || 1,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = origin.current;
    if (!start) return;
    onMove(node.id, {
      x: start.x + (event.clientX - start.px) / start.scale,
      y: start.y + (event.clientY - start.py) / start.scale,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!origin.current) return;
    origin.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const color = colorForAuthor(node.author ?? "");

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute z-10 cursor-grab touch-none rounded-xl border border-neutral-200 bg-white p-3 shadow-lg shadow-neutral-900/10 transition-[left,top] duration-300 active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-900"
      style={{
        left: node.x,
        top: node.y,
        width: NODE_W,
        minHeight: NODE_H,
        borderLeft: `4px solid ${color}`,
      }}
    >
      {node.author ? (
        <span
          className="text-[0.6rem] font-bold uppercase tracking-wide"
          style={{ color }}
        >
          {node.author}
        </span>
      ) : null}
      <p className="text-[0.82rem] leading-snug text-neutral-800 dark:text-neutral-100">
        {node.label}
      </p>
    </div>
  );
}
