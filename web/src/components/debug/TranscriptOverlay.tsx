"use client";

import { useEffect, useState } from "react";

import type { Chunk } from "@/lib/session";

type TranscriptOverlayProps = {
  recording: boolean;
  supported: boolean;
  interim: string;
  chunks: Chunk[];
  error: string | null;
};

const CAPTION_TAIL = 160;
const HIDE_AFTER_MS = 4000;

export default function TranscriptOverlay({
  supported,
  interim,
  chunks,
  error,
}: TranscriptOverlayProps) {
  const last = chunks[chunks.length - 1];
  const text = interim || last?.text || "";
  const author = interim ? null : (last?.author ?? null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!text) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), HIDE_AFTER_MS);
    return () => clearTimeout(t);
  }, [text]);

  if (!supported || error) {
    return (
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
        <p className="max-w-[32rem] rounded-full bg-red-600/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
          {error ?? "Este navegador no soporta captura de voz. Probá Chrome."}
        </p>
      </div>
    );
  }

  if (!text) return null;

  const caption =
    text.length > CAPTION_TAIL ? `…${text.slice(-CAPTION_TAIL)}` : text;

  return (
    <div
      className={`pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="max-w-[36rem] rounded-2xl bg-neutral-900/85 px-4 py-2 text-sm leading-snug text-white shadow-lg backdrop-blur">
        {author && (
          <span className="font-semibold text-white/60">{author} · </span>
        )}
        {caption}
      </p>
    </div>
  );
}
