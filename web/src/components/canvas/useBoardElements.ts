"use client";

import { useCallback, useRef, useState } from "react";
import { moveElement, type BoardElement } from "./boardElements";

/** How many steps back the undo button can walk. */
const HISTORY_LIMIT = 50;

export function useBoardElements() {
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

  const add = useCallback(
    (element: BoardElement) => {
      checkpoint();
      commit([...current.current, element]);
    },
    [checkpoint, commit],
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
    },
    [commit],
  );

  const replace = useCallback(
    (id: string, next: BoardElement) => {
      commit(
        current.current.map((element) => (element.id === id ? next : element)),
      );
    },
    [commit],
  );

  const moveBy = useCallback(
    (ids: string[], dx: number, dy: number) => {
      commit(
        current.current.map((element) =>
          ids.includes(element.id) ? moveElement(element, dx, dy) : element,
        ),
      );
    },
    [commit],
  );

  const remove = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      checkpoint();
      commit(current.current.filter((element) => !ids.includes(element.id)));
      setSelectedIds([]);
    },
    [checkpoint, commit],
  );

  /** Drops an element without touching history — for undoing a no-op creation. */
  const discard = useCallback(
    (id: string) => {
      commit(current.current.filter((element) => element.id !== id));
      setSelectedIds((selected) => selected.filter((entry) => entry !== id));
    },
    [commit],
  );

  const selectAll = useCallback(() => {
    setSelectedIds(current.current.map((element) => element.id));
  }, []);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (previous === undefined) return;
    future.current = [...future.current, current.current];
    commit(previous);
    setSelectedIds([]);
  }, [commit]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current = [...past.current, current.current];
    commit(next);
    setSelectedIds([]);
  }, [commit]);

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
