"""Runtime state of what the Architect has drawn, plus the pixel math it uses
to place things. The model works with columns, ids and kinds; every coordinate
is worked out here so it stays consistent between ops and revisions."""

from dataclasses import dataclass, field
from typing import Optional

from agents.state import NodeKind

# Layout constants. Same numbers canvas.py has used since day one; the sticky
# size mirrors NOTE_SIZE in boardElements.ts, so an arrow always lands on the
# sticky the front actually drew.
ORIGIN_X = 210
ORIGIN_Y = 104
COLUMN_W = 200
COLUMN_GAP = 64
NOTE_W = 160
NOTE_H = 110
NOTE_GAP = 48
GROUP_HEAD = 52
GROUP_PAD = 20
ANNOTATION_H = 68
ANNOTATION_STEP = ANNOTATION_H + 8
ANNOTATION_GAP = 12
INK = "#525252"

# Kind → sticky style. Same palette canvas.py uses today, kept here so this
# module can produce a full element snapshot without importing canvas.
TONE: dict[str, tuple[str, str, str]] = {
    "idea": ("Idea", "amber", "#f59e0b"),
    "decision": ("Decisión", "green", "#22c55e"),
    "tarea": ("Tarea", "blue", "#3b82f6"),
    "duda": ("Duda", "violet", "#8b5cf6"),
}


@dataclass
class Node:
    id: str
    texto: str
    columna: int
    row: int
    kind: NodeKind


@dataclass
class Annotation:
    id: str
    nodo_id: str
    texto: str
    autor: str
    slot: int


@dataclass
class Arrow:
    id: str
    de: str
    a: str
    label: str


@dataclass
class ArchitectBoard:
    """Everything the Architect currently has on the pizarra, keyed for O(1)
    lookup by id. The private stacks preserve visual order per column and per
    node so a new sticky lands under the last one instead of on top of it."""

    nodes: dict[str, Node] = field(default_factory=dict)
    annotations: dict[str, Annotation] = field(default_factory=dict)
    arrows: dict[str, Arrow] = field(default_factory=dict)
    titles: dict[int, str] = field(default_factory=dict)
    _column_stacks: dict[int, list[str]] = field(default_factory=dict)
    _note_stacks: dict[str, list[str]] = field(default_factory=dict)


def column_x(columna: int) -> float:
    return ORIGIN_X + columna * (COLUMN_W + COLUMN_GAP) + GROUP_PAD


def _column_head(board: ArchitectBoard, columna: int) -> float:
    # Only columns with a title get the tall header. An untitled column starts
    # right at ORIGIN_Y — the alternative is a floating gap that reads as a bug.
    return GROUP_HEAD if board.titles.get(columna) else 0


def node_xy(board: ArchitectBoard, columna: int, row: int) -> tuple[float, float]:
    return (
        column_x(columna),
        ORIGIN_Y + _column_head(board, columna) + row * (NOTE_H + NOTE_GAP),
    )


def annotation_xy(node_x: float, node_y: float, slot: int) -> tuple[float, float]:
    return (node_x + NOTE_W + ANNOTATION_GAP, node_y + slot * ANNOTATION_STEP)


def title_xy(columna: int) -> tuple[float, float]:
    return (column_x(columna), ORIGIN_Y + 12)


def _arrow_points(
    board: ArchitectBoard, source: Node, target: Node
) -> tuple[float, float, float, float]:
    """Where a line between two nodes actually starts and ends. Down the column
    when both live in it, across when they do not — an arrow that cuts through
    the notes in between reads as a mistake."""
    sx, sy = node_xy(board, source.columna, source.row)
    tx, ty = node_xy(board, target.columna, target.row)
    if source.columna == target.columna:
        return (sx + NOTE_W / 2, sy + NOTE_H, tx + NOTE_W / 2, ty)
    side = 0 if sx < tx else NOTE_W
    return (sx + (NOTE_W - side), sy + NOTE_H / 2, tx + side, ty + NOTE_H / 2)


# --- op application. Each function returns the wire payload or None if the op
# was a no-op (target missing, duplicate id, unknown kind). Returning None is
# the way the Architect's mistakes are swallowed without breaking the board.


