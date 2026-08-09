"use client";

import { useEffect, useRef } from "react";
import type { Author } from "@/components/canvas/authors";
import { OFFSCREEN, usePresence } from "@/lib/presence";

type PresenceLayerProps = {
  sessionId: string;
  name: string;
  /** Called when somebody joins, leaves, or is finally named. */
  onRoster: (people: Author[]) => void;
  /** True once this browser closed the session, so the notice goes out. */
  ended?: boolean;
  /** Called when somebody else closed the session. */
  onEnded?: () => void;
};

// The SDK drops a repeat of the same kind inside 3s, so the notice goes out
// just outside that window: whoever opens the link late still gets locked.
const NOTICE_EVERY_MS = 3200;

/** Who is in the room, ignoring where their mouse is. */
function roster(people: Author[]) {
  return people.map((person) => `${person.id}:${person.name}`).join("|");
}

export default function PresenceLayer({
  sessionId,
  name,
  onRoster,
  ended = false,
  onEnded,
}: PresenceLayerProps) {
  const { people, move, myId, closed, close } = usePresence(sessionId, name);
  const lastRoster = useRef("");

  useEffect(() => {
    if (closed) onEnded?.();
  }, [closed, onEnded]);

  useEffect(() => {
    if (!ended) return;
    close();
    const id = setInterval(close, NOTICE_EVERY_MS);
    return () => clearInterval(id);
  }, [ended, close]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      // Percent of the window, so a cursor lands in the same place on a laptop
      // and on an external monitor.
      move({
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      });
    }
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [move]);

  useEffect(() => {
    // The board above re-renders on this, so it only hears about arrivals and
    // departures — not about every mouse movement.
    const now = roster(people);
    if (now === lastRoster.current) return;
    lastRoster.current = now;
    onRoster(people);
  }, [people, onRoster]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {people
        .filter(
          (person) =>
            person.id !== myId && person.x !== OFFSCREEN && person.y !== OFFSCREEN,
        )
        .map((person) => (
          <div
            key={person.id}
            className="absolute flex items-start gap-1"
            style={{ left: `${person.x}%`, top: `${person.y}%` }}
          >
            <svg viewBox="0 0 16 16" className="size-4 shrink-0 drop-shadow-sm">
              <path
                d="M1 1l5.5 13 2-5.5L14 6.5z"
                fill={person.color}
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-semibold text-white"
              style={{ backgroundColor: person.color }}
            >
              {person.name}
            </span>
          </div>
        ))}
    </div>
  );
}
