"use client";

import { useCallback, useRef, useState } from "react";
import type { BoardElement } from "./boardElements";

/** How many steps back the undo button can walk. */
const HISTORY_LIMIT = 50;

export function useBoardElements() {
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const past = useRef<BoardElement[][]>([]);
  const future = useRef<BoardElement[][]>([]);

  /** Snapshot the current board before a change that undo should reverse. */
  const checkpoint = useCallback(() => {
    setElements((current) => {
      past.current = [...past.current.slice(-HISTORY_LIMIT + 1), current];
      future.current = [];
      return current;
    });
  }, []);

  const add = useCallback(
    (element: BoardElement) => {
      checkpoint();
      setElements((current) => [...current, element]);
    },
    [checkpoint],
  );

  /** Live edits during a drag: no checkpoint, the gesture already made one. */
  const patch = useCallback(
    (id: string, next: Partial<BoardElement>) => {
      setElements((current) =>
        current.map((element) =>
          element.id === id ? ({ ...element, ...next } as BoardElement) : element,
        ),
      );
    },
    [],
  );

  const replace = useCallback((id: string, next: BoardElement) => {
    setElements((current) =>
      current.map((element) => (element.id === id ? next : element)),
    );
  }, []);

  const remove = useCallback(
    (id: string) => {
      checkpoint();
      setElements((current) => current.filter((element) => element.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [checkpoint],
  );

  const undo = useCallback(() => {
    setElements((current) => {
      const previous = past.current.pop();
      if (previous === undefined) return current;
      future.current = [...future.current, current];
      return previous;
    });
    setSelectedId(null);
  }, []);

  const redo = useCallback(() => {
    setElements((current) => {
      const next = future.current.pop();
      if (next === undefined) return current;
      past.current = [...past.current, current];
      return next;
    });
    setSelectedId(null);
  }, []);

  return {
    elements,
    setElements,
    selectedId,
    setSelectedId,
    checkpoint,
    add,
    patch,
    replace,
    remove,
    undo,
    redo,
  };
}
