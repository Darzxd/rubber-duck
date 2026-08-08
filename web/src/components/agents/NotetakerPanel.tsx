"use client";

import type { Note, NoteKind } from "@/lib/board";

type NotetakerPanelProps = {
  notes: Note[];
};

const TAG: Record<NoteKind, { label: string; className: string }> = {
  decision: {
    label: "Decisión",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  pregunta: {
    label: "Pregunta",
    className: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  idea: {
    label: "Idea",
    className: "bg-sky-50 text-sky-700 ring-sky-200",
  },
};

export default function NotetakerPanel({ notes }: NotetakerPanelProps) {
  if (notes.length === 0) return null;

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-neutral-200 bg-white/95 shadow-xl shadow-neutral-900/5 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
      <header className="flex items-baseline justify-between px-4 pb-2 pt-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Notas
        </h2>
        <span className="text-xs tabular-nums text-neutral-300">
          {notes.length}
        </span>
      </header>

      <ol className="no-scrollbar flex flex-col gap-2 overflow-y-auto px-3 pb-3">
        {notes.map((note) => {
          const tag = TAG[note.kind];
          return (
            <li
              key={note.id}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${tag.className}`}
                >
                  {tag.label}
                </span>
                {note.author ? (
                  <span className="truncate text-[11px] text-neutral-400">
                    {note.author}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                {note.title}
              </p>
              {note.body ? (
                <p className="mt-1 text-xs leading-snug text-neutral-500 dark:text-neutral-400">
                  {note.body}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
