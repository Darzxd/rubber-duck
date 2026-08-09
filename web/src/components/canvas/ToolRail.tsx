import { PEN_NIBS, type PenNib } from "./boardElements";
import {
  ArrowToolIcon,
  CircleToolIcon,
  ImageIcon,
  NoteIcon,
  PenIcon,
  RectToolIcon,
  RedoIcon,
  SelectIcon,
  TableIcon,
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
  | "note"
  | "idea"
  | "decision"
  | "task"
  | "doubt"
  | "poll";

type ToolRailProps = {
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  shapeKind: ShapeKind;
  onShapeKindChange: (kind: ShapeKind) => void;
  penNib: PenNib;
  onPenNibChange: (nib: PenNib) => void;
  onUndo?: () => void;
  onRedo?: () => void;
};

const BUILD: { id: ToolId; label: string; Icon: typeof SelectIcon }[] = [
  { id: "select", label: "Seleccionar", Icon: SelectIcon },
  { id: "text", label: "Texto", Icon: TextIcon },
  { id: "pen", label: "Lápiz", Icon: PenIcon },
  { id: "note", label: "Nota", Icon: NoteIcon },
  { id: "table", label: "Tabla", Icon: TableIcon },
  { id: "image", label: "Imagen", Icon: ImageIcon },
];

const SHAPES: { kind: ShapeKind; label: string; Icon: typeof SelectIcon }[] = [
  { kind: "rect", label: "Rectángulo", Icon: RectToolIcon },
  { kind: "ellipse", label: "Óvalo", Icon: CircleToolIcon },
  { kind: "triangle", label: "Triángulo", Icon: TriangleToolIcon },
];

// The rail is icons only, so the name has to arrive on hover or it never
// arrives. It sits to the right because there is nothing to the left.
const TIP =
  "pointer-events-none absolute left-full top-1/2 z-40 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100 dark:bg-white dark:text-neutral-900";
const FLYOUT =
  "absolute left-full top-1/2 z-40 ml-2 flex -translate-y-1/2 items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-900";
const MENU_ROW =
  "flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[0.8rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";
const MENU_ON =
  "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white";
const MENU_OFF =
  "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800";
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
  onUndo,
  onRedo,
}: ToolRailProps) {
  const ActiveShapeIcon =
    SHAPES.find((shape) => shape.kind === shapeKind)?.Icon ?? RectToolIcon;

  return (
    <div className="pointer-events-auto absolute left-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-lg shadow-neutral-900/5 dark:border-neutral-700 dark:bg-neutral-900">
      {BUILD.map(({ id, label, Icon }) => (
        <div key={id} className="group relative">
          <button
            type="button"
            aria-label={label}
            aria-pressed={activeTool === id}
            onClick={() => onSelectTool(id)}
            className={`${TOOL} ${activeTool === id ? TOOL_ON : TOOL_OFF}`}
          >
            <Icon />
          </button>

          {id === "pen" && activeTool === "pen" ? (
            <div className={FLYOUT}>
              {(Object.keys(PEN_NIBS) as PenNib[]).map((nib) => (
                <button
                  key={nib}
                  type="button"
                  title={PEN_NIBS[nib].label}
                  aria-label={PEN_NIBS[nib].label}
                  aria-pressed={penNib === nib}
                  onClick={() => onPenNibChange(nib)}
                  className={`grid size-8 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                    penNib === nib ? TOOL_ON : TOOL_OFF
                  }`}
                >
                  <svg viewBox="0 0 24 10" aria-hidden="true" className="h-2.5 w-5">
                    <path
                      d="M2 5h20"
                      stroke="currentColor"
                      strokeWidth={PEN_NIBS[nib].width / 2.2}
                      strokeLinecap={PEN_NIBS[nib].cap}
                      opacity={PEN_NIBS[nib].opacity / 100}
                    />
                  </svg>
                </button>
              ))}
            </div>
          ) : (
            <span className={TIP}>{label}</span>
          )}
        </div>
      ))}

      {/* Arrows and shapes share one slot: both are things you drag out, and
          the slot shows whichever one is armed. */}
      <div className="group relative">
        <button
          type="button"
          aria-label="Formas"
          aria-pressed={activeTool === "shape" || activeTool === "arrow"}
          onClick={() => onSelectTool("shape")}
          className={`${TOOL} relative ${
            activeTool === "shape" || activeTool === "arrow"
              ? TOOL_ON
              : TOOL_OFF
          }`}
        >
          {activeTool === "arrow" ? <ArrowToolIcon /> : <ActiveShapeIcon />}
          <span
            aria-hidden="true"
            className="absolute bottom-0.5 right-0.5 size-1.5 rounded-full bg-current opacity-50"
          />
        </button>

        {activeTool === "shape" ? (
          <div
            className={`${FLYOUT} !items-stretch flex-col gap-0.5 p-1.5`}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => onSelectTool("arrow")}
              className={`${MENU_ROW} ${MENU_OFF}`}
            >
              <ArrowToolIcon className="size-4 shrink-0" />
              Flecha
            </button>

            <span
              aria-hidden="true"
              className="my-1 h-px bg-neutral-200 dark:bg-neutral-700"
            />

            {SHAPES.map(({ kind, label, Icon }) => (
              <button
                key={kind}
                type="button"
                role="menuitem"
                aria-checked={shapeKind === kind}
                onClick={() => onShapeKindChange(kind)}
                className={`${MENU_ROW} ${
                  shapeKind === kind ? MENU_ON : MENU_OFF
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span className={TIP}>Formas</span>
        )}
      </div>

      <span
        aria-hidden="true"
        className="my-0.5 h-px w-6 bg-neutral-200 dark:bg-neutral-700"
      />

      <div className="group relative">
        <button
          type="button"
          aria-label="Deshacer"
          onClick={onUndo}
          className={`${TOOL} ${TOOL_OFF}`}
        >
          <UndoIcon className="size-4" />
        </button>
        <span className={TIP}>Deshacer</span>
      </div>

      <div className="group relative">
        <button
          type="button"
          aria-label="Rehacer"
          onClick={onRedo}
          className={`${TOOL} ${TOOL_OFF}`}
        >
          <RedoIcon className="size-4" />
        </button>
        <span className={TIP}>Rehacer</span>
      </div>
    </div>
  );
}
