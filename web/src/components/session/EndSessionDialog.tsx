"use client";

type EndSessionDialogProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

/** Ending a session cannot be undone, so it costs one deliberate click more. */
export default function EndSessionDialog({
  onConfirm,
  onCancel,
}: EndSessionDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="end-session-title"
      className="fixed inset-0 z-50 grid place-items-center bg-neutral-900/40 px-4"
    >
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        <h2
          id="end-session-title"
          className="text-base font-semibold text-neutral-900 dark:text-white"
        >
          ¿Finalizar la sesión?
        </h2>
        <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
          Se corta el micrófono y la pizarra queda como está. Nadie puede
          seguir escribiendo y no se puede volver atrás.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Seguir
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="rounded-xl bg-neutral-900 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
