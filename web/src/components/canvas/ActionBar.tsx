import { ListIcon, MicIcon, SparkleIcon } from "./icons";
import type { AiActionId } from "./ToolRail";

type ActionBarProps = {
  onAction?: (action: AiActionId) => void;
};

const ACTIONS: { id: AiActionId; label: string; Icon: typeof MicIcon }[] = [
  { id: "capture", label: "Capturar idea", Icon: MicIcon },
  { id: "organise", label: "Organizar", Icon: SparkleIcon },
  { id: "summarise", label: "Resumir", Icon: ListIcon },
];

export default function ActionBar({ onAction }: ActionBarProps) {
  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center rounded-full border border-neutral-200 bg-white px-1.5 py-1.5 shadow-lg shadow-neutral-900/5 sm:bottom-4 dark:border-neutral-700 dark:bg-neutral-900">
      {ACTIONS.map(({ id, label, Icon }, index) => (
        <span key={id} className="flex items-center">
          {index > 0 ? (
            <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
          ) : null}
          <button
            type="button"
            onClick={() => onAction?.(id)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] font-medium text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <Icon className="size-4 text-neutral-400" />
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
