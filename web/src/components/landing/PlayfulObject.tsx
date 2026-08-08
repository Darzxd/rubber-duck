"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type PlayfulObjectProps = {
  /** Resting spot, in percent of the stage. */
  left: number;
  top: number;
  opacity: number;
  /** Ambient drift, handed straight to the CSS animation. */
  tx: string;
  ty: string;
  r: string;
  dur: string;
  delay: string;
  wideOnly?: boolean;
  children: ReactNode;
};

/** Speed kept per frame after each frame of flight. */
const FRICTION = 0.94;
/** Speed kept after bouncing off an edge. */
const RESTITUTION = 0.68;
/** Below this, the object is considered parked. */
const STOP_SPEED = 0.08;
/** How close to the edge an object may come, in px. */
const PAD = 26;
/** Keeps a hard flick from teleporting the object across the screen. */
const MAX_SPEED = 48;
const FRAME_MS = 16.7;

function clampSpeed(value: number) {
  return Math.max(-MAX_SPEED, Math.min(MAX_SPEED, value));
}

export default function PlayfulObject({
  left,
  top,
  opacity,
  tx,
  ty,
  r,
  dur,
  delay,
  wideOnly,
  children,
}: PlayfulObjectProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<HTMLDivElement>(null);
  const driftRef = useRef<HTMLDivElement>(null);

  // Once grabbed, the object leaves its CSS orbit for good and lives on physics.
  const [isLoose, setIsLoose] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Transient per-frame values live in refs: state here would re-render 60fps.
  const position = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const rotation = useRef(0);
  const pointer = useRef({ x: 0, y: 0, time: 0 });
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function paint() {
    const element = offsetRef.current;
    if (!element) return;
    element.style.transform = `translate3d(${position.current.x}px, ${position.current.y}px, 0) rotate(${rotation.current}deg)`;
  }

  /** Where the object may roam, expressed as offsets from its resting spot. */
  function getBounds() {
    const anchor = anchorRef.current;
    const stage = anchor?.offsetParent as HTMLElement | null;
    if (!anchor || !stage) return null;
    return {
      minX: PAD - anchor.offsetLeft,
      maxX: stage.clientWidth - PAD - anchor.offsetLeft,
      minY: PAD - anchor.offsetTop,
      maxY: stage.clientHeight - PAD - anchor.offsetTop,
    };
  }

  function step() {
    const bounds = getBounds();
    position.current.x += velocity.current.x;
    position.current.y += velocity.current.y;

    if (bounds) {
      if (position.current.x < bounds.minX || position.current.x > bounds.maxX) {
        position.current.x = Math.max(
          bounds.minX,
          Math.min(bounds.maxX, position.current.x),
        );
        velocity.current.x *= -RESTITUTION;
      }
      if (position.current.y < bounds.minY || position.current.y > bounds.maxY) {
        position.current.y = Math.max(
          bounds.minY,
          Math.min(bounds.maxY, position.current.y),
        );
        velocity.current.y *= -RESTITUTION;
      }
    }

    velocity.current.x *= FRICTION;
    velocity.current.y *= FRICTION;
    // A thrown object tumbles; the spin dies with the speed.
    rotation.current += velocity.current.x * 0.6;
    paint();

    const speed =
      Math.abs(velocity.current.x) + Math.abs(velocity.current.y);
    if (speed > STOP_SPEED) {
      frame.current = requestAnimationFrame(step);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    cancelAnimationFrame(frame.current);

    // Hand off from the CSS orbit without a jump: fold whatever transform the
    // animation is showing right now into our own offset.
    if (!isLoose && driftRef.current) {
      const matrix = new DOMMatrixReadOnly(
        getComputedStyle(driftRef.current).transform,
      );
      position.current = { x: matrix.m41, y: matrix.m42 };
      rotation.current = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
      paint();
      setIsLoose(true);
    }

    velocity.current = { x: 0, y: 0 };
    pointer.current = {
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;

    const dx = event.clientX - pointer.current.x;
    const dy = event.clientY - pointer.current.y;
    const dt = Math.max(1, event.timeStamp - pointer.current.time);

    position.current.x += dx;
    position.current.y += dy;
    velocity.current = {
      x: clampSpeed((dx / dt) * FRAME_MS),
      y: clampSpeed((dy / dt) * FRAME_MS),
    };
    pointer.current = {
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
    };
    paint();
  }

  function handlePointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(step);
  }

  return (
    <div
      ref={anchorRef}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ${
        wideOnly ? "hidden lg:block" : ""
      }`}
      style={{ left: `${left}%`, top: `${top}%` }}
    >
      <div ref={offsetRef}>
        <div
          ref={driftRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`pointer-events-auto touch-none select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } ${isLoose ? "" : "board-travel"}`}
          style={
            isLoose
              ? { opacity }
              : ({
                  opacity,
                  "--tx": tx,
                  "--ty": ty,
                  "--r": r,
                  "--dur": dur,
                  "--delay": delay,
                } as React.CSSProperties)
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