def crear_nodo(
    board: ArchitectBoard, id_: str, texto: str, columna: int, kind: str
) -> Optional[dict]:
    if not id_ or not texto or kind not in TONE:
        return None
    if id_ in board.nodes:
        return None
    stack = board._column_stacks.setdefault(columna, [])
    row = len(stack)
    stack.append(id_)
    board.nodes[id_] = Node(id_, texto, columna, row, kind)  # type: ignore[arg-type]
    x, y = node_xy(board, columna, row)
    return {
        "type": "crear_nodo",
        "id": id_,
        "texto": texto,
        "columna": columna,
        "kind": kind,
        "x": x,
        "y": y,
    }


def editar_nodo(board: ArchitectBoard, id_: str, texto: str) -> Optional[dict]:
    node = board.nodes.get(id_)
    if not node or not texto or texto == node.texto:
        return None
    node.texto = texto
    return {"type": "editar_nodo", "id": id_, "texto": texto}


def mover_nodo(board: ArchitectBoard, id_: str, columna: int) -> Optional[dict]:
    node = board.nodes.get(id_)
    if not node or node.columna == columna:
        return None
    old = board._column_stacks.get(node.columna, [])
    if id_ in old:
        old.remove(id_)
    new_stack = board._column_stacks.setdefault(columna, [])
    node.columna = columna
    node.row = len(new_stack)
    new_stack.append(id_)
    x, y = node_xy(board, columna, node.row)
    return {"type": "mover_nodo", "id": id_, "columna": columna, "x": x, "y": y}


def conectar(
    board: ArchitectBoard, de: str, a: str, label: str
) -> Optional[dict]:
    if de == a or de not in board.nodes or a not in board.nodes:
        return None
    arrow_id = f"a_{de}_{a}"
    if arrow_id in board.arrows:
        return None
    board.arrows[arrow_id] = Arrow(arrow_id, de, a, label or "")
    x1, y1, x2, y2 = _arrow_points(board, board.nodes[de], board.nodes[a])
    op: dict = {
        "type": "conectar",
        "id": arrow_id,
        "de": de,
        "a": a,
        "x1": x1,
        "y1": y1,
        "x2": x2,
        "y2": y2,
    }
    if label:
        op["label"] = label
    return op


def pegar_nota(
    board: ArchitectBoard, nodo_id: str, texto: str, autor: str
) -> Optional[dict]:
    if nodo_id not in board.nodes or not texto:
        return None
    stack = board._note_stacks.setdefault(nodo_id, [])
    slot = len(stack)
    ann_id = f"n_{nodo_id}_{slot}"
    stack.append(ann_id)
    board.annotations[ann_id] = Annotation(
        ann_id, nodo_id, texto, autor or "", slot
    )
    node = board.nodes[nodo_id]
    nx, ny = node_xy(board, node.columna, node.row)
    x, y = annotation_xy(nx, ny, slot)
    op: dict = {
        "type": "pegar_nota",
        "id": ann_id,
        "nodo_id": nodo_id,
        "texto": texto,
        "x": x,
        "y": y,
    }
    if autor:
        op["autor"] = autor
    return op


def borrar(board: ArchitectBoard, id_: str) -> Optional[dict]:
    if id_ in board.nodes:
        node = board.nodes.pop(id_)
        stack = board._column_stacks.get(node.columna, [])
        if id_ in stack:
            stack.remove(id_)
        # A node's annotations and arrows lose their anchor when the node goes,
        # so they leave with it — otherwise the board fills up with things
        # hanging off nothing.
        for ann_id in list(board._note_stacks.pop(id_, [])):
            board.annotations.pop(ann_id, None)
        orphans = [
            aid for aid, ar in board.arrows.items() if ar.de == id_ or ar.a == id_
        ]
        for aid in orphans:
            board.arrows.pop(aid, None)
        return {"type": "borrar", "id": id_}

    if id_ in board.annotations:
        ann = board.annotations.pop(id_)
        stack = board._note_stacks.get(ann.nodo_id, [])
        if id_ in stack:
            stack.remove(id_)
        return {"type": "borrar", "id": id_}

    if id_ in board.arrows:
        board.arrows.pop(id_)
        return {"type": "borrar", "id": id_}

    return None


