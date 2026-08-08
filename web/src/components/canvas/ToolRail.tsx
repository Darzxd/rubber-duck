import { PEN_NIBS, type PenNib } from "./boardElements";
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
  PollIcon,
  RectToolIcon,
  RedoIcon,
  SelectIcon,
  SelectAllIcon,
  SparkleIcon,
  TableIcon,
  TaskTrendIcon,
  TextIcon,
  TriangleToolIcon,
  UndoIcon,
} from "./icons";

/** The three shapes that share one slot on the rail. */
export type ShapeKind = "rect" | "ellipse" | "triangle";

export type ToolId =
  | "select"
  | "text"
  | "pen"
  | "shape"
  | "arrow"
  | "image"
  | "table"
  | "hand"
  | "idea"
  | "decision"
  | "task"
  | "doubt"
  | "poll";

export type AiActionId = "capture" | "organise" | "summarise";

type ToolRailProps = {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  shapeKind: ShapeKind;
  onShapeKindChange: (kind: ShapeKind) => void;
  penNib: PenNib;
  onPenNibChange: (nib: PenNib) => void;
  onAiAction?: (action: AiActionId) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
};

const BUILD: { id: ToolId; label: string; Icon: typeof SelectIcon }[] = [
  { id: "select", label: "Seleccionar", Icon: SelectIcon },
  { id: "text", label: "Texto", Icon: TextIcon },
  { id: "pen", label: "Lápiz", Icon: PenIcon },
  { id: "arrow", label: "Flecha", Icon: ArrowToolIcon },
  { id: "table", label: "Tabla", Icon: TableIcon },
  { id: "image", label: "Imagen", Icon: ImageIcon },
];

const SHAPES: { kind: ShapeKind; label: string; Icon: typeof SelectIcon }[] = [
  { kind: "rect", label: "Rectángulo", Icon: RectToolIcon },
  { kind: "ellipse", label: "Círculo", Icon: CircleToolIcon },
  { kind: "triangle", label: "Triángulo", Icon: TriangleToolIcon },
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
  { id: "poll", label: "Votación", Icon: PollIcon, tint: "bg-rose-50 text-rose-500 dark:bg-rose-500/15" },
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
const TOOL =
  "grid size-9 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";
const TOOL_ON = "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900";
const TOOL_OFF =
  "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800";

export default function ToolRail({
  activeTool,
  onSelectTool,
  shapeKind,
  onShapeKindChange,
  penNib,
  onPenNibChange,
  onAiAction,
  onUndo,
  onRedo,
  onSelectAll,
}: ToolRailProps) {
  const ActiveShapeIcon =
    SHAPES.find((shape) => shape.kind === shapeKind)?.Icon ?? RectToolIcon;

  return (
    <div className="no-scrollbar pointer-events-auto absolute left-3 top-3 z-30 flex max-h-[calc(100%-1.5rem)] w-[6.5rem] flex-col gap-2 overflow-y-auto">
      <div className={`${CARD} relative`}>
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
              className={`${TOOL} ${activeTool === id ? TOOL_ON : TOOL_OFF}`}
            >
              <Icon />
            </button>
          ))}

          {/* The three shapes share one slot; the icon shows the active one. */}
          <button
            type="button"
            title="Formas"
            aria-label="Formas"
            aria-pressed={activeTool === "shape"}
            onClick={() => onSelectTool("shape")}
            className={`${TOOL} relative ${
              activeTool === "shape" ? TOOL_ON : TOOL_OFF
            }`}
          >
            <ActiveShapeIcon />
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 right-0.5 size-1.5 rounded-full bg-current opacity-50"
            />
          </button>
        </div>

        {activeTool === "pen" ? (
          <div className="mt-1 border-t border-neutral-200 pt-1.5 dark:border-neutral-700">
            <p className={SECTION_LABEL}>Punta</p>
            {(Object.keys(PEN_NIBS) as PenNib[]).map((nib) => (
              <button
                key={nib}
                type="button"
                aria-label={PEN_NIBS[nib].label}
                aria-pressed={penNib === nib}
                onClick={() => onPenNibChange(nib)}
                className={`${ROW} ${
                  penNib === nib
                    ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                <svg viewBox="0 0 24 10" aria-hidden="true" className="h-2.5 w-6 shrink-0">
                  <path
                    d="M2 5h20"
                    stroke="currentColor"
                    strokeWidth={PEN_NIBS[nib].width / 2.2}
                    strokeLinecap={PEN_NIBS[nib].cap}
                    opacity={PEN_NIBS[nib].opacity / 100}
                  />
                </svg>
                {PEN_NIBS[nib].label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Expands in place. A flyout beside the rail gets clipped, because the
            rail scrolls and anything past its 6.5rem width is cut off. */}
        {activeTool === "shape" ? (
          <div className="mt-1 border-t border-neutral-200 pt-1.5 dark:border-neutral-700">
            <p className={SECTION_LABEL}>Forma</p>
            <div className="grid grid-cols-3 gap-0.5">
              {SHAPES.map(({ kind, label, Icon }) => (
                <button
                  key={kind}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={shapeKind === kind}
                  onClick={() => onShapeKindChange(kind)}
                  className={`grid size-7 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                    shapeKind === kind ? TOOL_ON : TOOL_OFF
                  }`}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
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

      <div className={CARD}>
        <button
          type="button"
          onClick={onSelectAll}
          aria-label="Seleccionar todo"
          title="Seleccionar todo (Ctrl+A)"
          className={`${ROW} text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800`}
        >
          <SelectAllIcon className="size-4 shrink-0 text-neutral-400" />
          Todo
        </button>
      </div>

      <div className={`${CARD} flex justify-center gap-1`}>
        <button
          type="button"
          aria-label="Deshacer"
          onClick={onUndo}
          className="grid size-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <UndoIcon className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Rehacer"
          onClick={onRedo}
          className="grid size-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          <RedoIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
