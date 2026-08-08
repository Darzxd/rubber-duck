"use client";

import { useState } from "react";
import NameField from "./NameField";
import MicPermission, { type MicStatus } from "./MicPermission";

type JoinScreenProps = {
  sessionName: string;
  onJoin: (name: string) => void;
};

export default function JoinScreen({ sessionName, onJoin }: JoinScreenProps) {
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
      onJoin(trimmedName);
    } catch {
      setMicStatus("denied");
    }
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-neutral-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <header className="flex flex-col gap-1.5">
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-400">
            Joining
          </p>
          <h1 className="text-2xl font-semibold leading-tight text-neutral-900">
            {sessionName}
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
          <NameField
            value={name}
            onChange={setName}
            disabled={isRequesting}
          />

          <MicPermission status={micStatus} />

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isRequesting
              ? "Waiting for the microphone…"
              : micStatus === "denied"
                ? "Try again"
                : "Join the board"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          No account needed. Your name is only visible to this session.
        </p>
      </div>
    </main>
  );
}
