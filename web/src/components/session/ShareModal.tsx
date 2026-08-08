"use client";

import { useEffect, useState } from "react";

type ShareModalProps = {
  sessionId: string;
  onClose: () => void;
};

export default function ShareModal({ sessionId, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    setLink(`${window.location.origin}/s/${sessionId}`);
  }, [sessionId]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Ignore — the input below shows the link for manual copy.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl border-[3px] border-neutral-900 bg-white p-6 shadow-[6px_6px_0_rgba(17,17,17,0.15)]">
        <h2 className="text-xl font-semibold text-neutral-900">
          Pizarra creada
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Compartí este link con tu equipo. Cualquiera que lo abra puede sumarse
          escribiendo su nombre.
        </p>

        <div className="mt-5 flex items-stretch gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 rounded-lg border-2 border-neutral-300 bg-neutral-50 px-3 py-2 font-mono text-sm text-neutral-800 focus:border-neutral-900 focus:outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Entrar a la pizarra
        </button>
      </div>
    </div>
  );
}
