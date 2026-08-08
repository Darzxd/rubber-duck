"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Point } from "./boardElements";

export type CanvasApi = {
  /** Board coordinates of whatever is in the middle of the viewport. */
  center: () => Point;
};

type CanvasSurfaceProps = {
  isDark: boolean;
  zoom: number;
  apiRef?: React.RefObject<CanvasApi | null>;
  /** True while the hand tool is picked, so panning works without the key. */
  forcePan?: boolean;
  /** True when a tool wants the pointer, which also sets the crosshair. */
  canDraw?: boolean;
  /** Bumping this number snaps the view back to the origin. */
  resetSignal?: number;
  onDrawStart?: (point: Point, event: React.PointerEvent) => void;
  onDrawMove?: (point: Point) => void;
  onDrawEnd?: (point: Point) => void;
  /** Chrome that must stay put while the board moves underneath it. */
  overlay?: ReactNode;
  /** Board content: this is what actually moves. */
  children?: ReactNode;
};

/** Dot spacing at 100%, in px. */
const GRID = 22;

/**
 * Space belongs to whatever has focus first: it types, and it presses buttons.
 * Only when focus is on none of those does it become the pan modifier.
 */
function ownsSpaceKey(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.getAttribute("role") === "button" ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName)
  );
}

export default function CanvasSurface({
  isDark,
  zoom,
  apiRef,
  forcePan = false,
  canDraw = false,
  resetSignal = 0,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  overlay,
  children,
}: CanvasSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  // Transient: written straight to the DOM so a drag never re-renders the board.
  const offset = useRef({ x: 0, y: 0 });
  const pointer = useRef({ x: 0, y: 0 });
  const scale = useRef(zoom / 100);

  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const paint = useCallback(() => {
    const world = worldRef.current;
    const surface = surfaceRef.current;
    if (!world || !surface) return;

    const { x, y } = offset.current;
    const size = GRID * scale.current;
    world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale.current})`;
    // Moving the dots with the content is what sells the endless surface.
    surface.style.backgroundPosition = `${x}px ${y}px`;
    surface.style.backgroundSize = `${size}px ${size}px`;
  }, []);

  /**
   * The world is anchored top-left, which keeps screen↔board maths trivial.
   * To still zoom around the middle, the offset is corrected on every step so
   * whatever sits at the centre of the viewport stays there.
   */
  useEffect(() => {
    const surface = surfaceRef.current;
    const next = zoom / 100;
    const previous = scale.current;

    if (surface && previous !== next) {
      const cx = surface.clientWidth / 2;
      const cy = surface.clientHeight / 2;
      offset.current.x = cx - ((cx - offset.current.x) * next) / previous;
      offset.current.y = cy - ((cy - offset.current.y) * next) / previous;
    }

    scale.current = next;
    paint();
  }, [zoom, paint]);

  useEffect(() => {
    offset.current = { x: 0, y: 0 };
    paint();
  }, [resetSignal, paint]);

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      center: () => {
        const surface = surfaceRef.current;
        if (!surface) return { x: 0, y: 0 };
        return {
          x: (surface.clientWidth / 2 - offset.current.x) / scale.current,
          y: (surface.clientHeight / 2 - offset.current.y) / scale.current,
        };
      },
    };
  }, [apiRef]);

  // Space is the pan modifier, exactly like the drawing tools people know.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space" || event.repeat) return;
      if (ownsSpaceKey(event.target)) return;
      event.preventDefault();
      setIsSpaceDown(true);
    }
    function onKeyUp(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      setIsSpaceDown(false);
    }
    // Alt-tabbing away with space held would otherwise leave it stuck down.
    function onBlur() {
      setIsSpaceDown(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const canPan = isSpaceDown || forcePan;

  function toWorld(clientX: number, clientY: number): Point {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - offset.current.x) / scale.current,
      y: (clientY - rect.top - offset.current.y) / scale.current,
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // The chrome floats inside the surface, so its clicks bubble down here.
    // Capturing the pointer for them would swallow the button's own click.
    if (
      event.target instanceof Element &&
      event.target.closest("[data-board-chrome], input, textarea, button")
    ) {
      return;
    }

    // Middle mouse pans too, which is what people reach for by reflex.
    const wantsPan = canPan || event.button === 1;

    if (wantsPan) {
      event.preventDefault();
      pointer.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true);
      return;
    }

    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    onDrawStart?.(toWorld(event.clientX, event.clientY), event);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (isPanning) {
      offset.current.x += event.clientX - pointer.current.x;
      offset.current.y += event.clientY - pointer.current.y;
      pointer.current = { x: event.clientX, y: event.clientY };
      paint();
      return;
    }

    if (isDrawing) {
      onDrawMove?.(toWorld(event.clientX, event.clientY));
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (isPanning) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setIsPanning(false);
      return;
    }

    if (isDrawing) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setIsDrawing(false);
      onDrawEnd?.(toWorld(event.clientX, event.clientY));
    }
  }

  const cursor = isPanning
    ? "cursor-grabbing"
    : canPan
      ? "cursor-grab"
      : canDraw
        ? "cursor-crosshair"
        : "";

  return (
    <div
      ref={surfaceRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative flex-1 touch-none overflow-hidden bg-neutral-50 dark:bg-neutral-950 ${cursor}`}
      style={{
        backgroundImage: `radial-gradient(circle, ${
          isDark ? "#2b2b31" : "#d7d7de"
        } 1.1px, transparent 1.1px)`,
        // Declarative because it follows zoom, which is React state. Leaving it
        // to the imperative paint meant no grid at all until the first nudge.
        backgroundSize: `${GRID * (zoom / 100)}px ${GRID * (zoom / 100)}px`,
      }}
    >
      {/* Everything in here rides the pan and the zoom. */}
      <div ref={worldRef} className="absolute inset-0 origin-top-left">
        {children}
      </div>

      <div data-board-chrome className="pointer-events-none">
        {overlay}
      </div>

      {canPan ? (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full bg-neutral-900/85 px-3 py-1.5 text-[0.7rem] font-medium text-white shadow-lg sm:bottom-16">
          Arrastra para moverte por la pizarra
        </p>
      ) : null}
    </div>
  );
}
