"use client";

import { useCallback, useRef, useState } from "react";
import { useChannel } from "@portalsdk/react";
import { colorForAuthor, type Author } from "@/components/canvas/authors";

export type Cursor = { x: number; y: number };

const CURSOR = "cursor";
// A trackpad fires pointermove well past 120Hz. Nobody can see the difference
// above 30, and every extra send is a render on every other machine in the room.
const SEND_EVERY_MS = 33;
// Ephemeral messages are the fast lane. Presence metadata is the slow one: it is
// the only thing a late joiner can read before anybody moves the mouse again.
const METADATA_EVERY_MS = 250;

/** Somebody whose position we do not know yet, so there is nothing to draw. */
export const OFFSCREEN = -1;

type Metadata = { name?: string; cursor?: Cursor };

export function usePresence(sessionId: string, name: string) {
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const lastSend = useRef(0);
  const lastMetadata = useRef(0);

  const { send, setMetadata, presence, me } = useChannel<Cursor>({
    channelId: `board:${sessionId}`,
    metadata: { name },
    // Nobody scrolls back through mouse movements.
    history: "none",
    onMessage: (message) => {
      if (!message.ephemeral || message.type !== CURSOR) return;
      setCursors((all) => ({ ...all, [message.sender.id]: message.content }));
    },
  });

  const move = useCallback(
    (position: Cursor) => {
      const now = Date.now();
      if (now - lastSend.current < SEND_EVERY_MS) return;
      lastSend.current = now;

      void send({ ephemeral: true, type: CURSOR, content: position });

      if (now - lastMetadata.current < METADATA_EVERY_MS) return;
      lastMetadata.current = now;
      setMetadata({ name, cursor: position });
    },
    [name, send, setMetadata],
  );

  // Everyone in the room, me included — the avatar stack counts heads, and a
  // session where you cannot see yourself listed looks broken.
  const people: Author[] = [];
  if (presence?.kind === "detailed") {
    for (const participant of presence.participants) {
      const metadata = participant.metadata as Metadata | undefined;
      // A live message wins over metadata; metadata is what we knew before it.
      const at = cursors[participant.id] ?? metadata?.cursor;
      people.push({
        id: participant.id,
        name: metadata?.name?.trim() || "Alguien",
        color: colorForAuthor(participant.id),
        x: at?.x ?? OFFSCREEN,
        y: at?.y ?? OFFSCREEN,
      });
    }
  }

  return { people, move, myId: me?.id };
}
