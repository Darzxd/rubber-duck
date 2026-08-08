"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type CanvasSurfaceProps = {
  isDark: boolean;
  zoom: number;
  /** True while the hand tool is picked, so panning works without the key. */
  forcePan?: boolean;
  /** Bumping this number snaps the view back to the origin. */
  resetSignal?: number;
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
  forcePan = false,
  resetSignal = 0,
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

  const paint = useCallback(() => {
    const world = worldRef.current;
    const surface = surfaceRef.current;
    if (!world || !surface) return;

    const { x, y } = offset.current;
    world.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale.current})`;
    // Moving the dots with the content is what sells the endless surface.
    surface.style.backgroundPosition = `${x}px ${y}px`;
    surface.style.backgroundSize = `${GRID * scale.current}px ${GRID * scale.current}px`;
  }, []);

  useEffect(() => {
    scale.current = zoom / 100;
    paint();
  }, [zoom, paint]);

  useEffect(() => {
    offset.current = { x: 0, y: 0 };
    paint();
  }, [resetSignal, paint]);

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

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Middle mouse pans too, which is what people reach for by reflex.
    const wantsPan = canPan || event.button === 1;
    if (!wantsPan) return;

    event.preventDefault();
    pointer.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isPanning) return;
    offset.current.x += event.clientX - pointer.current.x;
    offset.current.y += event.clientY - pointer.current.y;
    pointer.current = { x: event.clientX, y: event.clientY };
    paint();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!isPanning) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsPanning(false);
  }

  return (
    <div
      ref={surfaceRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative flex-1 touch-none overflow-hidden bg-neutral-50 dark:bg-neutral-950 ${
        isPanning ? "cursor-grabbing" : canPan ? "cursor-grab" : ""
      }`}
      style={{
        backgroundImage: `radial-gradient(circle, ${
          isDark ? "#2b2b31" : "#d7d7de"
        } 1.1px, transparent 1.1px)`,
      }}
    >
      {/* Everything in here rides the pan and the zoom. */}
      <div ref={worldRef} className="absolute inset-0 origin-center">
        {children}
      </div>

      {overlay}

      {canPan ? (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full bg-neutral-900/85 px-3 py-1.5 text-[0.7rem] font-medium text-white shadow-lg sm:bottom-16">
          Arrastra para moverte por la pizarra
        </p>
      ) : null}
    </div>
  );
}
