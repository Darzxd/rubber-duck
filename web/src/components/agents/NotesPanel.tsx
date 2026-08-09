"use client";

import type { KnownAgent, SideNote } from "@/lib/board";

const SOURCE_LABEL: Record<KnownAgent, string> = {
  architect: "Architect",
  critic: "Critic",
};

// The dot is enough to say who wrote it — a full label per note would eat the
// width. Same palette the cursors use so the eye keeps them together.
const SOURCE_DOT: Record<KnownAgent, string> = {
  architect: "bg-[#3b82f6]",
  critic: "bg-[#f97316]",
};

/** A running list of the agents' side notes: short lines of context they
 *  wanted to add to what is already on the pizarra. Not a transcript. */
export default function NotesPanel({ notes }: { notes: SideNote[] }) {
  if (notes.length === 0) return null;

  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 shadow-xl shadow-neutral-900/5 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
      <div className="px-4 pt-3">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Apuntes
        </span>
      </div>
      <ul className="mt-1 flex flex-col gap-1 px-2 pb-2">
        {notes.map((note) => (
          <li
            key={note.id}
            className="flex items-start gap-2 rounded-xl px-2 py-1.5 text-xs leading-snug text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800/60"
          >
            <span
              aria-label={SOURCE_LABEL[note.source]}
              className={`mt-1 size-1.5 shrink-0 rounded-full ${SOURCE_DOT[note.source]}`}
            />
            <span className="flex-1">{note.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
