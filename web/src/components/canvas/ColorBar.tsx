type ColorBarProps = {
  color: string;
  onColorChange: (color: string) => void;
  strokeSize: number;
  onStrokeSizeChange: (size: number) => void;
  /** Shown when the bar is acting on an existing element, not a new one. */
  editingSelection?: boolean;
};

const SWATCHES = [
  "#111111",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

const STROKE_SIZES = [2, 4, 7, 11];

export default function ColorBar({
  color,
  onColorChange,
  strokeSize,
  onStrokeSizeChange,
  editingSelection = false,
}: ColorBarProps) {
  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-2.5 py-1.5 shadow-xl shadow-neutral-900/10 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
      {editingSelection ? (
        <span className="pl-0.5 pr-1 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-400">
          Selección
        </span>
      ) : null}

      <div className="flex items-center gap-1">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            title={swatch}
            aria-label={`Color ${swatch}`}
            aria-pressed={swatch === color}
            onClick={() => onColorChange(swatch)}
            className="relative h-7 w-5 rounded-md ring-1 ring-inset ring-black/10 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 motion-reduce:hover:scale-100"
            style={{ backgroundColor: swatch }}
          >
            {swatch === color ? (
              // The dot is the selection marker: it rides on the chosen chip.
              <span className="absolute inset-0 m-auto size-2.5 rounded-full bg-white shadow ring-1 ring-black/25" />
            ) : null}
          </button>
        ))}
      </div>

      <span className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />

      <div className="flex items-center gap-1">
        {STROKE_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            title={`Grosor ${size}`}
            aria-label={`Grosor ${size}`}
            aria-pressed={size === strokeSize}
            onClick={() => onStrokeSizeChange(size)}
            className={`grid size-7 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
              size === strokeSize
                ? "bg-neutral-900/10 dark:bg-white/15"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <span
              className="rounded-full bg-neutral-900 dark:bg-white"
              style={{ width: size, height: size }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
