"use client";

type ColorPaletteProps = {
  color: string;
  onPick: (color: string) => void;
};

/**
 * Nine hues across five shades. Columns are families, rows go light to dark,
 * so picking a tint of something you already used is a vertical move.
 */
const PALETTE: string[][] = [
  ["#fafafa", "#d4d4d8", "#71717a", "#3f3f46", "#111111"],
  ["#fee2e2", "#fca5a5", "#ef4444", "#b91c1c", "#7f1d1d"],
  ["#ffedd5", "#fdba74", "#f97316", "#c2410c", "#7c2d12"],
  ["#fef9c3", "#fde047", "#eab308", "#a16207", "#713f12"],
  ["#dcfce7", "#86efac", "#22c55e", "#15803d", "#14532d"],
  ["#ccfbf1", "#5eead4", "#14b8a6", "#0f766e", "#134e4a"],
  ["#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8", "#1e3a8a"],
  ["#ede9fe", "#c4b5fd", "#8b5cf6", "#6d28d9", "#4c1d95"],
  ["#fce7f3", "#f9a8d4", "#ec4899", "#be185d", "#831843"],
];

export default function ColorPalette({ color, onPick }: ColorPaletteProps) {
  return (
    <div className="w-max rounded-2xl border border-neutral-200 bg-white p-2.5 shadow-xl shadow-neutral-900/15 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="grid grid-flow-col grid-rows-5 gap-1">
        {PALETTE.map((family) =>
          family.map((shade) => (
            <button
              key={shade}
              type="button"
              title={shade}
              aria-label={`Color ${shade}`}
              aria-pressed={shade === color}
              onClick={() => onPick(shade)}
              className={`size-5 rounded-[5px] transition-transform hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-neutral-900 motion-reduce:hover:scale-100 ${
                shade === color
                  ? "ring-2 ring-neutral-900 ring-offset-1 dark:ring-white dark:ring-offset-neutral-900"
                  : "ring-1 ring-inset ring-black/10"
              }`}
              style={{ backgroundColor: shade }}
            />
          )),
        )}
      </div>

      <label className="mt-2.5 flex cursor-pointer items-center gap-2 border-t border-neutral-200 pt-2.5 text-[0.7rem] font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
        <input
          type="color"
          value={color}
          onChange={(event) => onPick(event.target.value)}
          aria-label="Color personalizado"
          className="size-6 cursor-pointer rounded-md border border-neutral-300 bg-transparent p-0 dark:border-neutral-600"
        />
        Cualquier otro color
      </label>
    </div>
  );
}
