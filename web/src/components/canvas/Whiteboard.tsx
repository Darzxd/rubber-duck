"use client";

import { useState, type ReactNode } from "react";
import ActionBar from "./ActionBar";
import ColorPanel from "./ColorPanel";
import PresenceCursor from "./PresenceCursor";
import SidePanel from "./SidePanel";
import ThemeSwitch from "./ThemeSwitch";
import ToolRail, { type ToolId } from "./ToolRail";
import TopBar from "./TopBar";
import ZoomBar from "./ZoomBar";
import { SAMPLE_AUTHORS, type Author } from "./authors";
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

  function handleSelectTool(tool: ToolId) {
    setActiveTool(tool);
    setShowColorPanel(DRAWING_TOOLS.includes(tool));
  }

  return (
    <div className={isDark ? "dark" : undefined}>
      <div className="flex h-dvh flex-col bg-neutral-100 p-2 sm:p-3 dark:bg-black">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-xl shadow-neutral-900/10 sm:rounded-3xl dark:border-neutral-800 dark:bg-neutral-900">
          <TopBar
            sessionName={sessionName}
            authors={authors}
            workingAgents={SAMPLE_AGENTS.length}
            onShare={onShare}
          />

          <div className="flex flex-1 overflow-hidden">
            <section
              aria-label={`Lienzo de ${sessionName}`}
              className="relative flex-1 overflow-hidden bg-neutral-50 dark:bg-neutral-950"
              style={{
                backgroundImage: `radial-gradient(circle, ${
                  isDark ? "#2b2b31" : "#d7d7de"
                } 1.1px, transparent 1.1px)`,
                backgroundSize: "22px 22px",
              }}
            >
              {children}

              {authors.map((author) => (
                <PresenceCursor key={author.id} author={author} />
              ))}

              <ToolRail
                activeTool={activeTool}
                onSelectTool={handleSelectTool}
              />

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
                onZoomIn={() =>
                  setZoom((value) => Math.min(MAX_ZOOM, value + ZOOM_STEP))
                }
                onZoomOut={() =>
                  setZoom((value) => Math.max(MIN_ZOOM, value - ZOOM_STEP))
                }
                isPanning={activeTool === "hand"}
                onTogglePan={() =>
                  handleSelectTool(activeTool === "hand" ? "select" : "hand")
                }
              />
            </section>

            <SidePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
