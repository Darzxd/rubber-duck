import {
  ArrowToolIcon,
  CircleToolIcon,
  DecisionIcon,
  DoubtIcon,
  IdeaIcon,
  ImageIcon,
  ListIcon,
  MicIcon,
  PenIcon,
  PlusIcon,
  RedoIcon,
  SelectIcon,
  ShapesIcon,
  SparkleIcon,
  TaskTrendIcon,
  TextIcon,
  UndoIcon,
} from "./icons";

export type ToolId =
  | "select"
  | "text"
  | "pen"
  | "shapes"
  | "circle"
  | "arrow"
  | "image"
  | "hand"
  | "idea"
  | "decision"
  | "task"
  | "doubt";

export type AiActionId = "capture" | "organise" | "summarise";

type ToolRailProps = {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  onAiAction?: (action: AiActionId) => void;
};

const BUILD: { id: ToolId; label: string; Icon: typeof SelectIcon }[] = [
  { id: "select", label: "Seleccionar", Icon: SelectIcon },
  { id: "text", label: "Texto", Icon: TextIcon },
  { id: "pen", label: "Lápiz", Icon: PenIcon },
  { id: "shapes", label: "Formas", Icon: ShapesIcon },
  { id: "circle", label: "Círculo", Icon: CircleToolIcon },
  { id: "arrow", label: "Flecha", Icon: ArrowToolIcon },
  { id: "image", label: "Imagen", Icon: ImageIcon },
];

const THINK: {
  id: ToolId;
  label: string;
  Icon: typeof IdeaIcon;
  tint: string;
}[] = [
  { id: "idea", label: "Idea", Icon: IdeaIcon, tint: "bg-amber-50 text-amber-500 dark:bg-amber-500/15" },
  { id: "decision", label: "Decisión", Icon: DecisionIcon, tint: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15" },
  { id: "task", label: "Tarea", Icon: TaskTrendIcon, tint: "bg-blue-50 text-blue-500 dark:bg-blue-500/15" },
  { id: "doubt", label: "Duda", Icon: DoubtIcon, tint: "bg-violet-50 text-violet-500 dark:bg-violet-500/15" },
];

const AI: { id: AiActionId; label: string; Icon: typeof MicIcon }[] = [
  { id: "capture", label: "Capturar", Icon: MicIcon },
  { id: "organise", label: "Organizar", Icon: SparkleIcon },
  { id: "summarise", label: "Resumir", Icon: ListIcon },
];

const CARD =
  "rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg shadow-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-900";
const SECTION_LABEL =
  "px-1 pb-1.5 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-neutral-400";
const ROW =
  "flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-[0.72rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

export default function ToolRail({
  activeTool,
  onSelectTool,
  onAiAction,
}: ToolRailProps) {
  return (
    <div className="no-scrollbar pointer-events-auto absolute left-3 top-3 z-30 flex max-h-[calc(100%-1.5rem)] w-[6.5rem] flex-col gap-2 overflow-y-auto">
      <div className={CARD}>
        <p className={SECTION_LABEL}>Crear</p>
        <button
          type="button"
          aria-label="Nuevo elemento"
          className="grid h-9 w-full place-items-center rounded-lg border border-dashed border-neutral-300 text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-white dark:hover:text-white"
        >
          <PlusIcon />
        </button>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>Construir</p>
        <div className="grid grid-cols-2 gap-1">
          {BUILD.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={activeTool === id}
              onClick={() => onSelectTool(id)}
              className={`grid size-9 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                activeTool === id
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>Pensar</p>
        {THINK.map(({ id, label, Icon, tint }) => (
          <button
            key={id}
            type="button"
            aria-pressed={activeTool === id}
            onClick={() => onSelectTool(id)}
            className={`${ROW} ${
              activeTool === id
                ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            <span className={`grid size-6 shrink-0 place-items-center rounded-md ${tint}`}>
              <Icon className="size-3.5" />
            </span>
            {label}
          </button>
        ))}
      </div>

      <div className={CARD}>
        <p className={SECTION_LABEL}>IA</p>
        {AI.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onAiAction?.(id)}
            className={`${ROW} text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800`}
          >
            <Icon className="size-4 shrink-0 text-neutral-400" />
            {label}
          </button>
        ))}
      </div>

      <div className={`${CARD} flex justify-center gap-1`}>
        <button
          type="button"
          aria-label="Deshacer"
          className="grid size-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <UndoIcon className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Rehacer"
          className="grid size-8 place-items-center rounded-lg text-neutral-300 transition-colors dark:text-neutral-600"
        >
          <RedoIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
