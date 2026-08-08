import { ArrowRightIcon, DoubtIcon } from "./icons";
import type { Insight } from "./panelData";

type InsightCardProps = {
  insight: Insight;
  onGoToElement?: () => void;
};

export default function InsightCard({
  insight,
  onGoToElement,
}: InsightCardProps) {
  return (
    <div className="my-1.5 rounded-xl border border-violet-200 bg-violet-50 p-2.5 dark:border-violet-500/30 dark:bg-violet-500/10">
      <div className="flex items-center gap-1.5">
        <DoubtIcon className="size-3.5 text-violet-500" />
        <h4 className="text-[0.72rem] font-bold text-violet-700 dark:text-violet-300">
          {insight.title}
        </h4>
        <span className="ml-auto text-[0.65rem] tabular-nums text-violet-400">
          {insight.time}
        </span>
      </div>

      <p className="mt-1 text-[0.75rem] font-medium leading-snug text-neutral-800 dark:text-neutral-100">
        {insight.question}
      </p>

      <p className="mt-1 text-[0.68rem] text-neutral-500 dark:text-neutral-400">
        Relacionada con:{" "}
        <span className="font-semibold text-neutral-700 dark:text-neutral-200">
          {insight.relatedTo}
        </span>
      </p>

      <button
        type="button"
        onClick={onGoToElement}
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-2 py-1 text-[0.68rem] font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 dark:border-violet-500/30 dark:bg-transparent dark:text-violet-300 dark:hover:bg-violet-500/20"
      >
        Ir al elemento en el canvas
        <ArrowRightIcon className="size-3" />
      </button>
    </div>
  );
}
