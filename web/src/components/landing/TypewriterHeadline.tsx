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
    <h1 className="flex min-h-[4.5rem] items-start justify-center text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-neutral-900 sm:min-h-[6.5rem] sm:text-5xl lg:min-h-[7.5rem] lg:text-6xl">
      {/* Not announced: a live region would read out every single keystroke. */}
      <span>
        {prefersReducedMotion ? phrase : phrase.slice(0, length)}
        <span
          aria-hidden="true"
          className="caret-blink ml-1.5 inline-block h-[0.85em] w-[0.09em] translate-y-[0.09em] rounded-full bg-[#ff2d2d] align-baseline"
        />
      </span>
    </h1>
  );
}
