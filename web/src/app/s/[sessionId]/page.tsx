"use client";

import { Suspense, use, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BoardGraph from "@/components/canvas/BoardGraph";
import Whiteboard from "@/components/canvas/Whiteboard";
import TranscriptOverlay from "@/components/debug/TranscriptOverlay";
import JoinScreen from "@/components/session/JoinScreen";
import ShareModal from "@/components/session/ShareModal";
import { useBoardEvents } from "@/lib/board";
import { useSession } from "@/lib/session";

type PageProps = {
  params: Promise<{ sessionId: string }>;
};

function InvitedJoin({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
          Te invitaron a
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Pizarra {sessionId}
        </h1>
        <JoinScreen
          onJoin={(name) => {
            const q = new URLSearchParams({ name });
            router.replace(`/s/${sessionId}?${q.toString()}`);
          }}
        />
      </div>
    </main>
  );
}

function BoardView({
  sessionId,
  name,
  showShareModal,
  onOpenShareModal,
  onCloseShareModal,
}: {
  sessionId: string;
  name: string;
  showShareModal: boolean;
  onOpenShareModal: () => void;
  onCloseShareModal: () => void;
}) {
  const { supported, recording, interim, chunks, error } = useSession({
    sessionId,
    author: name,
  });
  const board = useBoardEvents(sessionId);

  return (
    <>
      <Whiteboard
        sessionName={`Pizarra ${sessionId}`}
        onShare={onOpenShareModal}
      >
        <BoardGraph board={board} />
      </Whiteboard>
      <TranscriptOverlay
        recording={recording}
        supported={supported}
        interim={interim}
        chunks={chunks}
        error={error}
      />
      {showShareModal && (
        <ShareModal sessionId={sessionId} onClose={onCloseShareModal} />
      )}
    </>
  );
}

function SessionInner({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = searchParams.get("name")?.trim() || "";
  const isNew = searchParams.get("new") === "1";
  const [showShareModal, setShowShareModal] = useState(isNew);

  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
    // Strip `new=1` from URL so a refresh does not re-open the modal.
    const q = new URLSearchParams({ name });
    router.replace(`/s/${sessionId}?${q.toString()}`);
  }, [name, router, sessionId]);

  if (!name) {
    return <InvitedJoin sessionId={sessionId} />;
  }

  return (
    <BoardView
      sessionId={sessionId}
      name={name}
      showShareModal={showShareModal}
      onOpenShareModal={() => setShowShareModal(true)}
      onCloseShareModal={closeShareModal}
    />
  );
}

export default function SessionPage({ params }: PageProps) {
  const { sessionId } = use(params);
  return (
    <Suspense fallback={null}>
      <SessionInner sessionId={sessionId} />
    </Suspense>
  );
}