def titular_columna(
    board: ArchitectBoard, columna: int, titulo: str
) -> Optional[dict]:
    if not titulo or board.titles.get(columna) == titulo:
        return None
    board.titles[columna] = titulo
    x, y = title_xy(columna)
    return {
        "type": "titular_columna",
        "columna": columna,
        "titulo": titulo,
        "x": x,
        "y": y,
    }


def snapshot(board: ArchitectBoard) -> dict:
    """The structured board as JSON, for a browser opening the session late.
    Every field the frontend reducer would have built up from ops, minus the
    private stacks — those are backend bookkeeping."""
    return {
        "nodes": [
            {
                "id": n.id,
                "texto": n.texto,
                "columna": n.columna,
                "kind": n.kind,
                **dict(zip(("x", "y"), node_xy(board, n.columna, n.row))),
            }
            for n in board.nodes.values()
        ],
        "annotations": [
            {
                "id": a.id,
                "nodo_id": a.nodo_id,
                "texto": a.texto,
                "autor": a.autor,
                **dict(
                    zip(
                        ("x", "y"),
                        annotation_xy(
                            *node_xy(
                                board,
                                board.nodes[a.nodo_id].columna,
                                board.nodes[a.nodo_id].row,
                            ),
                            a.slot,
                        ),
                    )
                ),
            }
            for a in board.annotations.values()
            if a.nodo_id in board.nodes
        ],
        "arrows": [
            {
                "id": ar.id,
                "de": ar.de,
                "a": ar.a,
                "label": ar.label,
                **dict(
                    zip(
                        ("x1", "y1", "x2", "y2"),
                        _arrow_points(board, board.nodes[ar.de], board.nodes[ar.a]),
                    )
                ),
            }
            for ar in board.arrows.values()
            if ar.de in board.nodes and ar.a in board.nodes
        ],
        "titles": [
            {
                "columna": columna,
                "titulo": titulo,
                **dict(zip(("x", "y"), title_xy(columna))),
            }
            for columna, titulo in board.titles.items()
            if titulo
        ],
    }


def to_elements(board: ArchitectBoard) -> list[dict]:
    """The whole board as canvas primitives, for consumers that expect the flat
    list (a browser opening a session that is already halfway through)."""
    elements: list[dict] = []

    def base(id_: str, color: str, **rest) -> dict:
        return {
            "id": id_,
            "color": color,
            "width": 2,
            "opacity": 100,
            "dash": "solid",
            "radius": 8,
            "cap": "round",
            **rest,
        }

    for columna, titulo in board.titles.items():
        if not titulo:
            continue
        x, y = title_xy(columna)
        elements.append(
            base(f"ft{columna}", INK, kind="text", x=x, y=y, text=titulo)
        )

    for node in board.nodes.values():
        x, y = node_xy(board, node.columna, node.row)
        tag, tone, colour = TONE[node.kind]
        elements.append(
            base(
                f"n{node.id}",
                colour,
                kind="note",
                x=x,
                y=y,
                text=node.texto,
                tag=tag,
                tone=tone,
            )
        )

    for ann in board.annotations.values():
        node = board.nodes.get(ann.nodo_id)
        if not node:
            continue
        nx, ny = node_xy(board, node.columna, node.row)
        x, y = annotation_xy(nx, ny, ann.slot)
        elements.append(
            base(
                f"an{ann.id}",
                "#fde68a",
                kind="note",
                x=x,
                y=y,
                text=ann.texto,
                tag="Nota",
                tone="amber",
            )
        )

    for arrow in board.arrows.values():
        source = board.nodes.get(arrow.de)
        target = board.nodes.get(arrow.a)
        if not source or not target:
            continue
        x1, y1, x2, y2 = _arrow_points(board, source, target)
        elements.append(
            base(arrow.id, INK, kind="arrow", x1=x1, y1=y1, x2=x2, y2=y2)
        )
        if arrow.label:
            elements.append(
                base(
                    f"al{arrow.id}",
                    INK,
                    kind="text",
                    x=(x1 + x2) / 2 - 40,
                    y=(y1 + y2) / 2 - 20,
                    text=arrow.label,
                )
            )

    return elements
