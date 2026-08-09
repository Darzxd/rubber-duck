"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import BoardLayer, { type CellRef } from "./BoardLayer";
import CanvasSurface, { type CanvasApi } from "./CanvasSurface";
import StyleBar from "./StyleBar";
import ThemeSwitch from "./ThemeSwitch";
import ToolRail, { type ShapeKind, type ToolId } from "./ToolRail";
import TopBar from "./TopBar";
import ZoomBar from "./ZoomBar";
import type { Author } from "./authors";
import {
  NOTE_PRESETS,
  PEN_NIBS,
  TABLE_DEFAULTS,
  cellAt,
  emptyCells,
  hitTest,
  newId,
  newPoll,
  type BoardElement,
  type PenNib,
  type Point,
  type StrokeStyle,
} from "./boardElements";
import { SAMPLE_AGENTS } from "./panelData";
import { useBoardElements } from "./useBoardElements";

type WhiteboardProps = {
  sessionName: string;
  authors?: Author[];
  onShare?: () => void;
  children?: ReactNode;
};

/** Tools that put ink on the board, and so bring the colour bar along. */
const DRAWING_TOOLS: ToolId[] = ["pen", "shape", "arrow", "text"];
const NOTE_TOOLS: ToolId[] = ["idea", "decision", "task", "doubt"];
/** Tools that drop a fixed-size thing where you click, instead of dragging. */
const STAMP_TOOLS: ToolId[] = [...NOTE_TOOLS, "text", "table", "poll"];

const ZOOM_STEP = 10;
const MIN_ZOOM = 30;
const MAX_ZOOM = 300;
const IMAGE_WIDTH = 260;

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/** Drag boxes can be pulled up or left, so width and height may come out negative. */
function normalise(box: { x: number; y: number; w: number; h: number }) {
  return {
    x: box.w < 0 ? box.x + box.w : box.x,
    y: box.h < 0 ? box.y + box.h : box.y,
    w: Math.abs(box.w),
    h: Math.abs(box.h),
  };
}

