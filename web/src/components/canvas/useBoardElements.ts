"use client";

import { useCallback, useRef, useState } from "react";
import { moveElement, type BoardElement } from "./boardElements";

/** How many steps back the undo button can walk. */
const HISTORY_LIMIT = 50;

export function useBoardElements() {
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    (id: string, next: Partial<BoardElement>) => {
      commit(
        current.current.map((element) =>
          element.id === id ? ({ ...element, ...next } as BoardElement) : element,
        ),
      );
    },
    [commit],
  );

  const moveBy = useCallback(
    (id: string, dx: number, dy: number) => {
      commit(
        current.current.map((element) =>
          element.id === id ? moveElement(element, dx, dy) : element,
        ),
      );
    },
    [commit],
  );

  const remove = useCallback(
    (id: string) => {
      checkpoint();
      commit(current.current.filter((element) => element.id !== id));
      setSelectedId((selected) => (selected === id ? null : selected));
    },
    [checkpoint, commit],
  );

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (previous === undefined) return;
    future.current = [...future.current, current.current];
    commit(previous);
    setSelectedId(null);
  }, [commit]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === undefined) return;
    past.current = [...past.current, current.current];
    commit(next);
    setSelectedId(null);
  }, [commit]);

  return {
    elements,
    selectedId,
    setSelectedId,
    checkpoint,
    add,
    patch,
    moveBy,
    remove,
    undo,
    redo,
  };
}
