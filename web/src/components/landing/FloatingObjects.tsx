import type { ComponentType } from "react";
import {
  CircleShape,
  Connector,
  CursorShape,
  NodeCard,
  RobotHead,
  SquareShape,
  StickyNote,
  TriangleShape,
  type ShapeProps,
} from "./shapes";

type FloatingObject = {
  id: string;
  Shape: ComponentType<ShapeProps>;
  color: string;
  /** Percent of the stage. Kept off the centre so copy stays readable. */
  left: number;
  top: number;
  size: string;
  opacity: number;
  dx: string;
  dy: string;
  dr: string;
  dur: string;
  delay: string;
  /** Dropped on narrow screens, where the centre column eats the margins. */
  wideOnly?: boolean;
};

const INK = "#111111";
const INDIGO = "#3b2fe0";
const AMBER = "#f5a524";
const GREEN = "#12b76a";
const RED = "#ff3b3b";
const MAGENTA = "#c026d3";
const CYAN = "#0ea5b7";

/**
 * Fixed layout on purpose: random positions would differ between the server and
 * the client render and break hydration.
 */
const OBJECTS: FloatingObject[] = [
  { id: "robot-l", Shape: RobotHead, color: INDIGO, left: 7, top: 17, size: "size-16", opacity: 0.7, dx: "10px", dy: "-28px", dr: "-7deg", dur: "15s", delay: "0s" },
  { id: "circle-l", Shape: CircleShape, color: AMBER, left: 16, top: 41, size: "size-11", opacity: 0.65, dx: "-12px", dy: "22px", dr: "9deg", dur: "12s", delay: "-3s" },
  { id: "triangle-l", Shape: TriangleShape, color: GREEN, left: 8, top: 67, size: "size-12", opacity: 0.6, dx: "14px", dy: "-20px", dr: "12deg", dur: "17s", delay: "-6s" },
  { id: "cursor-l", Shape: CursorShape, color: RED, left: 22, top: 23, size: "size-9", opacity: 0.75, dx: "-9px", dy: "18px", dr: "-10deg", dur: "11s", delay: "-1.5s" },
  { id: "sticky-l", Shape: StickyNote, color: MAGENTA, left: 5, top: 85, size: "size-13", opacity: 0.55, dx: "12px", dy: "-16px", dr: "8deg", dur: "16s", delay: "-8s", wideOnly: true },
  { id: "node-l", Shape: NodeCard, color: INK, left: 21, top: 89, size: "size-14", opacity: 0.5, dx: "-14px", dy: "-22px", dr: "-6deg", dur: "13s", delay: "-4s", wideOnly: true },
  { id: "circle-r", Shape: CircleShape, color: INDIGO, left: 71, top: 11, size: "size-10", opacity: 0.6, dx: "12px", dy: "20px", dr: "-9deg", dur: "14s", delay: "-2s" },
  { id: "node-r", Shape: NodeCard, color: GREEN, left: 83, top: 21, size: "size-15", opacity: 0.65, dx: "-10px", dy: "-24px", dr: "7deg", dur: "18s", delay: "-7s" },
  { id: "square-r", Shape: SquareShape, color: RED, left: 91, top: 47, size: "size-11", opacity: 0.6, dx: "-13px", dy: "18px", dr: "-11deg", dur: "12s", delay: "-5s" },
  { id: "cursor-r", Shape: CursorShape, color: AMBER, left: 77, top: 69, size: "size-9", opacity: 0.75, dx: "11px", dy: "-19px", dr: "10deg", dur: "10s", delay: "-2.5s" },
  { id: "robot-r", Shape: RobotHead, color: CYAN, left: 88, top: 81, size: "size-14", opacity: 0.6, dx: "-11px", dy: "-26px", dr: "6deg", dur: "16s", delay: "-9s", wideOnly: true },
  { id: "connector-r", Shape: Connector, color: MAGENTA, left: 67, top: 90, size: "size-12", opacity: 0.5, dx: "13px", dy: "16px", dr: "-8deg", dur: "15s", delay: "-6.5s", wideOnly: true },
  { id: "triangle-tr", Shape: TriangleShape, color: INK, left: 95, top: 9, size: "size-9", opacity: 0.45, dx: "-9px", dy: "22px", dr: "13deg", dur: "13s", delay: "-3.5s", wideOnly: true },
];

export default function FloatingObjects() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {OBJECTS.map(
        ({
          id,
          Shape,
          color,
          left,
          top,
          size,
          opacity,
          dx,
          dy,
          dr,
          dur,
          delay,
          wideOnly,
        }) => (
          <div
            key={id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${
              wideOnly ? "hidden lg:block" : ""
            }`}
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            {/* The animation rides this div, not the SVG, so it stays on the GPU. */}
            <div
              className="board-drift"
              style={
                {
                  opacity,
                  "--dx": dx,
                  "--dy": dy,
                  "--dr": dr,
                  "--dur": dur,
                  "--delay": delay,
                } as React.CSSProperties
              }
            >
              <Shape color={color} className={size} />
            </div>
          </div>
        ),
      )}
    </div>
  );
}
