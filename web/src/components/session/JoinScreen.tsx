"use client";

import { useState } from "react";
import NameField from "./NameField";
import MicPermission, { type MicStatus } from "./MicPermission";

type JoinScreenProps = {
  /** Optional so the landing can stay a Server Component until the session
   *  layer has a real handler to pass down. */
  onJoin?: (name: string) => void;
};

export default function JoinScreen({ onJoin }: JoinScreenProps) {
  const [name, setName] = useState("");
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");

  const trimmedName = name.trim();
  const isRequesting = micStatus === "requesting";
  const canSubmit = trimmedName.length > 0 && !isRequesting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setMicStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // We only need the permission grant here. Capture belongs to the session
      // layer, so release the device instead of holding it open.
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("granted");
      onJoin?.(trimmedName);
    } catch {
      setMicStatus("denied");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-5 rounded-3xl border-[3px] border-neutral-900 bg-white p-6 shadow-[6px_6px_0_rgba(17,17,17,0.12)] sm:p-7"
    >
      <NameField value={name} onChange={setName} disabled={isRequesting} />

      <MicPermission status={micStatus} />

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-base font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {isRequesting
          ? "Esperando el micrófono…"
          : micStatus === "denied"
            ? "Probar de nuevo"
            : "Entrar a la pizarra"}
      </button>

      <p className="text-center text-xs text-neutral-500">
        No hace falta cuenta. Tu nombre solo lo ve esta sesión.
      </p>
    </form>
  );
}
