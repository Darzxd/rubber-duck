"use client";

import { useState } from "react";

type BriefCardProps = {
  brief: string;
  /** Open on a session nobody has briefed yet: the moment before anyone talks. */
  startOpen: boolean;
  onSave: (brief: string) => void;
};

const MAX = 600;

export default function BriefCard({ brief, startOpen, onSave }: BriefCardProps) {
  const [open, setOpen] = useState(startOpen && !brief);
  const [draft, setDraft] = useState(brief);

  function save() {
    const text = draft.trim();
    if (!text) return;
    onSave(text);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(brief);
          setOpen(true);
        }}
        className="shrink-0 rounded-2xl border border-neutral-200 bg-white/95 px-4 py-2.5 text-left shadow-xl shadow-neutral-900/5 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95"
      >
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          De qué va la reunión
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-neutral-600 dark:text-neutral-300">
          {brief || "Dale instrucciones antes de empezar"}
        </span>
      </button>
    );
  }

  return (
    <div className="shrink-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-900">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
        De qué va la reunión
      </h2>
      <p className="mt-1 text-xs leading-snug text-neutral-500">
        Lo que escribas acá decide qué se anota y qué no.
      </p>
      <textarea
        value={draft}
        maxLength={MAX}
        rows={4}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Definir el cobro del plan pago antes del viernes."
        className="mt-2 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm leading-snug text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!draft.trim()}
          className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
