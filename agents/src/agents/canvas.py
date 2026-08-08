"""Turns what the Architect decided into elements the board can draw.

The model says what groups with what and how things relate; every coordinate is
worked out here. Asking a model for pixels buys overlapping boxes and drift
between one revision and the next, and none of it is a judgement only a model
can make."""

from typing import Literal, TypedDict

Tone = Literal["amber", "blue", "green", "pink", "violet"]

# How each note looks. The tag is what gets printed on the flag, so it is
# written the way it will be read.
NOTE_STYLES: dict[str, tuple[str, Tone]] = {
    "decision": ("Decisión", "green"),
    "idea": ("Idea", "amber"),
    "tarea": ("Tarea", "blue"),
    "duda": ("Duda", "violet"),
    "riesgo": ("Riesgo", "pink"),
}

TONE_HEX: dict[Tone, str] = {
    "amber": "#f59e0b",
    "blue": "#3b82f6",
    "green": "#22c55e",
    "pink": "#ec4899",
    "violet": "#8b5cf6",
}

# Clear of the tool rail: the board opens with its first column readable
# instead of half under the tools.
ORIGIN_X = 210
ORIGIN_Y = 104
COLUMN_W = 200
COLUMN_GAP = 64
# The note box the front reserves. Changing it here alone would make arrows
# land off the sticky, so it has to match NOTE_SIZE in boardElements.ts.
NOTE_W = 160
NOTE_H = 110
# Wide enough that an arrow label fits between two notes without sitting on one.
NOTE_GAP = 48
GROUP_HEAD = 52
GROUP_PAD = 20
# Below this the board is not a diagram yet, so it does not get dressed as one.
# A title and a labelled frame around a single note make the board look like it
# understood something it did not.
DRESSED_FROM = 3
FRAME_GREY = "#d4d4d4"
INK = "#525252"


class PlannedNote(TypedDict):
    id: str
    text: str
    kind: str


class PlannedGroup(TypedDict):
    title: str
    notes: list[PlannedNote]


class PlannedArrow(TypedDict):
    source: str
    target: str
    label: str


def _base(element_id: str, color: str, **rest) -> dict:
    return {
        "id": element_id,
        "color": color,
        "width": 2,
        "opacity": 100,
        "dash": "solid",
        "radius": 8,
        "cap": "round",
        **rest,
    }


def _text(element_id: str, x: float, y: float, text: str, color=INK) -> dict:
    return _base(element_id, color, kind="text", x=x, y=y, text=text)


def build(
    title: str,
    groups: list[PlannedGroup],
    arrows: list[PlannedArrow],
) -> list[dict]:
    """Lays the plan out in columns and returns it as board elements.

    Ids are derived from the ids the Organizer minted, so the same idea keeps
    the same element across revisions and the board never rebuilds itself
    under someone who is reading it."""
    frames: list[dict] = []
    notes: list[dict] = []
    lines: list[dict] = []
    labels: list[dict] = []
    # Where each note ended up, so the arrows know what to point at.
    boxes: dict[str, tuple[float, float]] = {}
    column_of: dict[str, int] = {}

    dressed = sum(len(g["notes"]) for g in groups) >= DRESSED_FROM
    head_h = GROUP_HEAD if dressed else 0

    for index, group in enumerate(groups):
        if not group["notes"]:
            continue
        x = ORIGIN_X + index * (COLUMN_W + COLUMN_GAP)
        height = (
            head_h
            + len(group["notes"]) * (NOTE_H + NOTE_GAP)
            - NOTE_GAP
            + GROUP_PAD
        )
        if dressed:
            frames.append(
                _base(
                    f"f{index}",
                    FRAME_GREY,
                    kind="rect",
                    x=x,
                    y=ORIGIN_Y,
                    w=COLUMN_W,
                    h=height,
                    dash="dashed",
                    radius=20,
                )
            )
            if group["title"]:
                labels.append(
                    _text(f"ft{index}", x + GROUP_PAD, ORIGIN_Y + 12, group["title"])
                )

        for row, note in enumerate(group["notes"]):
            tag, tone = NOTE_STYLES[note["kind"]]
            nx = x + GROUP_PAD
            ny = ORIGIN_Y + head_h + row * (NOTE_H + NOTE_GAP)
            boxes[note["id"]] = (nx, ny)
            column_of[note["id"]] = index
            notes.append(
                _base(
                    f"n{note['id']}",
                    TONE_HEX[tone],
                    kind="note",
                    x=nx,
                    y=ny,
                    text=note["text"],
                    tag=tag,
                    tone=tone,
                )
            )

    for arrow in arrows:
        start = boxes.get(arrow["source"])
        end = boxes.get(arrow["target"])
        if start is None or end is None:
            continue
        # Down the column when both live in it, across when they do not: an
        # arrow that cuts through the notes in between reads as a mistake.
        down = column_of[arrow["source"]] == column_of[arrow["target"]]
        if down:
            x1, y1 = start[0] + NOTE_W / 2, start[1] + NOTE_H
            x2, y2 = end[0] + NOTE_W / 2, end[1]
        else:
            side = 0 if start[0] < end[0] else NOTE_W
            x1, y1 = start[0] + (NOTE_W - side), start[1] + NOTE_H / 2
            x2, y2 = end[0] + side, end[1] + NOTE_H / 2
        key = f"a{arrow['source']}{arrow['target']}"
        lines.append(
            _base(key, INK, kind="arrow", x1=x1, y1=y1, x2=x2, y2=y2)
        )
        if arrow["label"]:
            # Beside a vertical arrow, above a horizontal one: on top of the
            # line the label is unreadable and hides the note underneath.
            lx = x1 + 12 if down else (x1 + x2) / 2 - 40
            ly = (y1 + y2) / 2 - 14 if down else (y1 + y2) / 2 - 40
            labels.append(_text(f"al{key}", lx, ly, arrow["label"]))

    head = [_text("title", ORIGIN_X, 44, title)] if title and dressed else []
    # Order is the stacking order: frames behind, arrows over them, notes on
    # top of both, and anything written last of all.
    return head + frames + lines + notes + labels
