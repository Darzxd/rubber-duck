"use client";

import { useState, type ReactNode } from "react";
import ActionBar from "./ActionBar";
import CanvasSurface from "./CanvasSurface";
import ColorPanel from "./ColorPanel";
import PresenceCursor from "./PresenceCursor";
import SidePanel from "./SidePanel";
import ThemeSwitch from "./ThemeSwitch";
import ToolRail, { type ToolId } from "./ToolRail";
import TopBar from "./TopBar";
import ZoomBar from "./ZoomBar";
import { SAMPLE_AUTHORS, type Author } from "./authors";
import { PanelRightIcon } from "./icons";
import { SAMPLE_AGENTS } from "./panelData";

type WhiteboardProps = {
  sessionName: string;
  authors?: Author[];
  onShare?: () => void;
  children?: ReactNode;
};

/** Tools that draw something, and so bring the colour panel along. */
const DRAWING_TOOLS: ToolId[] = ["pen", "shapes", "circle", "text", "arrow"];

const ZOOM_STEP = 10;
const MIN_ZOOM = 30;
const MAX_ZOOM = 300;

export default function Whiteboard({
  sessionName,
  authors = SAMPLE_AUTHORS,
  onShare,
  children,
}: WhiteboardProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("select");
  const [isDark, setIsDark] = useState(false);
  const [showColorPanel, setShowColorPanel] = useState(false);
  const [color, setColor] = useState("#ff4d4d");
  const [strokeSize, setStrokeSize] = useState(4);
  const [opacity, setOpacity] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [resetSignal, setResetSignal] = useState(0);
  const [showSidePanel, setShowSidePanel] = useState(true);

  function handleSelectTool(tool: ToolId) {
    setActiveTool(tool);
    setShowColorPanel(DRAWING_TOOLS.includes(tool));
  }

  function handleResetView() {
    setZoom(100);
    setResetSignal((signal) => signal + 1);
  }

  const overlay = (
    <>
      <ToolRail activeTool={activeTool} onSelectTool={handleSelectTool} />

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

      {showColorPanel ? (
        <ColorPanel
          color={color}
          onColorChange={setColor}
          strokeSize={strokeSize}
          onStrokeSizeChange={setStrokeSize}
          opacity={opacity}
          onOpacityChange={setOpacity}
          onClose={() => setShowColorPanel(false)}
        />
      ) : null}

      <ActionBar />

      <ThemeSwitch
        isDark={isDark}
        onToggle={() => setIsDark((dark) => !dark)}
      />

      <ZoomBar
        zoom={zoom}
        onZoomIn={() => setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
        onZoomOut={() => setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
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
      {/* Full bleed: the board is the app, not a card floating inside it. */}
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
            forcePan={activeTool === "hand"}
            resetSignal={resetSignal}
            overlay={overlay}
          >
            {children}

            {authors.map((author) => (
              <PresenceCursor key={author.id} author={author} />
            ))}
          </CanvasSurface>

          {showSidePanel ? (
            <SidePanel onHide={() => setShowSidePanel(false)} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
