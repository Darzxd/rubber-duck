import type { StickyTone } from "./StickyNote";

export type Point = { x: number; y: number };

type Base = {
  id: string;
  color: string;
  width: number;
  opacity: number;
};

export type BoardElement =
  | (Base & { kind: "path"; points: Point[] })
  | (Base & { kind: "rect"; x: number; y: number; w: number; h: number })
  | (Base & { kind: "ellipse"; x: number; y: number; w: number; h: number })
  | (Base & { kind: "arrow"; x1: number; y1: number; x2: number; y2: number })
  | (Base & { kind: "text"; x: number; y: number; text: string })
  | (Base & {
      kind: "note";
      x: number;
      y: number;
      text: string;
      tag: string;
      tone: StickyTone;
    })
  | (Base & {
      kind: "image";
      x: number;
      y: number;
      w: number;
      h: number;
      src: string;
    })
  | (Base & {
      kind: "table";
      x: number;
      y: number;
      /** Row-major cell text; its shape is the size of the table. */
      cells: string[][];
      cellW: number;
      cellH: number;
    });

export type BoundingBox = { x: number; y: number; w: number; h: number };

let counter = 0;

/** Ids are only ever minted from a user gesture, so they never hit hydration. */
export function newId() {
  counter += 1;
  return `el-${counter}-${Date.now().toString(36)}`;
}

const NOTE_SIZE = { w: 160, h: 110 };
const TEXT_SIZE = { w: 220, h: 40 };

export function boundsOf(element: BoardElement): BoundingBox {
  switch (element.kind) {
    case "path": {
      const xs = element.points.map((point) => point.x);
      const ys = element.points.map((point) => point.y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    case "rect":
    case "ellipse":
    case "image":
      return { x: element.x, y: element.y, w: element.w, h: element.h };
    case "arrow":
      return {
        x: Math.min(element.x1, element.x2),
        y: Math.min(element.y1, element.y2),
        w: Math.abs(element.x2 - element.x1),
        h: Math.abs(element.y2 - element.y1),
      };
    case "note":
      return { x: element.x, y: element.y, ...NOTE_SIZE };
    case "text":
      return { x: element.x, y: element.y, ...TEXT_SIZE };
    case "table":
      return {
        x: element.x,
        y: element.y,
        w: (element.cells[0]?.length ?? 0) * element.cellW,
        h: element.cells.length * element.cellH,
      };
  }
}

export const TABLE_DEFAULTS = { cols: 3, rows: 3, cellW: 116, cellH: 34 };

export function emptyCells(rows: number, cols: number) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
}

/** Which cell of a table a board point lands on, or null if it misses. */
export function cellAt(
  element: Extract<BoardElement, { kind: "table" }>,
  point: Point,
) {
  const col = Math.floor((point.x - element.x) / element.cellW);
  const row = Math.floor((point.y - element.y) / element.cellH);
  const cols = element.cells[0]?.length ?? 0;
  if (row < 0 || col < 0 || row >= element.cells.length || col >= cols) {
    return null;
  }
  return { row, col };
}

/** Generous by a few px so thin strokes are still easy to grab. */
export function hitTest(element: BoardElement, point: Point, slack = 6) {
  const box = boundsOf(element);
  return (
    point.x >= box.x - slack &&
    point.x <= box.x + box.w + slack &&
    point.y >= box.y - slack &&
    point.y <= box.y + box.h + slack
  );
}

export function moveElement(
  element: BoardElement,
  dx: number,
  dy: number,
): BoardElement {
  switch (element.kind) {
    case "path":
      return {
        ...element,
        points: element.points.map((point) => ({
          x: point.x + dx,
          y: point.y + dy,
        })),
      };
    case "arrow":
      return {
        ...element,
        x1: element.x1 + dx,
        y1: element.y1 + dy,
        x2: element.x2 + dx,
        y2: element.y2 + dy,
      };
    default:
      return { ...element, x: element.x + dx, y: element.y + dy };
  }
}

export function pathData(points: Point[]) {
  if (points.length === 0) return "";
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
}

/** The two short strokes that make a line read as an arrow. */
export function arrowHead(x1: number, y1: number, x2: number, y2: number) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 12;
  const spread = 0.42;
  const left = {
    x: x2 - size * Math.cos(angle - spread),
    y: y2 - size * Math.sin(angle - spread),
  };
  const right = {
    x: x2 - size * Math.cos(angle + spread),
    y: y2 - size * Math.sin(angle + spread),
  };
  return `M${left.x} ${left.y} L${x2} ${y2} L${right.x} ${right.y}`;
}

export const NOTE_PRESETS: Record<
  string,
  { tag: string; tone: StickyTone }
> = {
  idea: { tag: "Idea", tone: "amber" },
  decision: { tag: "Decisión", tone: "green" },
  task: { tag: "Tarea", tone: "blue" },
  doubt: { tag: "Duda", tone: "violet" },
};
