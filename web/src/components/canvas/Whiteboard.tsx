"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import ActionBar from "./ActionBar";
import BoardLayer from "./BoardLayer";
import CanvasSurface, { type CanvasApi } from "./CanvasSurface";
import ColorBar from "./ColorBar";
import PresenceCursor from "./PresenceCursor";
import SidePanel from "./SidePanel";
import ThemeSwitch from "./ThemeSwitch";
import ToolRail, { type ToolId } from "./ToolRail";
import TopBar from "./TopBar";
import ZoomBar from "./ZoomBar";
import { SAMPLE_AUTHORS, type Author } from "./authors";
import {
  NOTE_PRESETS,
  hitTest,
  newId,
  type BoardElement,
  type Point,
} from "./boardElements";
import { PanelRightIcon } from "./icons";
import { SAMPLE_AGENTS } from "./panelData";
import { useBoardElements } from "./useBoardElements";

type WhiteboardProps = {
  sessionName: string;
  authors?: Author[];
  onShare?: () => void;
  children?: ReactNode;
};

/** Tools that put ink on the board, and so bring the colour panel along. */
const DRAWING_TOOLS: ToolId[] = ["pen", "shapes", "circle", "arrow", "text"];
const NOTE_TOOLS: ToolId[] = ["idea", "decision", "task", "doubt"];

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
  authors = SAMPLE_AUTHORS,
  onShare,
  children,
}: WhiteboardProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("select");
  const [isDark, setIsDark] = useState(false);
  const [color, setColor] = useState("#111111");
  const [strokeSize, setStrokeSize] = useState(4);
  const opacity = 100;
  const [zoom, setZoom] = useState(100);
  const [resetSignal, setResetSignal] = useState(0);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [draft, setDraft] = useState<BoardElement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const board = useBoardElements();
  const canvasApi = useRef<CanvasApi | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const origin = useRef<Point>({ x: 0, y: 0 });
  const dragging = useRef<{ id: string; last: Point } | null>(null);

  const style = { color, width: strokeSize, opacity };

  function handleSelectTool(tool: ToolId) {
    setEditingId(null);
    if (tool === "image") {
      fileInput.current?.click();
      return;
    }
    setActiveTool(tool);
  }

  /** The bar edits the selection when there is one, otherwise the next stroke. */
  function handleColorChange(next: string) {
    setColor(next);
    if (board.selectedId) {
      board.checkpoint();
      board.patch(board.selectedId, { color: next });
    }
  }

  function handleStrokeSizeChange(next: number) {
    setStrokeSize(next);
    if (board.selectedId) {
      board.checkpoint();
      board.patch(board.selectedId, { width: next });
    }
  }

  function handleResetView() {
    setZoom(100);
    setResetSignal((signal) => signal + 1);
  }

  function handleDrawStart(point: Point) {
    setEditingId(null);
    origin.current = point;

    if (activeTool === "select") {
      // Topmost first: the last drawn element wins an overlap.
      const hit = [...board.elements].reverse().find((el) => hitTest(el, point));
      board.setSelectedId(hit?.id ?? null);
      if (hit) {
        board.checkpoint();
        dragging.current = { id: hit.id, last: point };
      }
      return;
    }

    // Text and notes are created on release: focusing an editor mid-click lets
    // the pointerup steal the focus straight back and close it again.
    if (NOTE_TOOLS.includes(activeTool) || activeTool === "text") return;

    if (activeTool === "pen") {
      setDraft({ kind: "path", id: newId(), points: [point], ...style });
      return;
    }

    if (activeTool === "shapes" || activeTool === "circle") {
      setDraft({
        kind: activeTool === "shapes" ? "rect" : "ellipse",
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

  function handleDrawMove(point: Point) {
    const drag = dragging.current;
    if (drag) {
      const dx = point.x - drag.last.x;
      const dy = point.y - drag.last.y;
      drag.last = point;
      board.moveBy(drag.id, dx, dy);
      return;
    }

    setDraft((current) => {
      if (!current) return current;
      if (current.kind === "path") {
        return { ...current, points: [...current.points, point] };
      }
      if (current.kind === "rect" || current.kind === "ellipse") {
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
    if (dragging.current) {
      dragging.current = null;
      return;
    }

    if (NOTE_TOOLS.includes(activeTool)) {
      const preset = NOTE_PRESETS[activeTool];
      const note: BoardElement = {
        kind: "note",
        id: newId(),
        x: origin.current.x,
        y: origin.current.y,
        text: "",
        tag: preset.tag,
        tone: preset.tone,
        ...style,
      };
      board.add(note);
      setEditingId(note.id);
      setActiveTool("select");
      return;
    }

    if (activeTool === "text") {
      const text: BoardElement = {
        kind: "text",
        id: newId(),
        x: origin.current.x,
        y: origin.current.y,
        text: "",
        ...style,
      };
      board.add(text);
      setEditingId(text.id);
      setActiveTool("select");
      return;
    }

    if (!draft) return;

    // A click with a shape tool is not a shape; drop anything with no size.
    if (draft.kind === "path" && draft.points.length < 2) {
      setDraft(null);
      return;
    }
    if (draft.kind === "rect" || draft.kind === "ellipse") {
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
      const far =
        Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 6;
      if (!far) {
        setDraft(null);
        return;
      }
    }

    board.add(draft);
    setDraft(null);
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

  // Delete and Escape act on the selection, the way every editor behaves.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.key === "Escape") {
        board.setSelectedId(null);
        setEditingId(null);
        return;
      }
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (!board.selectedId) return;
      event.preventDefault();
      board.remove(board.selectedId);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [board]);

  const selected = board.elements.find((el) => el.id === board.selectedId);
  // With something selected the bar shows that element's colour, so the marker
  // always sits on the chip the user is actually looking at.
  const selectedColor = selected?.color ?? color;
  const selectedWidth = selected?.width ?? strokeSize;
  const showColorBar =
    Boolean(board.selectedId) ||
    DRAWING_TOOLS.includes(activeTool) ||
    NOTE_TOOLS.includes(activeTool);

  const overlay = (
    <>
      <ToolRail
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
        onUndo={board.undo}
        onRedo={board.redo}
      />

      {/* Only offered where the panel can actually show: it is desktop-only. */}
      {showSidePanel ? null : (
        <button
          type="button"
          onClick={() => setShowSidePanel(true)}
          title="Mostrar panel de agentes"
          aria-label="Mostrar panel de agentes"
          className="pointer-events-auto absolute right-3 top-3 z-30 hidden size-9 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-600 shadow-lg shadow-neutral-900/5 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 lg:grid dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <PanelRightIcon />
        </button>
      )}

      {showColorBar ? (
        <ColorBar
          color={selectedColor}
          onColorChange={handleColorChange}
          strokeSize={selectedWidth}
          onStrokeSizeChange={handleStrokeSizeChange}
          editingSelection={Boolean(board.selectedId)}
        />
      ) : null}

      <ActionBar />

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
            onDrawStart={handleDrawStart}
            onDrawMove={handleDrawMove}
            onDrawEnd={handleDrawEnd}
            overlay={overlay}
          >
            {children}

            <BoardLayer
              elements={board.elements}
              draft={draft}
              selectedId={board.selectedId}
              editingId={editingId}
              onChangeText={(id, text) => board.patch(id, { text })}
              onFinishEditing={() => setEditingId(null)}
            />

            {authors.map((author) => (
              <PresenceCursor key={author.id} author={author} />
            ))}
          </CanvasSurface>

          {showSidePanel ? (
            <SidePanel onHide={() => setShowSidePanel(false)} />
          ) : null}
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
