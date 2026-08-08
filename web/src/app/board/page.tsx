"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Whiteboard from "@/components/canvas/Whiteboard";
import TranscriptOverlay from "@/components/debug/TranscriptOverlay";
import { useSession } from "@/lib/session";

const SESSION_ID = "demo";

function BoardInner() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name")?.trim() || "guest";

  const { supported, recording, interim, chunks, error } = useSession({
    sessionId: SESSION_ID,
    author: name,
  });

  return (
    <>
      <Whiteboard sessionName="Roadmap sync" />
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
