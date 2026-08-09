"use client";

import type { CriticNote } from "@/lib/board";

type CriticPanelProps = {
  notes: CriticNote[];
};

const STANCE: Record<CriticNote["stance"], { label: string; className: string }> =
  {
    existe: {
      label: "Ya existe",
      className: "bg-teal-50 text-teal-700 ring-teal-200",
    },
    choca: {
      label: "Choca",
      className: "bg-rose-50 text-rose-700 ring-rose-200",
    },
  };

export default function CriticPanel({ notes }: CriticPanelProps) {
  if (notes.length === 0) return null;

  return (
    <section className="flex min-h-0 shrink-0 flex-col rounded-2xl border border-neutral-200 bg-white/95 shadow-xl shadow-neutral-900/5 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
      <header className="flex items-baseline justify-between px-4 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
          En el repo
        </h2>
        <span className="text-xs tabular-nums text-neutral-300">
          {notes.length}
        </span>
      </header>

      <ol className="no-scrollbar flex flex-col gap-2 overflow-y-auto px-3 pb-3">
        {notes.map((note) => {
          const stance = STANCE[note.stance] ?? STANCE.existe;
          return (
            <li
              key={note.id}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${stance.className}`}
                >
                  {stance.label}
                </span>
                <span className="truncate text-[11px] text-neutral-400">
                  {note.about}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-snug text-neutral-900 dark:text-neutral-100">
                {note.text}
              </p>
              {/* The path is the evidence, so it is shown whole rather than
                  shortened to a filename that could be any of five. */}
              <p className="mt-1 break-all font-mono text-[11px] text-neutral-400">
                {note.path}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
