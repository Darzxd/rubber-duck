"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Whiteboard from "@/components/canvas/Whiteboard";
import AgentNode from "@/components/canvas/AgentNode";
import TranscriptOverlay from "@/components/debug/TranscriptOverlay";
import { useBoardEvents } from "@/lib/board";
import { useSession } from "@/lib/session";

const SESSION_ID = "demo";

function BoardInner() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name")?.trim() || "guest";

  const { supported, recording, interim, chunks, error } = useSession({
    sessionId: SESSION_ID,
    author: name,
  });
  const { nodes } = useBoardEvents(SESSION_ID);

  return (
    <>
      <Whiteboard sessionName="Roadmap sync">
        {nodes.map((node, i) => (
          <AgentNode key={node.id} node={node} index={i} />
        ))}
      </Whiteboard>
      <TranscriptOverlay
        recording={recording}
        supported={supported}
        interim={interim}
        chunks={chunks}
        error={error}
      />
    </>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={null}>
      <BoardInner />
    </Suspense>
  );
}
