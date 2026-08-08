import {
  ArrowToolIcon,
  HandIcon,
  ImageIcon,
  PenIcon,
  RedoIcon,
  SelectIcon,
  ShapesIcon,
  TextIcon,
  UndoIcon,
} from "./icons";

export type ToolId =
  | "select"
  | "pen"
  | "text"
  | "shapes"
  | "image"
  | "arrow"
  | "hand";

type ToolRailProps = {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
};

const TOOLS: { id: ToolId; label: string; Icon: typeof SelectIcon }[] = [
  { id: "select", label: "Seleccionar", Icon: SelectIcon },
  { id: "pen", label: "Lápiz", Icon: PenIcon },
  { id: "text", label: "Texto", Icon: TextIcon },
  { id: "shapes", label: "Formas", Icon: ShapesIcon },
  { id: "image", label: "Imagen", Icon: ImageIcon },
  { id: "arrow", label: "Flecha", Icon: ArrowToolIcon },
  { id: "hand", label: "Mover lienzo", Icon: HandIcon },
];

const BUTTON =
  "grid size-9 place-items-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

export default function ToolRail({ activeTool, onSelectTool }: ToolRailProps) {
  return (
    <div className="pointer-events-auto absolute left-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/5 sm:left-4 dark:border-neutral-700 dark:bg-neutral-900">
      {TOOLS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={activeTool === id}
          onClick={() => onSelectTool(id)}
          className={`${BUTTON} ${
            activeTool === id
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          }`}
        >
          <Icon />
        </button>
      ))}

      <span className="my-1 h-px w-6 bg-neutral-200 dark:bg-neutral-700" />

      <button
        type="button"
        title="Deshacer"
        aria-label="Deshacer"
        className={`${BUTTON} text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white`}
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        title="Rehacer"
        aria-label="Rehacer"
        className={`${BUTTON} text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white`}
      >
        <RedoIcon />
      </button>
    </div>
  );
}
