"use client";

import type { Chunk } from "@/lib/session";

type TranscriptOverlayProps = {
  recording: boolean;
  supported: boolean;
  interim: string;
  chunks: Chunk[];
  error: string | null;
};

// Temporary debug UI — remove once agent output drives the visible canvas.
export default function TranscriptOverlay({
  recording,
  supported,
  interim,
  chunks,
  error,
}: TranscriptOverlayProps) {
  const status = !supported
    ? "unsupported"
    : error
      ? "error"
      : recording
        ? "recording"
        : "idle";

  const dot =
    status === "recording"
      ? "bg-emerald-500"
      : status === "error" || status === "unsupported"
        ? "bg-red-500"
        : "bg-neutral-400";

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-neutral-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      <header className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">
        <span className={`inline-block size-2 rounded-full ${dot}`} />
        transcript · {status}
      </header>
      {!supported && (
        <p className="text-xs text-red-600">
          Speech recognition is not supported in this browser. Try Chrome.
        </p>
      )}
      {error && (
        <p className="mb-2 text-xs text-red-600">{error}</p>
      )}
      <div className="max-h-52 space-y-1.5 overflow-y-auto text-sm text-neutral-800">
        {chunks.map((c) => (
          <p key={c.id} className="leading-snug">
            <span className="font-semibold text-neutral-500">{c.author}:</span>{" "}
            {c.text}
          </p>
        ))}
        {interim && (
          <p className="italic text-neutral-400 leading-snug">{interim}</p>
        )}
        {!chunks.length && !interim && (
          <p className="italic text-neutral-400">Waiting for speech…</p>
        )}
      </div>
    </div>
  );
}
