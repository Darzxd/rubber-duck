import type { MeterKind, PanelTone } from "./panelData";

type ActivityMeterProps = {
  kind: MeterKind;
  tone: PanelTone;
  progress?: number;
};

const FILL: Record<PanelTone, string> = {
  green: "bg-emerald-500",
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
};

const TRACK: Record<PanelTone, string> = {
  green: "bg-emerald-100 dark:bg-emerald-500/20",
  violet: "bg-violet-100 dark:bg-violet-500/20",
  blue: "bg-blue-100 dark:bg-blue-500/20",
  amber: "bg-amber-100 dark:bg-amber-500/20",
};

/** Fixed heights: random ones would differ between server and client render. */
const BAR_HEIGHTS = [8, 14, 6, 16, 10, 18, 7, 13, 9, 15, 6, 12, 17, 8, 11];

export default function ActivityMeter({
  kind,
  tone,
  progress = 0,
}: ActivityMeterProps) {
  if (kind === "wave") {
    return (
      <div
        aria-hidden="true"
        className="flex h-5 items-center gap-[3px] overflow-hidden"
      >
        {BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            className={`meter-wave-bar w-[3px] rounded-full ${FILL[tone]}`}
            style={
              {
                height,
                "--delay": `${index * 0.07}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    );
  }

  if (kind === "progress") {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`h-1.5 flex-1 overflow-hidden rounded-full ${TRACK[tone]}`}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${FILL[tone]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[0.65rem] font-semibold tabular-nums text-neutral-500 dark:text-neutral-400">
          {progress}%
        </span>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative h-1.5 overflow-hidden rounded-full ${TRACK[tone]}`}
    >
      <div className={`meter-slide h-full w-1/3 rounded-full ${FILL[tone]}`} />
    </div>
  );
}
