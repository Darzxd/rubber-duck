"use client";

import type { KnownAgent, SideNote } from "@/lib/board";

// The dot next to each line is enough to say who wrote it — a full label per
// note would eat the width. Same palette the cursors use so the eye keeps
// them together.
const SOURCE_DOT: Record<KnownAgent, string> = {
  architect: "bg-[#3b82f6]",
  critic: "bg-[#f97316]",
};

type NoteGroup = { nodeId: string; nodeText: string; notes: SideNote[] };

function groupByNode(notes: SideNote[]): NoteGroup[] {
  const order: string[] = [];
  const bucket = new Map<string, NoteGroup>();
  for (const note of notes) {
    const group = bucket.get(note.nodeId);
    if (group) {
      group.notes.push(note);
      continue;
    }
    const fresh: NoteGroup = {
      nodeId: note.nodeId,
      nodeText: note.nodeText,
      notes: [note],
    };
    bucket.set(note.nodeId, fresh);
    order.push(note.nodeId);
  }
  return order.map((id) => bucket.get(id)!);
}

/** A running list of the agents' side notes, grouped under the sticky each
 *  one refers to. Not a transcript; each entry is context the agent added to
 *  something already visible on the pizarra. */
export default function NotesPanel({ notes }: { notes: SideNote[] }) {
  if (notes.length === 0) return null;
  const groups = groupByNode(notes);

  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white/95 shadow-xl shadow-neutral-900/5 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
      <div className="px-4 pt-3">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Apuntes
        </span>
      </div>
      <div className="mt-2 flex flex-col gap-2 px-3 pb-3">
        {groups.map((group) => (
          <div key={group.nodeId} className="flex flex-col gap-0.5">
            <span className="truncate text-[11px] font-semibold text-neutral-800 dark:text-neutral-100">
              {group.nodeText}
            </span>
            <ul className="flex flex-col gap-0.5">
              {group.notes.map((note) => (
                <li
                  key={note.id}
                  className="flex items-start gap-2 rounded-md py-0.5 text-[11.5px] leading-snug text-neutral-600 dark:text-neutral-300"
                >
                  <span
                    className={`mt-1 size-1.5 shrink-0 rounded-full ${SOURCE_DOT[note.source]}`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{note.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
