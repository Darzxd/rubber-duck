"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

type SwipeTaglineProps = {
  phrases: string[];
};

/** Matches the --cycle handed to the CSS animation. */
const CYCLE_MS = 4200;

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

  return (
    /**
     * Same trick as the headline: every phrase sits in one grid cell, so the
     * block is always as tall as the longest one and nothing below it moves.
     */
    <p className="grid w-full max-w-lg justify-items-center text-balance text-base leading-relaxed text-neutral-500 sm:text-lg">
      {phrases.map((reserved) => (
        <span
          key={reserved}
          aria-hidden="true"
          className="invisible col-start-1 row-start-1"
        >
          {reserved}
        </span>
      ))}

      {/* Remounting on index change is what restarts the whoosh. */}
      <span
        key={index}
        className="tagline-swipe col-start-1 row-start-1"
        style={{ "--cycle": `${CYCLE_MS}ms` } as React.CSSProperties}
      >
        {phrases[index]}
      </span>
    </p>
  );
}
