"use client";

import { useState, type ReactNode } from "react";
import LiveBadge from "./LiveBadge";
import PresenceCursor from "./PresenceCursor";
import Toolbar, { type ToolId } from "./Toolbar";
import { SAMPLE_AUTHORS, type Author } from "./authors";

type WhiteboardProps = {
  sessionName: string;
  authors?: Author[];
  children?: ReactNode;
};

const DOT_SIZE = "22px 22px";

export default function Whiteboard({
  sessionName,
  authors = SAMPLE_AUTHORS,
  children,
}: WhiteboardProps) {
  const [activeTool, setActiveTool] = useState<ToolId>("select");
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={isDark ? "dark" : undefined}>
      <div className="flex min-h-dvh flex-col bg-neutral-50 p-3 sm:p-5 dark:bg-black">
        <section
          aria-label={`Board for ${sessionName}`}
          className="relative flex-1 overflow-hidden rounded-[1.75rem] border-[5px] border-neutral-900 bg-white sm:rounded-[2.25rem] sm:border-[6px] dark:border-neutral-800 dark:bg-neutral-950"
          style={{
            backgroundImage: `radial-gradient(circle, ${
              isDark ? "#2f2f35" : "#d7d7dc"
            } 1.2px, transparent 1.2px)`,
            backgroundSize: DOT_SIZE,
          }}
        >
          <p className="pointer-events-none absolute left-6 top-5 z-20 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-neutral-400 sm:left-24 sm:top-6 dark:text-neutral-600">
            {sessionName}
          </p>

          <LiveBadge />

          {children}

          {authors.map((author) => (
            <PresenceCursor key={author.id} author={author} />
          ))}

          <Toolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            isDark={isDark}
            onToggleTheme={() => setIsDark((dark) => !dark)}
          />
        </section>
      </div>
    </div>
  );
}
