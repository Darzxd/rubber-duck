import { FullscreenIcon, HandIcon, MinusIcon, PlusIcon } from "./icons";

type ZoomBarProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isPanning: boolean;
  onTogglePan: () => void;
};

const BUTTON =
  "grid size-7 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white";

export default function ZoomBar({
  zoom,
  onZoomIn,
  onZoomOut,
  isPanning,
  onTogglePan,
}: ZoomBarProps) {
  return (
    <div className="pointer-events-auto absolute bottom-3 right-3 z-30 flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-1.5 py-1.5 shadow-lg shadow-neutral-900/5 sm:bottom-4 sm:right-4 dark:border-neutral-700 dark:bg-neutral-900">
      <button
        type="button"
        aria-label="Mover lienzo"
        aria-pressed={isPanning}
        onClick={onTogglePan}
        className={`${BUTTON} ${
          isPanning
            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            : ""
        }`}
      >
        <HandIcon className="size-4" />
      </button>

      <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

      <button
        type="button"
        aria-label="Alejar"
        onClick={onZoomOut}
        className={BUTTON}
      >
        <MinusIcon className="size-3.5" />
      </button>
      <span className="min-w-11 text-center text-xs font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
        {zoom}%
      </span>
      <button
        type="button"
        aria-label="Acercar"
        onClick={onZoomIn}
        className={BUTTON}
      >
        <PlusIcon className="size-3.5" />
      </button>

      <span className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

      <button type="button" aria-label="Pantalla completa" className={BUTTON}>
        <FullscreenIcon className="size-4" />
      </button>
    </div>
  );
}
