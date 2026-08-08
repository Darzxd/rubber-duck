import {
  CheckCircleIcon,
  GridIcon,
  LayersIcon,
  SparkleIcon,
} from "./icons";

export type PanelId = "assistant" | "layers" | "grid" | "tasks";

type AiRailProps = {
  activePanel: PanelId | null;
  onTogglePanel: (panel: PanelId) => void;
};

const PANELS: { id: PanelId; label: string; Icon: typeof SparkleIcon }[] = [
  { id: "assistant", label: "Asistente", Icon: SparkleIcon },
  { id: "layers", label: "Capas", Icon: LayersIcon },
  { id: "grid", label: "Cuadrícula", Icon: GridIcon },
  { id: "tasks", label: "Tareas", Icon: CheckCircleIcon },
];

export default function AiRail({ activePanel, onTogglePanel }: AiRailProps) {
  return (
    <div className="pointer-events-auto absolute right-3 top-6 z-30 flex flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/5 sm:right-4 dark:border-neutral-700 dark:bg-neutral-900">
      {PANELS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={activePanel === id}
          onClick={() => onTogglePanel(id)}
          className={`grid size-9 place-items-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
            activePanel === id
              ? "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          }`}
        >
          <Icon />
        </button>
      ))}
    </div>
  );
}
