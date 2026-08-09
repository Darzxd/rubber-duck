"use client";

/** Once the session is closed the board is evidence, not a workspace: the
 * layer stays transparent so everything is still readable, and swallows every
 * pointer so nothing can be added on top of it. */
export default function SessionClosed() {
  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-neutral-900/5">
      <p
        role="status"
        className="mt-16 h-fit rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-white dark:text-neutral-900"
      >
        Sesión finalizada · solo lectura
      </p>
    </div>
  );
}
