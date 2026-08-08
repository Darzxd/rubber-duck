export type MicStatus = "idle" | "requesting" | "granted" | "denied";

type MicPermissionProps = {
  status: MicStatus;
};

const MESSAGES: Record<MicStatus, string> = {
  idle: "El navegador te va a pedir el micrófono. No se graba nada: a la pizarra solo llega la transcripción.",
  requesting: "Esperando que permitas el micrófono…",
  granted: "Micrófono listo.",
  denied:
    "El micrófono está bloqueado. Habilitalo desde el ícono en la barra de direcciones y probá de nuevo.",
};

const TONES: Record<MicStatus, string> = {
  idle: "border-neutral-200 bg-neutral-50 text-neutral-600",
  requesting: "border-amber-300 bg-amber-50 text-amber-800",
  granted: "border-emerald-300 bg-emerald-50 text-emerald-800",
  denied: "border-red-300 bg-red-50 text-red-800",
};

export default function MicPermission({ status }: MicPermissionProps) {
  return (
    <p
      role={status === "denied" ? "alert" : undefined}
      className={`flex items-start gap-2.5 rounded-xl border-2 px-3.5 py-3 text-sm leading-relaxed ${TONES[status]}`}
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
