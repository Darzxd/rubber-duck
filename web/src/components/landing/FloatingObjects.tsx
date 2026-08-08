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
  /** Where the circuit starts, in percent of the stage. */
  left: number;
  top: number;
  size: string;
  opacity: number;
  /** How far the object travels, in viewport units. */
  tx: string;
  ty: string;
  r: string;
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
 * the client render and break hydration. Long, mismatched durations keep the
 * field from ever repeating the same arrangement.
 */
const OBJECTS: FloatingObject[] = [
  { id: "robot-l", Shape: RobotHead, color: INDIGO, left: 7, top: 17, size: "size-16", opacity: 0.7, tx: "14vw", ty: "14vh", r: "-8deg", dur: "58s", delay: "0s" },
  { id: "circle-l", Shape: CircleShape, color: AMBER, left: 16, top: 41, size: "size-11", opacity: 0.65, tx: "-9vw", ty: "-16vh", r: "12deg", dur: "46s", delay: "-11s" },
  { id: "triangle-l", Shape: TriangleShape, color: GREEN, left: 8, top: 67, size: "size-12", opacity: 0.6, tx: "17vw", ty: "-13vh", r: "14deg", dur: "63s", delay: "-24s" },
  { id: "cursor-l", Shape: CursorShape, color: RED, left: 22, top: 23, size: "size-9", opacity: 0.75, tx: "-11vw", ty: "17vh", r: "-12deg", dur: "41s", delay: "-6s" },
  { id: "sticky-l", Shape: StickyNote, color: MAGENTA, left: 5, top: 85, size: "size-13", opacity: 0.55, tx: "13vw", ty: "-15vh", r: "9deg", dur: "55s", delay: "-31s", wideOnly: true },
  { id: "node-l", Shape: NodeCard, color: INK, left: 21, top: 89, size: "size-14", opacity: 0.5, tx: "-12vw", ty: "-18vh", r: "-7deg", dur: "68s", delay: "-17s", wideOnly: true },
  { id: "circle-r", Shape: CircleShape, color: INDIGO, left: 71, top: 11, size: "size-10", opacity: 0.6, tx: "12vw", ty: "16vh", r: "-10deg", dur: "50s", delay: "-8s" },
  { id: "node-r", Shape: NodeCard, color: GREEN, left: 83, top: 21, size: "size-15", opacity: 0.65, tx: "-15vw", ty: "-12vh", r: "8deg", dur: "61s", delay: "-27s" },
  { id: "square-r", Shape: SquareShape, color: RED, left: 91, top: 47, size: "size-11", opacity: 0.6, tx: "-13vw", ty: "14vh", r: "-13deg", dur: "44s", delay: "-19s" },
  { id: "cursor-r", Shape: CursorShape, color: AMBER, left: 77, top: 69, size: "size-9", opacity: 0.75, tx: "11vw", ty: "-17vh", r: "11deg", dur: "39s", delay: "-3s" },
  { id: "robot-r", Shape: RobotHead, color: CYAN, left: 88, top: 81, size: "size-14", opacity: 0.6, tx: "-14vw", ty: "-14vh", r: "7deg", dur: "57s", delay: "-35s", wideOnly: true },
  { id: "connector-r", Shape: Connector, color: MAGENTA, left: 67, top: 90, size: "size-12", opacity: 0.5, tx: "15vw", ty: "12vh", r: "-9deg", dur: "66s", delay: "-22s", wideOnly: true },
  { id: "triangle-tr", Shape: TriangleShape, color: INK, left: 95, top: 9, size: "size-9", opacity: 0.45, tx: "-10vw", ty: "19vh", r: "15deg", dur: "48s", delay: "-14s", wideOnly: true },
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
          tx,
          ty,
          r,
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
              className="board-travel"
              style={
                {
                  opacity,
                  "--tx": tx,
                  "--ty": ty,
                  "--r": r,
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
