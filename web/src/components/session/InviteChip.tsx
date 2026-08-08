"use client";

import { useState } from "react";

type InviteChipProps = {
  sessionId: string;
};

export default function InviteChip({ sessionId }: InviteChipProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      const link = `${window.location.origin}/s/${sessionId}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — user can copy from the URL bar as a fallback.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="pointer-events-auto absolute right-6 top-16 z-20 flex items-center gap-2 rounded-full border-[2px] border-neutral-900 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-[3px_3px_0_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:top-16 dark:border-white/20 dark:bg-neutral-950 dark:text-white"
      aria-label="Copiar link de invitación"
    >
      <LinkIcon />
      <span>{copied ? "Link copiado" : `Invitar · ${sessionId}`}</span>
    </button>
  );
}

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      <path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07L11.7 4.24" />
      <path d="M14 11a5 5 0 0 0-7.07 0L3.4 14.54a5 5 0 0 0 7.07 7.07l1.83-1.83" />
    </svg>
  );
}
