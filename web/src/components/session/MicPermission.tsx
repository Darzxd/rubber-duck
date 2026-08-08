export type MicStatus = "idle" | "requesting" | "granted" | "denied";

type MicPermissionProps = {
  status: MicStatus;
};

const MESSAGES: Record<MicStatus, string> = {
  idle: "Your browser will ask for the microphone. Nothing is recorded — only the live transcript reaches the board.",
  requesting: "Waiting for you to allow the microphone…",
  granted: "Microphone ready.",
  denied:
    "The microphone is blocked. Allow it from the icon in the address bar, then try again.",
};

const TONES: Record<MicStatus, string> = {
  idle: "border-neutral-200 bg-neutral-50 text-neutral-600",
  requesting: "border-amber-200 bg-amber-50 text-amber-800",
  granted: "border-emerald-200 bg-emerald-50 text-emerald-800",
  denied: "border-red-200 bg-red-50 text-red-800",
};

export default function MicPermission({ status }: MicPermissionProps) {
  return (
    <p
      role={status === "denied" ? "alert" : undefined}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${TONES[status]}`}
    >
      <MicIcon />
      <span>{MESSAGES[status]}</span>
    </p>
  );
}

function MicIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-4 shrink-0"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <path d="M12 19v3" />
    </svg>
  );
}
