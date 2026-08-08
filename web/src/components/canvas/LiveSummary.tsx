import { ArrowRightIcon } from "./icons";
import type { PanelTone, SummaryCount } from "./panelData";

type LiveSummaryProps = {
  counts: SummaryCount[];
  onOpenFull?: () => void;
};

const BOX: Record<PanelTone, string> = {
  amber:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  green:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  violet:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
};

export default function LiveSummary({ counts, onOpenFull }: LiveSummaryProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
      <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-neutral-400">
        Resumen en vivo
      </h3>

      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {counts.map((count) => (
          <div
            key={count.id}
            className={`rounded-lg border px-1 py-2 text-center ${BOX[count.tone]}`}
          >
            <p className="text-[0.6rem] font-medium leading-tight opacity-80">
              {count.label}
            </p>
            <p className="text-lg font-bold leading-tight tabular-nums">
              {count.value}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenFull}
        className="mt-2.5 flex items-center gap-1 text-[0.7rem] font-semibold text-blue-600 transition-colors hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-blue-400"
      >
        Ver resumen completo
        <ArrowRightIcon className="size-3" />
      </button>
    </section>
  );
}