export default function Whiteboard({
  sessionName,
  // Empty until the session layer passes real participants.
  authors = [],
  onShare,
  children,
}: WhiteboardProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("select");
  const [isDark, setIsDark] = useState(false);
  const [color, setColor] = useState("#111111");
  const [strokeSize, setStrokeSize] = useState(4);
  const [dash, setDash] = useState<StrokeStyle>("solid");
  const [radius, setRadius] = useState(8);
  const [opacity, setOpacity] = useState(100);
  const [shapeKind, setShapeKind] = useState<ShapeKind>("rect");
  const [penNib, setPenNib] = useState<PenNib>("fine");
  const [cap, setCap] = useState<"round" | "butt">("round");
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [resetSignal, setResetSignal] = useState(0);
  const [draft, setDraft] = useState<BoardElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<CellRef | null>(null);

  const board = useBoardElements();
  const canvasApi = useRef<CanvasApi | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const dragging = useRef<{ ids: string[]; last: Point } | null>(null);
  /** Cell to open on release: focusing it now lets pointerup steal the focus. */
  const pendingCell = useRef<CellRef | null>(null);

  const style = { color, width: strokeSize, opacity, dash, radius, cap };

  /** A nib is a preset: it just moves the same width/opacity/cap knobs. */
  function handlePenNibChange(nib: PenNib) {
    const preset = PEN_NIBS[nib];
    setPenNib(nib);
    setStrokeSize(preset.width);
    setOpacity(preset.opacity);
    setCap(preset.cap);
    applyToSelection({
      width: preset.width,
      opacity: preset.opacity,
      cap: preset.cap,
    });
  }

  function stopEditing() {
    // A text box left empty is invisible but still selectable, so it would
    // become clutter nobody can see. Drop it instead of keeping a ghost.
    if (editingId) {
      const edited = board.elements.find((el) => el.id === editingId);
      if (edited?.kind === "text" && edited.text.trim() === "") {
        board.discard(editingId);
      }
    }
    setEditingId(null);
    setEditingCell(null);
  }

  function handleSelectTool(tool: ToolId) {
    stopEditing();
    if (tool === "image") {
      fileInput.current?.click();
      return;
    }
    setActiveTool(tool);
  }

  function handleResetView() {
    setZoom(100);
    setResetSignal((signal) => signal + 1);
  }

  /** The bar edits the selection when there is one, otherwise the next stroke. */
  function handleColorChange(next: string) {
    setColor(next);
    applyToSelection({ color: next });
  }

  function handleStrokeSizeChange(next: number) {
    setStrokeSize(next);
    applyToSelection({ width: next });
  }

  /** Every style control does the same thing: remember it, and repaint any selection. */
  function applyToSelection(next: Partial<BoardElement>) {
    if (board.selectedIds.length === 0) return;
    board.checkpoint();
    board.patch(board.selectedIds, next);
  }

  function handleDashChange(next: StrokeStyle) {
    setDash(next);
    applyToSelection({ dash: next });
  }

  function handleRadiusChange(next: number) {
    setRadius(next);
    applyToSelection({ radius: next });
  }

  function handleOpacityChange(next: number) {
    setOpacity(next);
    applyToSelection({ opacity: next });
  }

  function handleDrawStart(point: Point, event: React.PointerEvent) {
    stopEditing();
    // Touching the board is the natural way to dismiss the palette.
    setPaletteOpen(false);
    origin.current = point;

    if (activeTool !== "select") return;

    // Topmost first: the last drawn element wins an overlap.
    const hit = [...board.elements].reverse().find((el) => hitTest(el, point));
    if (!hit) {
      board.setSelectedIds([]);
      return;
    }

    // A second click on an already-selected table goes into the cell.
    if (hit.kind === "table" && board.selectedIds.includes(hit.id)) {
      const cell = cellAt(hit, point);
      if (cell) {
        pendingCell.current = { id: hit.id, ...cell };
        return;
      }
    }

    const already = board.selectedIds.includes(hit.id);
    const ids = event.shiftKey
      ? already
        ? board.selectedIds.filter((id) => id !== hit.id)
        : [...board.selectedIds, hit.id]
      : already
        ? board.selectedIds
        : [hit.id];

    board.setSelectedIds(ids);
    if (ids.length > 0) {
      board.checkpoint();
      dragging.current = { ids, last: point };
    }
  }

  function handleDrawMove(point: Point) {
    const drag = dragging.current;
    if (drag) {
      board.moveBy(drag.ids, point.x - drag.last.x, point.y - drag.last.y);
      drag.last = point;
      return;
    }

    setDraft((current) => {
      if (!current) return current;
      if (current.kind === "path") {
        return { ...current, points: [...current.points, point] };
      }
      if (
        current.kind === "rect" ||
        current.kind === "ellipse" ||
        current.kind === "triangle"
      ) {
        return {
          ...current,
          w: point.x - origin.current.x,
          h: point.y - origin.current.y,
        };
      }
      if (current.kind === "arrow") {
        return { ...current, x2: point.x, y2: point.y };
      }
      return current;
    });
  }

  function handleDrawEnd() {
    if (pendingCell.current) {
      setEditingCell(pendingCell.current);
      pendingCell.current = null;
      return;
    }

    if (dragging.current) {
      dragging.current = null;
      return;
    }

    // Stamps are created on release: focusing an editor mid-click lets the
    // pointerup steal the focus straight back and close it again.
    if (STAMP_TOOLS.includes(activeTool)) {
      const at = origin.current;

      if (activeTool === "table") {
        const table: BoardElement = {
          kind: "table",
          id: newId(),
          x: at.x,
          y: at.y,
          cells: emptyCells(TABLE_DEFAULTS.rows, TABLE_DEFAULTS.cols),
          cellW: TABLE_DEFAULTS.cellW,
          cellH: TABLE_DEFAULTS.cellH,
          ...style,
        };
        board.add(table);
        board.setSelectedIds([table.id]);
        setActiveTool("select");
        return;
      }

      if (activeTool === "poll") {
        const poll: BoardElement = {
          kind: "poll",
          id: newId(),
          x: at.x,
          y: at.y,
          ...newPoll(),
          ...style,
        };
        board.add(poll);
        // Selected means editable, so it opens ready to type the question.
        board.setSelectedIds([poll.id]);
        setActiveTool("select");
        return;
      }

      const shared = { id: newId(), x: at.x, y: at.y, text: "", ...style };
      const element: BoardElement =
        activeTool === "text"
          ? { kind: "text", ...shared }
          : { kind: "note", ...shared, ...NOTE_PRESETS[activeTool] };

      board.add(element);
      setEditingId(element.id);
      setActiveTool("select");
      return;
    }

    if (!draft) return;

    // A click with a shape tool is not a shape; drop anything with no size.
    if (draft.kind === "path" && draft.points.length < 2) {
      setDraft(null);
      return;
    }
    if (draft.kind === "rect" || draft.kind === "ellipse" || draft.kind === "triangle") {
      const box = normalise(draft);
      if (box.w < 4 || box.h < 4) {
        setDraft(null);
        return;
      }
      board.add({ ...draft, ...box });
      setDraft(null);
      return;
    }
    if (draft.kind === "arrow") {
      if (Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) <= 6) {
        setDraft(null);
        return;
      }
    }

    board.add(draft);
    setDraft(null);
  }

  function handleDrawStartWrapper(point: Point, event: React.PointerEvent) {
    handleDrawStart(point, event);
    if (activeTool === "pen") {
      setDraft({ kind: "path", id: newId(), points: [point], ...style });
      return;
    }
    if (activeTool === "shape") {
      setDraft({
        kind: shapeKind,
        id: newId(),
        x: point.x,
        y: point.y,
        w: 0,
        h: 0,
        ...style,
      });
      return;
    }
    if (activeTool === "arrow") {
      setDraft({
        kind: "arrow",
        id: newId(),
        x1: point.x,
        y1: point.y,
        x2: point.x,
        y2: point.y,
        ...style,
      });
    }
  }

  function handleChangeCell(ref: CellRef, value: string) {
    const table = board.elements.find((el) => el.id === ref.id);
    if (table?.kind !== "table") return;
    board.replace(ref.id, {
      ...table,
      cells: table.cells.map((row, r) =>
        r === ref.row ? row.map((cell, c) => (c === ref.col ? value : cell)) : row,
      ),
    });
  }

  function handleAddRow(id: string) {
    const table = board.elements.find((el) => el.id === id);
    if (table?.kind !== "table") return;
    board.checkpoint();
    const cols = table.cells[0]?.length ?? 0;
    board.replace(id, {
      ...table,
      cells: [...table.cells, Array.from({ length: cols }, () => "")],
    });
  }

  function handleAddColumn(id: string) {
    const table = board.elements.find((el) => el.id === id);
    if (table?.kind !== "table") return;
    board.checkpoint();
    board.replace(id, {
      ...table,
      cells: table.cells.map((row) => [...row, ""]),
    });
  }

  /** Reads the poll, applies a change to it, and writes it back. */
  function editPoll(
    id: string,
    change: (poll: Extract<BoardElement, { kind: "poll" }>) => BoardElement,
    checkpoint = false,
  ) {
    const poll = board.elements.find((el) => el.id === id);
    if (poll?.kind !== "poll") return;
    if (checkpoint) board.checkpoint();
    board.replace(id, change(poll));
  }

  function handleVote(id: string, option: number) {
    editPoll(
      id,
      (poll) => ({
        ...poll,
        options: poll.options.map((entry, index) =>
          index === option ? { ...entry, votes: entry.votes + 1 } : entry,
        ),
      }),
      true,
    );
  }

  function handleChangeQuestion(id: string, question: string) {
    editPoll(id, (poll) => ({ ...poll, question }));
  }

  function handleChangeOption(id: string, option: number, label: string) {
    editPoll(id, (poll) => ({
      ...poll,
      options: poll.options.map((entry, index) =>
        index === option ? { ...entry, label } : entry,
      ),
    }));
  }

  function handleAddOption(id: string) {
    editPoll(
      id,
      (poll) => ({
        ...poll,
        options: [...poll.options, { label: "", votes: 0 }],
      }),
      true,
    );
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const spot = canvasApi.current?.center() ?? { x: 0, y: 0 };
        const height = (image.height / image.width) * IMAGE_WIDTH;
        board.add({
          kind: "image",
          id: newId(),
          x: spot.x - IMAGE_WIDTH / 2,
          y: spot.y - height / 2,
          w: IMAGE_WIDTH,
          h: height,
          src: String(reader.result),
          ...style,
        });
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  // Keyboard shortcuts act on the selection, the way every editor behaves.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Escape is the way out of an editor, so it works even while typing.
      if (event.key === "Escape") {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setPaletteOpen(false);
        board.setSelectedIds([]);
        setEditingId(null);
        setEditingCell(null);
        return;
      }

      if (isTypingTarget(event.target)) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault();
        board.selectAll();
        return;
      }
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (board.selectedIds.length === 0) return;
      event.preventDefault();
      board.remove(board.selectedIds);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [board]);

  const selected = board.elements.find((el) =>
    board.selectedIds.includes(el.id),
  );
  // With something selected the bar reflects that element, so every marker sits
  // on the option the user is actually looking at.
  const live = {
    color: selected?.color ?? color,
    width: selected?.width ?? strokeSize,
    dash: selected?.dash ?? dash,
    radius: selected?.radius ?? radius,
    opacity: selected?.opacity ?? opacity,
  };
  // Also for the stamps, so a colour can be chosen before dropping one.
  const showStyleBar =
    board.selectedIds.length > 0 ||
    DRAWING_TOOLS.includes(activeTool) ||
    STAMP_TOOLS.includes(activeTool);

  const overlay = (
    <>
      <ToolRail
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        shapeKind={shapeKind}
        onShapeKindChange={setShapeKind}
        penNib={penNib}
        onPenNibChange={handlePenNibChange}
        onUndo={board.undo}
        onRedo={board.redo}
      />

      {showStyleBar ? (
        <StyleBar
          color={live.color}
          onColorChange={handleColorChange}
          width={live.width}
          onWidthChange={handleStrokeSizeChange}
          dash={live.dash}
          onDashChange={handleDashChange}
          radius={live.radius}
          onRadiusChange={handleRadiusChange}
          opacity={live.opacity}
          onOpacityChange={handleOpacityChange}
          editingSelection={board.selectedIds.length > 0}
          isPaletteOpen={isPaletteOpen}
          onTogglePalette={setPaletteOpen}
        />
      ) : null}

      <ThemeSwitch isDark={isDark} onToggle={() => setIsDark((d) => !d)} />

      <ZoomBar
        zoom={zoom}
        onZoomIn={() => setZoom((v) => Math.min(MAX_ZOOM, v + ZOOM_STEP))}
        onZoomOut={() => setZoom((v) => Math.max(MIN_ZOOM, v - ZOOM_STEP))}
        isPanning={activeTool === "hand"}
        onTogglePan={() =>
          handleSelectTool(activeTool === "hand" ? "select" : "hand")
        }
        onResetView={handleResetView}
      />
    </>
  );

  return (
    <div className={isDark ? "dark" : undefined}>
      <div className="flex h-dvh flex-col overflow-hidden bg-white dark:bg-neutral-900">
        <TopBar
          sessionName={sessionName}
          authors={authors}
          workingAgents={SAMPLE_AGENTS.length}
          onShare={onShare}
        />

        <div className="flex flex-1 overflow-hidden">
          <CanvasSurface
            isDark={isDark}
            zoom={zoom}
            apiRef={canvasApi}
            forcePan={activeTool === "hand"}
            canDraw={activeTool !== "select" && activeTool !== "hand"}
            resetSignal={resetSignal}
            onDrawStart={handleDrawStartWrapper}
            onDrawMove={handleDrawMove}
            onDrawEnd={handleDrawEnd}
            overlay={overlay}
          >
            {children}

            <BoardLayer
              elements={board.elements}
              draft={draft}
              selectedIds={board.selectedIds}
              editingId={editingId}
              editingCell={editingCell}
              onChangeText={(id, text) => board.patch([id], { text })}
              onChangeCell={handleChangeCell}
              onFinishEditing={stopEditing}
              onAddRow={handleAddRow}
              onAddColumn={handleAddColumn}
              onVote={handleVote}
              onChangeQuestion={handleChangeQuestion}
              onChangeOption={handleChangeOption}
              onAddOption={handleAddOption}
            />
          </CanvasSurface>
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
