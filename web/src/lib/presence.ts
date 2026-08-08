"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChannel } from "@portalsdk/react";
import { colorForAuthor, type Author } from "@/components/canvas/authors";

export type Cursor = { x: number; y: number };

// Cursors ride on Portal's activity signal, encoded into its `kind` string.
// The obvious routes do not work in @portalsdk/core 0.1.5: incoming ephemeral
// messages are dropped before dispatch ("not modeled" in its own words), and a
// presence metadata change is never re-announced — PresenceTracker only applies
// joins and leaves. Activity is the one frame the SDK both sends over the
// socket and delivers on the other side.
const CURSOR = "c:";
// The SDK throttles activity to one send per 3s *per kind*, so every distinct
// position goes through. One decimal keeps repeats rare enough not to be eaten.
const SEND_EVERY_MS = 66;

/** Somebody whose position we do not know yet, so there is nothing to draw. */
export const OFFSCREEN = -1;

type Metadata = { name?: string };

function parse(kind: string): Cursor | undefined {
  if (!kind.startsWith(CURSOR)) return undefined;
  const [, x, y] = kind.split(":");
  const at = { x: Number(x), y: Number(y) };
  if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return undefined;
  return at;
}

export function usePresence(sessionId: string, name: string) {
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const lastSend = useRef(0);

  const { sendActivity, activity, presence, me } = useChannel({
    channelId: `board:${sessionId}`,
    metadata: { name },
    history: "none",
  });

  // Activity entries expire after 5s inside the SDK. Copying them out keeps a
  // cursor where its owner left it instead of having people blink out when they
  // stop moving.
  useEffect(() => {
    const latest: Record<string, { at: Cursor; since: number }> = {};
    for (const entry of activity ?? []) {
      const at = parse(entry.kind);
      if (!at) continue;
      const known = latest[entry.userId];
      if (!known || entry.since > known.since) {
        latest[entry.userId] = { at, since: entry.since };
      }
    }

    setCursors((current) => {
      let moved = false;
      const next = { ...current };
      for (const [id, { at }] of Object.entries(latest)) {
        const before = next[id];
        if (before && before.x === at.x && before.y === at.y) continue;
        next[id] = at;
        moved = true;
      }
      return moved ? next : current;
    });
  }, [activity]);

  const move = useCallback(
    (position: Cursor) => {
      const now = Date.now();
      if (now - lastSend.current < SEND_EVERY_MS) return;
      lastSend.current = now;
      sendActivity(
        `${CURSOR}${position.x.toFixed(1)}:${position.y.toFixed(1)}`,
      );
    },
    [sendActivity],
  );

  // Everyone in the room, me included — the avatar stack counts heads, and a
  // session where you cannot see yourself listed looks broken.
  const people: Author[] = [];
  if (presence?.kind === "detailed") {
    for (const participant of presence.participants) {
      const metadata = participant.metadata as Metadata | undefined;
      const at = cursors[participant.id];
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
