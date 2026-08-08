"use client";

import { TONES } from "./StickyNote";
import {
  arrowHead,
  boundsOf,
  pathData,
  type BoardElement,
} from "./boardElements";

export type CellRef = { id: string; row: number; col: number };

type BoardLayerProps = {
  elements: BoardElement[];
  /** The shape being dragged out right now, not yet committed. */
  draft: BoardElement | null;
  selectedIds: string[];
  editingId: string | null;
  editingCell: CellRef | null;
  onChangeText: (id: string, text: string) => void;
  onChangeCell: (ref: CellRef, value: string) => void;
  onFinishEditing: () => void;
  onAddRow: (id: string) => void;
  onAddColumn: (id: string) => void;
};

function Shape({ element }: { element: BoardElement }) {
  const stroke = {
    stroke: element.color,
    strokeWidth: element.width,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    opacity: element.opacity / 100,
    fill: "none",
  };

  switch (element.kind) {
    case "path":
      return <path d={pathData(element.points)} {...stroke} />;
    case "rect":
      return (
        <rect
          x={element.x}
          y={element.y}
          width={element.w}
          height={element.h}
          rx={6}
          {...stroke}
        />
      );
    case "ellipse":
      return (
        <ellipse
          cx={element.x + element.w / 2}
          cy={element.y + element.h / 2}
          rx={Math.abs(element.w / 2)}
          ry={Math.abs(element.h / 2)}
          {...stroke}
        />
      );
    case "arrow":
      return (
        <g {...stroke}>
          <path d={`M${element.x1} ${element.y1} L${element.x2} ${element.y2}`} />
          <path d={arrowHead(element.x1, element.y1, element.x2, element.y2)} />
        </g>
      );
    default:
      return null;
  }
}

const ADD_BUTTON =
  "pointer-events-auto absolute grid place-items-center rounded-full border border-neutral-300 bg-white text-neutral-500 shadow-sm transition-colors hover:border-neutral-900 hover:text-neutral-900";

export default function BoardLayer({
  elements,
  draft,
  selectedIds,
  editingId,
  editingCell,
  onChangeText,
  onChangeCell,
  onFinishEditing,
  onAddRow,
  onAddColumn,
}: BoardLayerProps) {
  const drawn = draft ? [...elements, draft] : elements;

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 size-full overflow-visible">
        {drawn.map((element) => (
          <Shape key={element.id} element={element} />
        ))}

        {elements
          .filter((element) => selectedIds.includes(element.id))
          .map((element) => {
            const box = boundsOf(element);
            return (
              <rect
                key={`sel-${element.id}`}
                x={box.x - 6}
                y={box.y - 6}
                width={box.w + 12}
                height={box.h + 12}
                rx={6}
                fill="none"
                stroke="#3b2fe0"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
            );
          })}
      </svg>

      {drawn.map((element) => {
        if (element.kind === "image") {
          return (
            // Board images are user drops, so next/image cannot size them.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={element.id}
              src={element.src}
              alt=""
              draggable={false}
              className="absolute select-none rounded-md"
              style={{
                left: element.x,
                top: element.y,
                width: element.w,
                height: element.h,
                opacity: element.opacity / 100,
              }}
            />
          );
        }

        if (element.kind === "table") {
          const cols = element.cells[0]?.length ?? 0;
          const isSelected = selectedIds.includes(element.id);
          return (
            <div
              key={element.id}
              className="absolute"
              style={{ left: element.x, top: element.y }}
            >
              <div
                className="grid overflow-hidden rounded-md border border-neutral-300 bg-white shadow-sm dark:border-neutral-600 dark:bg-neutral-900"
                style={{
                  gridTemplateColumns: `repeat(${cols}, ${element.cellW}px)`,
                }}
              >
                {element.cells.map((row, rowIndex) =>
                  row.map((value, colIndex) => {
                    const editing =
                      editingCell?.id === element.id &&
                      editingCell.row === rowIndex &&
                      editingCell.col === colIndex;
                    // The first row reads as a header, like every sheet does.
                    const header = rowIndex === 0;
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`overflow-hidden border-b border-r border-neutral-200 px-2 text-[0.78rem] leading-tight dark:border-neutral-700 ${
                          header
                            ? "bg-neutral-100 font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                            : "text-neutral-700 dark:text-neutral-200"
                        }`}
                        style={{ height: element.cellH, lineHeight: `${element.cellH}px` }}
                      >
                        {editing ? (
                          <input
                            autoFocus
                            value={value}
                            onChange={(event) =>
                              onChangeCell(
                                { id: element.id, row: rowIndex, col: colIndex },
                                event.target.value,
                              )
                            }
                            onBlur={onFinishEditing}
                            className="pointer-events-auto size-full bg-transparent outline-none"
                          />
                        ) : (
                          <span className="block truncate">{value}</span>
                        )}
                      </div>
                    );
                  }),
                )}
              </div>

              {isSelected ? (
                <>
                  <button
                    type="button"
                    aria-label="Agregar columna"
                    title="Agregar columna"
                    onClick={() => onAddColumn(element.id)}
                    className={`${ADD_BUTTON} -right-7 top-1/2 size-5 -translate-y-1/2 text-sm`}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label="Agregar fila"
                    title="Agregar fila"
                    onClick={() => onAddRow(element.id)}
                    className={`${ADD_BUTTON} -bottom-7 left-1/2 size-5 -translate-x-1/2 text-sm`}
                  >
                    +
                  </button>
                </>
              ) : null}
            </div>
          );
        }

        if (element.kind === "text") {
          return editingId === element.id ? (
            <textarea
              key={element.id}
              autoFocus
              value={element.text}
              onChange={(event) => onChangeText(element.id, event.target.value)}
              onBlur={onFinishEditing}
              placeholder="Escribe algo…"
              className="pointer-events-auto absolute w-56 resize-none rounded-md border-2 border-[#3b2fe0] bg-white/95 p-1.5 text-base outline-none"
              style={{ left: element.x, top: element.y, color: element.color }}
            />
          ) : (
            <p
              key={element.id}
              className="absolute w-56 whitespace-pre-wrap p-1.5 text-base leading-snug"
              style={{
                left: element.x,
                top: element.y,
                color: element.color,
                opacity: element.opacity / 100,
              }}
            >
              {element.text}
            </p>
          );
        }

        if (element.kind === "note") {
          const palette = TONES[element.tone];
          return (
            <div
              key={element.id}
              className="absolute w-40"
              style={{ left: element.x, top: element.y }}
            >
              <span
                className={`inline-block rounded-t-md px-2 py-0.5 text-[0.6rem] font-bold ${palette.flag}`}
              >
                {element.tag}
              </span>
              {editingId === element.id ? (
                <textarea
                  autoFocus
                  value={element.text}
                  onChange={(event) =>
                    onChangeText(element.id, event.target.value)
                  }
                  onBlur={onFinishEditing}
                  placeholder="Escribe la nota…"
                  className={`pointer-events-auto block h-24 w-full resize-none rounded-b-md rounded-tr-md p-2 text-[0.8rem] leading-snug outline-none ${palette.note}`}
                />
              ) : (
                <div
                  className={`min-h-24 whitespace-pre-wrap rounded-b-md rounded-tr-md p-2 text-[0.8rem] leading-snug shadow-md shadow-neutral-900/10 ${palette.note}`}
                >
                  {element.text}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
