import { Graph, layout } from "@dagrejs/dagre";

import type { BoardElement } from "@/components/canvas/boardElements";
import type { StickyTone } from "@/components/canvas/StickyNote";

/** Which kind of thing a node is — sets the sticky's colour and tag. */
export type NodeKind = "idea" | "decision" | "tarea" | "duda";

/** Every op the backend Architect can emit. Mirrors shared/protocol.ts. Every
 *  op carries the pixel coordinates the reducer needs; the model never sees
 *  pixels, the backend fills them in. */
export type ArchitectOp =
  | {
      type: "crear_nodo";
      id: string;
      texto: string;
      columna: number;
      kind: NodeKind;
      x: number;
      y: number;
    }
  | { type: "editar_nodo"; id: string; texto: string }
  | {
      type: "mover_nodo";
      id: string;
      columna: number;
      x: number;
      y: number;
    }
  | {
      type: "conectar";
      id: string;
      de: string;
      a: string;
      label?: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
  | {
      type: "pegar_nota";
      id: string;
      nodo_id: string;
      texto: string;
      autor?: string;
      x: number;
      y: number;
    }
  | { type: "borrar"; id: string }
  | {
      type: "titular_columna";
      columna: number;
      titulo: string;
      x: number;
      y: number;
    };

type NodeState = {
  texto: string;
  kind: NodeKind;
  columna: number;
  x: number;
  y: number;
};

type ArrowState = {
  de: string;
  a: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type TitleState = { titulo: string; x: number; y: number };

/** Annotations live in a side panel, not on the canvas, so the reducer for
 *  the pizarra does not carry them. `useSessionStream` peels them off the
 *  event stream on its own and pushes them into its own notes list. */
export type ArchitectState = {
  nodes: Map<string, NodeState>;
  arrows: Map<string, ArrowState>;
  titles: Map<number, TitleState>;
};

export function emptyState(): ArchitectState {
  return {
    nodes: new Map(),
    arrows: new Map(),
    titles: new Map(),
  };
}

const KINDS: NodeKind[] = ["idea", "decision", "tarea", "duda"];

// Kind → sticky style. Same palette the backend uses in architect_board.py, so
// a node from an op looks the same as one from the /digest bootstrap.
const STYLE: Record<
  NodeKind,
  { tag: string; tone: StickyTone; colour: string }
> = {
  idea: { tag: "Idea", tone: "amber", colour: "#f59e0b" },
  decision: { tag: "Decisión", tone: "green", colour: "#22c55e" },
  tarea: { tag: "Tarea", tone: "blue", colour: "#3b82f6" },
  duda: { tag: "Duda", tone: "violet", colour: "#8b5cf6" },
};

const INK = "#525252";

// Sticky size. Kept in sync with backend NOTE_W/NOTE_H so an op that carries
// pixel coords still lines up when dagre relaxes into similar positions.
const NOTE_W = 160;
const NOTE_H = 110;
// Where the flow starts on the canvas. Leaves the tool rail on the left with
// clear space, and pushes the diagram below the TopBar.
const ORIGIN_X = 210;
const ORIGIN_Y = 104;
// Room between ranks and between nodes in a rank. Wide enough that arrow
// labels can sit between two nodes without landing on one.
const RANK_SEP = 90;
const NODE_SEP = 46;

/** Runs dagre over the current architect graph and returns each node's
 *  top-left position, in board pixels. Left-to-right flow, so the room reads
 *  the pizarra the way a diagram reads: start on the left, arrows to the
 *  right. Called on every state change through deriveElements. */
function layoutFlow(state: ArchitectState): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (state.nodes.size === 0) return positions;

  const g = new Graph({ multigraph: false, compound: false });
  g.setGraph({
    rankdir: "LR",
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const id of state.nodes.keys()) {
    g.setNode(id, { width: NOTE_W, height: NOTE_H });
  }
  for (const arrow of state.arrows.values()) {
    if (state.nodes.has(arrow.de) && state.nodes.has(arrow.a)) {
      g.setEdge(arrow.de, arrow.a);
    }
  }

  layout(g);

  for (const id of state.nodes.keys()) {
    const laid = g.node(id);
    if (!laid) continue;
    // Dagre gives centre coordinates; the renderer wants top-left.
    positions.set(id, {
      x: ORIGIN_X + laid.x - NOTE_W / 2,
      y: ORIGIN_Y + laid.y - NOTE_H / 2,
    });
  }
  return positions;
}

function copy(state: ArchitectState): ArchitectState {
  return {
    nodes: new Map(state.nodes),
    arrows: new Map(state.arrows),
    titles: new Map(state.titles),
  };
}

/** Applies one op and returns the new state. Ops on missing targets are
 *  ignored — the backend can emit them out of order across reconnects and the
 *  board would rather stay behind than throw. */
export function applyOp(state: ArchitectState, op: ArchitectOp): ArchitectState {
  const next = copy(state);
  switch (op.type) {
    case "crear_nodo": {
      if (!KINDS.includes(op.kind)) return state;
      next.nodes.set(op.id, {
        texto: op.texto,
        kind: op.kind,
        columna: op.columna,
        x: op.x,
        y: op.y,
      });
      return next;
    }
    case "editar_nodo": {
      const node = next.nodes.get(op.id);
      if (!node) return state;
      next.nodes.set(op.id, { ...node, texto: op.texto });
      return next;
    }
    case "mover_nodo": {
      const node = next.nodes.get(op.id);
      if (!node) return state;
      next.nodes.set(op.id, {
        ...node,
        columna: op.columna,
        x: op.x,
        y: op.y,
      });
      return next;
    }
    case "conectar": {
      next.arrows.set(op.id, {
        de: op.de,
        a: op.a,
        label: op.label ?? "",
        x1: op.x1,
        y1: op.y1,
        x2: op.x2,
        y2: op.y2,
      });
      return next;
    }
    case "pegar_nota": {
      // Notes go to a side panel, not the pizarra. The hook consumes this op
      // path separately; it never reaches the canvas reducer.
      return state;
    }
    case "borrar": {
      if (next.nodes.has(op.id)) {
        next.nodes.delete(op.id);
        // Arrows lose their anchor when a node goes. The backend cascades the
        // same way — this keeps the two ends aligned without extra ops.
        for (const [arid, arrow] of next.arrows) {
          if (arrow.de === op.id || arrow.a === op.id) next.arrows.delete(arid);
        }
        return next;
      }
      if (next.arrows.has(op.id)) {
        next.arrows.delete(op.id);
        return next;
      }
      return state;
    }
    case "titular_columna": {
      next.titles.set(op.columna, {
        titulo: op.titulo,
        x: op.x,
        y: op.y,
      });
      return next;
    }
    default:
      return state;
  }
}

/** The /digest bootstrap shape. Fields match architect_board.snapshot() on
 *  the backend. */
export type ArchitectSnapshot = {
  nodes: Array<{
    id: string;
    texto: string;
    columna: number;
    kind: NodeKind;
    x: number;
    y: number;
  }>;
  annotations: Array<{
    id: string;
    nodo_id: string;
    texto: string;
    autor?: string;
    x: number;
    y: number;
  }>;
  arrows: Array<{
    id: string;
    de: string;
    a: string;
    label?: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
  titles: Array<{ columna: number; titulo: string; x: number; y: number }>;
};

export function fromSnapshot(snapshot: ArchitectSnapshot): ArchitectState {
  const state = emptyState();
  for (const n of snapshot.nodes) {
    if (!KINDS.includes(n.kind)) continue;
    state.nodes.set(n.id, {
      texto: n.texto,
      kind: n.kind,
      columna: n.columna,
      x: n.x,
      y: n.y,
    });
  }
  // Annotations are read by useSessionStream directly, not stored here.
  for (const ar of snapshot.arrows) {
    state.arrows.set(ar.id, {
      de: ar.de,
      a: ar.a,
      label: ar.label ?? "",
      x1: ar.x1,
      y1: ar.y1,
      x2: ar.x2,
      y2: ar.y2,
    });
  }
  for (const t of snapshot.titles) {
    state.titles.set(t.columna, { titulo: t.titulo, x: t.x, y: t.y });
  }
  return state;
}

/** Turns the structured board into the flat elements the BoardLayer renders.
 *  Runs a left-to-right dagre layout on the graph so a change to any node or
 *  arrow reflows the diagram — the wire coords the backend sent are ignored
 *  here in favour of a layout that keeps the flow readable as it grows. */
export function deriveElements(state: ArchitectState): BoardElement[] {
  const els: BoardElement[] = [];
  const base = {
    width: 2,
    opacity: 100,
    dash: "solid" as const,
    radius: 8,
    cap: "round" as const,
  };

  const positions = layoutFlow(state);

  for (const [id, node] of state.nodes) {
    const style = STYLE[node.kind];
    const pos = positions.get(id) ?? { x: node.x, y: node.y };
    els.push({
      ...base,
      id: `n${id}`,
      color: style.colour,
      kind: "note",
      x: pos.x,
      y: pos.y,
      text: node.texto,
      tag: style.tag,
      tone: style.tone,
    });
  }

  for (const [id, arrow] of state.arrows) {
    const source = positions.get(arrow.de);
    const target = positions.get(arrow.a);
    if (!source || !target) continue;
    // Left-to-right routing: right edge of source, left edge of target. Any
    // rank difference dagre laid out is handled by the diagonal itself.
    const x1 = source.x + NOTE_W;
    const y1 = source.y + NOTE_H / 2;
    const x2 = target.x;
    const y2 = target.y + NOTE_H / 2;
    els.push({
      ...base,
      id,
      color: INK,
      kind: "arrow",
      x1,
      y1,
      x2,
      y2,
    });
    if (arrow.label) {
      els.push({
        ...base,
        id: `al${id}`,
        color: INK,
        kind: "text",
        x: (x1 + x2) / 2 - 40,
        y: (y1 + y2) / 2 - 20,
        text: arrow.label,
      });
    }
  }

  return els;
}

/** Guards the incoming op event so a malformed payload never reaches the
 *  reducer. Kind and column ranges match the backend. */
export function isArchitectOp(v: unknown): v is ArchitectOp {
  if (typeof v !== "object" || v === null) return false;
  const op = v as Record<string, unknown>;
  const t = op.type;
  if (typeof t !== "string") return false;
  switch (t) {
    case "crear_nodo":
      return (
        typeof op.id === "string" &&
        typeof op.texto === "string" &&
        typeof op.columna === "number" &&
        typeof op.kind === "string" &&
        KINDS.includes(op.kind as NodeKind) &&
        typeof op.x === "number" &&
        typeof op.y === "number"
      );
    case "editar_nodo":
      return typeof op.id === "string" && typeof op.texto === "string";
    case "mover_nodo":
      return (
        typeof op.id === "string" &&
        typeof op.columna === "number" &&
        typeof op.x === "number" &&
        typeof op.y === "number"
      );
    case "conectar":
      return (
        typeof op.id === "string" &&
        typeof op.de === "string" &&
        typeof op.a === "string" &&
        typeof op.x1 === "number" &&
        typeof op.y1 === "number" &&
        typeof op.x2 === "number" &&
        typeof op.y2 === "number"
      );
    case "pegar_nota":
      return (
        typeof op.id === "string" &&
        typeof op.nodo_id === "string" &&
        typeof op.texto === "string" &&
        typeof op.x === "number" &&
        typeof op.y === "number"
      );
    case "borrar":
      return typeof op.id === "string";
    case "titular_columna":
      return (
        typeof op.columna === "number" &&
        typeof op.titulo === "string" &&
        typeof op.x === "number" &&
        typeof op.y === "number"
      );
    default:
      return false;
  }
}
