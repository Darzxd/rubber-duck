"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

export type Tagline = {
  text: string;
  color: string;
};

type SwipeTaglineProps = {
  phrases: Tagline[];
};

/** Matches the --cycle handed to the CSS animation. */
const CYCLE_MS = 4200;

/** Shared by the visible pill and its invisible height reservations. */
const PILL =
  "col-start-1 row-start-1 rounded-full border-2 px-5 py-2 text-sm font-semibold sm:text-base";

export default function SwipeTagline({ phrases }: SwipeTaglineProps) {
  const [index, setIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    // The swap happens inside the timer, never straight in the effect.
    const timer = setTimeout(() => {
      setIndex((current) => (current + 1) % phrases.length);
    }, CYCLE_MS);

    return () => clearTimeout(timer);
  }, [index, prefersReducedMotion, phrases.length]);

  const current = phrases[index];

  return (
    /**
     * Every pill sits in one grid cell, so the block is always as wide and as
     * tall as the largest phrase and nothing below it moves when they swap.
     */
    <p className="grid justify-items-center text-balance">
      {phrases.map((reserved) => (
        <span
          key={reserved.text}
          aria-hidden="true"
          className={`invisible ${PILL}`}
        >
          {reserved.text}
        </span>
      ))}

      {/* Remounting on index change is what restarts the whoosh. */}
      <span
        key={index}
        className={`tagline-swipe ${PILL}`}
        style={
          {
            "--cycle": `${CYCLE_MS}ms`,
            color: current.color,
            borderColor: `${current.color}59`,
            backgroundColor: `${current.color}14`,
          } as React.CSSProperties
        }
      >
        {current.text}
      </span>
    </p>
  );
}
