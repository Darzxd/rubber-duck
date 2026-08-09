"use client";

import { Suspense, use, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalProvider } from "@portalsdk/react";
import AgentRail from "@/components/agents/AgentRail";
import BriefCard from "@/components/agents/BriefCard";
import CriticPanel from "@/components/agents/CriticPanel";
import NotetakerPanel from "@/components/agents/NotetakerPanel";
import RepoCard from "@/components/agents/RepoCard";
import ArchitectBoard from "@/components/agents/ArchitectBoard";
import Whiteboard from "@/components/canvas/Whiteboard";
import type { Author } from "@/components/canvas/authors";
import TranscriptOverlay from "@/components/debug/TranscriptOverlay";
import EndSessionDialog from "@/components/session/EndSessionDialog";
import JoinScreen from "@/components/session/JoinScreen";
import PresenceLayer from "@/components/session/PresenceLayer";
import SessionClosed from "@/components/session/SessionClosed";
import ShareModal from "@/components/session/ShareModal";
import { postBrief } from "@/lib/agents";
import { useSessionStream } from "@/lib/board";
import { portal } from "@/lib/portal";
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
  isNew,
  isHost,
  ended,
  onEndSession,
  showShareModal,
  onOpenShareModal,
  onCloseShareModal,
}: {
  sessionId: string;
  name: string;
  isNew: boolean;
  isHost: boolean;
  ended: boolean;
  onEndSession: () => void;
  showShareModal: boolean;
  onOpenShareModal: () => void;
  onCloseShareModal: () => void;
}) {
  const { supported, recording, interim, chunks, error } = useSession({
    sessionId,
    author: name,
    enabled: !ended,
  });
  const { board, notes, brief, repo, criticNotes } =
    useSessionStream(sessionId);
  const [people, setPeople] = useState<Author[]>([]);

  return (
    <>
      <Whiteboard
        sessionName={`Pizarra ${sessionId}`}
        authors={people}
        onShare={onOpenShareModal}
        canEnd={isHost && !ended}
        onEndSession={onEndSession}
      >
        <ArchitectBoard board={board} />
      </Whiteboard>
      <AgentRail>
        <BriefCard
          brief={brief}
          startOpen={isNew}
          onSave={(text) => {
            void postBrief(sessionId, text);
          }}
        />
        <RepoCard sessionId={sessionId} repo={repo} />
        <CriticPanel notes={criticNotes} />
        <NotetakerPanel notes={notes} />
      </AgentRail>
      <PresenceLayer sessionId={sessionId} name={name} onRoster={setPeople} />
      <TranscriptOverlay
        recording={recording}
        supported={supported}
        interim={interim}
        chunks={chunks}
        error={error}
      />
      {ended && <SessionClosed />}
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
  const [isHost, setIsHost] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [ended, setEnded] = useState(false);

  // `new=1` is stripped from the URL as soon as the share modal closes, so who
  // opened the session is remembered here instead. Without a database this is
  // the whole record of it: another browser, or this one cleared, is a guest.
  useEffect(() => {
    const key = `liveboard:host:${sessionId}`;
    if (isNew) window.localStorage.setItem(key, "1");
    setIsHost(window.localStorage.getItem(key) === "1");
  }, [isNew, sessionId]);

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
    <>
      <BoardView
        sessionId={sessionId}
        name={name}
        isNew={isNew}
        isHost={isHost}
        ended={ended}
        onEndSession={() => setConfirmingEnd(true)}
        showShareModal={showShareModal}
        onOpenShareModal={() => setShowShareModal(true)}
        onCloseShareModal={closeShareModal}
      />
      {confirmingEnd && (
        <EndSessionDialog
          onCancel={() => setConfirmingEnd(false)}
          onConfirm={() => {
            setConfirmingEnd(false);
            setEnded(true);
          }}
        />
      )}
    </>
  );
}

export default function SessionPage({ params }: PageProps) {
  const { sessionId } = use(params);
  return (
    <PortalProvider client={portal}>
      <Suspense fallback={null}>
        <SessionInner sessionId={sessionId} />
      </Suspense>
    </PortalProvider>
  );
}
