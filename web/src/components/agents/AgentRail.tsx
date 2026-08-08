"use client";

import type { ReactNode } from "react";

/** The right column every agent that writes prose shares. The canvas is not
 * theirs: whatever lands here is read, not drawn. */
export default function AgentRail({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed right-3 top-20 bottom-20 z-30 flex w-[19rem] flex-col gap-2">
      <div className="pointer-events-auto flex min-h-0 flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
