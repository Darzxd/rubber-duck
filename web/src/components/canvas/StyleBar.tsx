"use client";

import ColorPalette from "./ColorPalette";
import {
  CORNER_RADII,
  OPACITIES,
  STROKE_STYLES,
  type StrokeStyle,
} from "./boardElements";

type StyleBarProps = {
  color: string;
  onColorChange: (color: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
  dash: StrokeStyle;
  onDashChange: (dash: StrokeStyle) => void;
  radius: number;
  onRadiusChange: (radius: number) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  /** Shown when the bar is acting on an existing element, not a new one. */
  editingSelection?: boolean;
  isPaletteOpen: boolean;
  onTogglePalette: (open: boolean) => void;
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

const WIDTHS = [2, 4, 7, 11];

const DASH_LABELS: Record<StrokeStyle, string> = {
  solid: "Trazo continuo",
  dashed: "Trazo discontinuo",
  dotted: "Trazo punteado",
};

const DASH_PATTERN: Record<StrokeStyle, string | undefined> = {
  solid: undefined,
  dashed: "5 3.5",
  dotted: "0 4",
};

const RADIUS_LABELS = ["Esquinas rectas", "Esquinas suaves", "Esquinas redondas"];

const PILL =
  "grid size-7 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";
const ON = "bg-neutral-900/10 dark:bg-white/15";
const OFF = "hover:bg-neutral-100 dark:hover:bg-neutral-800";
const DIVIDER = "h-6 w-px shrink-0 bg-neutral-200 dark:bg-neutral-700";

export default function StyleBar({
  color,
  onColorChange,
  width,
  onWidthChange,
  dash,
  onDashChange,
  radius,
  onRadiusChange,
  opacity,
  onOpacityChange,
  editingSelection = false,
  isPaletteOpen,
  onTogglePalette,
}: StyleBarProps) {

  return (
    <div className="pointer-events-auto absolute left-1/2 top-3 z-30 max-w-[calc(100%-1.5rem)] -translate-x-1/2">
      {/* The row scrolls on narrow screens; the palette must live outside it,
          or it gets clipped the way the shape picker was. */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto rounded-full border border-neutral-200 bg-white/95 px-2.5 py-1.5 shadow-xl shadow-neutral-900/10 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95">
      {editingSelection ? (
        <span className="shrink-0 pl-0.5 pr-1 text-[0.65rem] font-semibold uppercase tracking-wide text-neutral-400">
          Selección
        </span>
      ) : null}

      {/* Stroke colour */}
      <div className="flex shrink-0 items-center gap-1">
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            title={`Color ${swatch}`}
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
        <button
          type="button"
          title="Más colores"
          aria-label="Más colores"
          aria-expanded={isPaletteOpen}
          onClick={() => onTogglePalette(!isPaletteOpen)}
          className={`grid h-7 w-5 place-items-center rounded-md border border-dashed transition-colors ${
            isPaletteOpen
              ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
              : "border-neutral-300 text-neutral-400 hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-600 dark:hover:border-white dark:hover:text-white"
          }`}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="size-3">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <span className={DIVIDER} />

      {/* Stroke width */}
      <div className="flex shrink-0 items-center gap-1">
        {WIDTHS.map((size) => (
          <button
            key={size}
            type="button"
            title={`Grosor ${size}`}
            aria-label={`Grosor ${size}`}
            aria-pressed={size === width}
            onClick={() => onWidthChange(size)}
            className={`${PILL} ${size === width ? ON : OFF}`}
          >
            <span
              className="rounded-full bg-neutral-900 dark:bg-white"
              style={{ width: size, height: size }}
            />
          </button>
        ))}
      </div>

      <span className={DIVIDER} />

      {/* Stroke style */}
      <div className="flex shrink-0 items-center gap-1">
        {STROKE_STYLES.map((style) => (
          <button
            key={style}
            type="button"
            title={DASH_LABELS[style]}
            aria-label={DASH_LABELS[style]}
            aria-pressed={style === dash}
            onClick={() => onDashChange(style)}
            className={`${PILL} ${style === dash ? ON : OFF}`}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
              <path
                d="M2 10h16"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeDasharray={DASH_PATTERN[style]}
                className="text-neutral-900 dark:text-white"
              />
            </svg>
          </button>
        ))}
      </div>

      <span className={DIVIDER} />

      {/* Corner rounding */}
      <div className="flex shrink-0 items-center gap-1">
        {CORNER_RADII.map((value, index) => (
          <button
            key={value}
            type="button"
            title={RADIUS_LABELS[index]}
            aria-label={RADIUS_LABELS[index]}
            aria-pressed={value === radius}
            onClick={() => onRadiusChange(value)}
            className={`${PILL} ${value === radius ? ON : OFF}`}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
              <rect
                x="3.2"
                y="3.2"
                width="13.6"
                height="13.6"
                rx={value === 0 ? 0 : value === 8 ? 3 : 6.5}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="text-neutral-900 dark:text-white"
              />
            </svg>
          </button>
        ))}
      </div>

      <span className={DIVIDER} />

      {/* Transparency */}
      <div className="flex shrink-0 items-center gap-1">
        {OPACITIES.map((value) => (
          <button
            key={value}
            type="button"
            title={`Transparencia ${100 - value}%`}
            aria-label={`Opacidad ${value}%`}
            aria-pressed={value === opacity}
            onClick={() => onOpacityChange(value)}
            className={`${PILL} ${value === opacity ? ON : OFF}`}
          >
            <span
              className="size-4 rounded-full ring-1 ring-inset ring-black/15"
              style={{ backgroundColor: color, opacity: value / 100 }}
            />
          </button>
        ))}
        </div>
      </div>

      {isPaletteOpen ? (
        <div className="absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2">
          <ColorPalette
            color={color}
            onPick={onColorChange}
            onClose={() => onTogglePalette(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
