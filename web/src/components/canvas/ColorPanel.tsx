import { CloseIcon, CopyIcon } from "./icons";

type ColorPanelProps = {
  color: string;
  onColorChange: (color: string) => void;
  strokeSize: number;
  onStrokeSizeChange: (size: number) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  onClose: () => void;
};

const SWATCHES = [
  "#111111",
  "#ff4d4d",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
];

const STROKE_SIZES = [2, 4, 7, 11];

export default function ColorPanel({
  color,
  onColorChange,
  strokeSize,
  onStrokeSizeChange,
  opacity,
  onOpacityChange,
  onClose,
}: ColorPanelProps) {
  return (
    <div className="pointer-events-auto absolute left-16 top-1/2 z-30 w-60 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl shadow-neutral-900/10 sm:left-20 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Color
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel de color"
          className="grid size-6 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <CloseIcon className="size-3.5" />
        </button>
      </div>

      {/* Hue ring with the saturation square nested inside it. */}
      <div className="mt-3 grid place-items-center">
        <div
          className="grid size-36 place-items-center rounded-full"
          style={{
            backgroundImage:
              "conic-gradient(#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)",
          }}
        >
          <div
            className="relative size-[5.5rem] rounded-md ring-1 ring-black/10"
            style={{
              backgroundColor: color,
              backgroundImage:
                "linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)",
            }}
          >
            <span className="absolute right-2 top-2 size-3 rounded-full border-2 border-white shadow" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Color ${swatch}`}
            aria-pressed={swatch === color}
            onClick={() => onColorChange(swatch)}
            className={`size-5 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
              swatch === color
                ? "ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900"
                : "ring-1 ring-black/10"
            }`}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-neutral-400">
          Hex
        </span>
        <span className="flex-1 rounded-lg border border-neutral-200 px-2 py-1 font-mono text-xs text-neutral-700 dark:border-neutral-700 dark:text-neutral-200">
          {color.toUpperCase()}
        </span>
        <button
          type="button"
          aria-label="Copiar color"
          className="grid size-6 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <CopyIcon className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Tamaño
        </span>
        <div className="flex items-center gap-2">
          {STROKE_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              aria-label={`Grosor ${size}`}
              aria-pressed={size === strokeSize}
              onClick={() => onStrokeSizeChange(size)}
              className={`grid size-6 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                size === strokeSize
                  ? "bg-neutral-100 dark:bg-neutral-800"
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

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Opacidad</span>
          <span className="font-medium text-neutral-700 dark:text-neutral-200">
            {opacity}%
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          value={opacity}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
          aria-label="Opacidad"
          className="mt-1.5 w-full accent-neutral-900 dark:accent-white"
        />
      </div>
    </div>
  );
}
