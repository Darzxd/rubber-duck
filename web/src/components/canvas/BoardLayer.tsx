"use client";

import { TONES } from "./StickyNote";
import {
  arrowHead,
  boundsOf,
  pathData,
  type BoardElement,
} from "./boardElements";

type BoardLayerProps = {
  elements: BoardElement[];
  /** The shape being dragged out right now, not yet committed. */
  draft: BoardElement | null;
  selectedId: string | null;
  editingId: string | null;
  onChangeText: (id: string, text: string) => void;
  onFinishEditing: () => void;
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
          <path
            d={arrowHead(element.x1, element.y1, element.x2, element.y2)}
          />
        </g>
      );
    default:
      return null;
  }
}

export default function BoardLayer({
  elements,
  draft,
  selectedId,
  editingId,
  onChangeText,
  onFinishEditing,
}: BoardLayerProps) {
  const drawn = draft ? [...elements, draft] : elements;
  const selected = elements.find((element) => element.id === selectedId);
  const box = selected ? boundsOf(selected) : null;

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 size-full overflow-visible">
        {drawn.map((element) => (
          <Shape key={element.id} element={element} />
        ))}

        {box ? (
          <rect
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
        ) : null}
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
