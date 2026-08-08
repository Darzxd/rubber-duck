"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type TypewriterHeadlineProps = {
  phrases: string[];
};

const TYPE_MS = 55;
const DELETE_MS = 24;
const HOLD_MS = 1900;

let motionQuery: MediaQueryList | null = null;

function getMotionQuery() {
  motionQuery ??= window.matchMedia("(prefers-reduced-motion: reduce)");
  return motionQuery;
}

function subscribeToMotion(onChange: () => void) {
  const query = getMotionQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const readMotion = () => getMotionQuery().matches;
/** The server can't know the preference, so it assumes motion is fine. */
const readMotionOnServer = () => false;

export default function TypewriterHeadline({
  phrases,
}: TypewriterHeadlineProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeToMotion,
    readMotion,
    readMotionOnServer,
  );

  const phrase = phrases[phraseIndex];

  useEffect(() => {
    if (prefersReducedMotion) return;

    const atEnd = !isDeleting && length === phrase.length;
    const atStart = isDeleting && length === 0;
    const delay = atEnd ? HOLD_MS : isDeleting ? DELETE_MS : TYPE_MS;

    // Every transition happens inside the timer, never straight in the effect.
    const timer = setTimeout(() => {
      if (atEnd) {
        setIsDeleting(true);
        return;
      }
      if (atStart) {
        setIsDeleting(false);
        setPhraseIndex((index) => (index + 1) % phrases.length);
        return;
      }
      setLength((value) => value + (isDeleting ? -1 : 1));
    }, delay);

    return () => clearTimeout(timer);
  }, [length, isDeleting, prefersReducedMotion, phrase.length, phrases.length]);

  return (
    /**
     * Every phrase is stacked in the same grid cell. The hidden copies still
     * take up space, so the box is always as tall as the longest phrase at the
     * current width — the headline can grow a line without shoving the page.
     */
    <h1 className="grid w-full justify-items-center text-balance text-3xl font-extrabold leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
      {phrases.map((reserved) => (
        <span
          key={reserved}
          aria-hidden="true"
          className="invisible col-start-1 row-start-1"
        >
          {reserved}
        </span>
      ))}

      {/* Not announced: a live region would read out every single keystroke. */}
      <span className="col-start-1 row-start-1">
        {prefersReducedMotion ? phrase : phrase.slice(0, length)}
        <span
          aria-hidden="true"
          className="caret-blink ml-1.5 inline-block h-[0.85em] w-[0.09em] translate-y-[0.09em] rounded-full bg-[#ff2d2d] align-baseline"
        />
      </span>
    </h1>
  );
}
