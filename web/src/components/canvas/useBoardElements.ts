"use client";

import { useCallback, useRef, useState } from "react";
import { useBoardSync, type BoardOp } from "@/lib/boardSync";
import { moveElement, type BoardElement } from "./boardElements";

/** How many steps back the undo button can walk. */
const HISTORY_LIMIT = 50;
// A drag fires on every pointer move. Since each message carries the element in
// full, only the last one in a burst matters — the rest are coalesced away.
const PUBLISH_EVERY_MS = 150;

export function useBoardElements(sessionId: string) {
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /**
   * A mirror of the state. Every operation reads and writes it directly, so no
   * history bookkeeping ever happens inside a state updater — React runs those
   * twice in development to catch impurity, which corrupted the undo stack.
   */
  const current = useRef<BoardElement[]>([]);
  const past = useRef<BoardElement[][]>([]);
  const future = useRef<BoardElement[][]>([]);

  const commit = useCallback((next: BoardElement[]) => {
    current.current = next;
    setElements(next);
  }, []);

  /** Snapshot the board before a change that undo should reverse. */
  const checkpoint = useCallback(() => {
    past.current = [...past.current.slice(-HISTORY_LIMIT + 1), current.current];
    future.current = [];
  }, []);

  /** A teammate's change lands straight on the board: it is not this browser's
   * doing, so undo must not be able to walk back over it. */
  const applyRemote = useCallback(
    (op: BoardOp) => {
      if (op.k === "d") {
        const gone = new Set(op.ids);
        commit(current.current.filter((element) => !gone.has(element.id)));
        setSelectedIds((selected) => selected.filter((id) => !gone.has(id)));
        return;
      }
      const incoming = new Map(op.els.map((element) => [element.id, element]));
      const merged = current.current.map(
        (element) => incoming.get(element.id) ?? element,
      );
      const known = new Set(current.current.map((element) => element.id));
      for (const element of op.els) {
        if (!known.has(element.id)) merged.push(element);
      }
      commit(merged);
    },
    [commit],
  );

  const publish = useBoardSync(sessionId, applyRemote);

  const pending = useRef(new Set<string>());
  const flush = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Coalesces a drag into one message per tick, carrying whatever the element
   * looks like when the tick fires. */
  const publishSoon = useCallback(
    (ids: string[]) => {
      for (const id of ids) pending.current.add(id);
      if (flush.current) return;
      flush.current = setTimeout(() => {
        flush.current = null;
        const changed = pending.current;
        pending.current = new Set();
        publish({
          k: "u",
          els: current.current.filter((element) => changed.has(element.id)),
        });
      }, PUBLISH_EVERY_MS);
    },
    [publish],
  );

  const add = useCallback(
    (element: BoardElement) => {
      checkpoint();
      commit([...current.current, element]);
      publish({ k: "u", els: [element] });
    },
    [checkpoint, commit, publish],
  );

  /** Live edits: no checkpoint, the gesture that started it already made one. */
  const patch = useCallback(
    (ids: string[], next: Partial<BoardElement>) => {
      commit(
        current.current.map((element) =>
          ids.includes(element.id)
            ? ({ ...element, ...next } as BoardElement)
            : element,
        ),
      );
      publishSoon(ids);
    },
    [commit, publishSoon],
  );

  const replace = useCallback(
    (id: string, next: BoardElement) => {
      commit(
        current.current.map((element) => (element.id === id ? next : element)),
      );
      publish({ k: "u", els: [next] });
    },
    [commit, publish],
  );

  const moveBy = useCallback(
    (ids: string[], dx: number, dy: number) => {
      commit(
        current.current.map((element) =>
          ids.includes(element.id) ? moveElement(element, dx, dy) : element,
        ),
      );
      publishSoon(ids);
    },
    [commit, publishSoon],
  );

  const remove = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      checkpoint();
      commit(current.current.filter((element) => !ids.includes(element.id)));
      setSelectedIds([]);
      publish({ k: "d", ids });
    },
    [checkpoint, commit, publish],
  );

  /** Drops an element without touching history — for undoing a no-op creation. */
  const discard = useCallback(
    (id: string) => {
      commit(current.current.filter((element) => element.id !== id));
      setSelectedIds((selected) => selected.filter((entry) => entry !== id));
      publish({ k: "d", ids: [id] });
    },
    [commit, publish],
  );

  const selectAll = useCallback(() => {
    setSelectedIds(current.current.map((element) => element.id));
  }, []);

  /** Undo has to reach the other boards too, or a stroke walked back here stays
   * on theirs. History holds whole snapshots, so the two are diffed. */
  const publishSwap = useCallback(
    (before: BoardElement[], after: BoardElement[]) => {
      const now = new Map(after.map((element) => [element.id, element]));
      const gone = before
        .filter((element) => !now.has(element.id))
        .map((element) => element.id);
      publish({ k: "d", ids: gone });
      const was = new Map(before.map((element) => [element.id, element]));
      publish({
        k: "u",
        els: after.filter((element) => was.get(element.id) !== element),
      });
    },
    [publish],
  );

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (previous === undefined) return;
    future.current = [...future.current, current.current];
    publishSwap(current.current, previous);
    commit(previous);
    setSelectedIds([]);
  }, [commit, publishSwap]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current = [...past.current, current.current];
    publishSwap(current.current, next);
    commit(next);
    setSelectedIds([]);
  }, [commit, publishSwap]);

  return {
    elements,
    selectedIds,
    setSelectedIds,
    selectAll,
    checkpoint,
    add,
    patch,
    replace,
    moveBy,
    remove,
    discard,
    undo,
    redo,
  };
}
