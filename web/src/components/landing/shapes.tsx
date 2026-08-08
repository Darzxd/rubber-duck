export type ShapeProps = {
  color: string;
  className?: string;
};

const STROKE = 2.4;

/** Every shape draws inside a 48×48 box so the field can size them uniformly. */
const BOX = "0 0 48 48";

export function RobotHead({ color, className }: ShapeProps) {
  return (
    <svg viewBox={BOX} className={className} aria-hidden="true" fill="none">
      {/* Antenna: ball on top, stem down into the skull. */}
      <circle cx="24" cy="3.6" r="2.3" fill={color} />
      <path
        d="M24 5.9v3.6"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      {/* Skull. */}
      <rect
        x="9.5"
        y="9.5"
        width="29"
        height="27"
        rx="8.5"
        stroke={color}
        strokeWidth={STROKE}
      />
      {/* Visor holding both eyes — reads better than two loose dots. */}
      <rect
        x="14.5"
        y="15"
        width="19"
        height="11.5"
        rx="5.7"
        stroke={color}
        strokeWidth={STROKE}
      />
      <circle cx="19.8" cy="20.8" r="2.1" fill={color} />
      <circle cx="28.2" cy="20.8" r="2.1" fill={color} />
      <path
        d="M19.5 31.5h9"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      {/* Ears as closed, solid bars. */}
      <rect x="5" y="18.5" width="3.6" height="8.5" rx="1.8" fill={color} />
      <rect x="39.4" y="18.5" width="3.6" height="8.5" rx="1.8" fill={color} />
    </svg>
  );
}

export function SquareShape({ color, className }: ShapeProps) {
  return (
    <svg viewBox={BOX} className={className} aria-hidden="true" fill="none">
      <rect
        x="8"
        y="8"
        width="32"
        height="32"
        rx="6"
        stroke={color}
        strokeWidth={STROKE}
      />
    </svg>
  );
}

export function CircleShape({ color, className }: ShapeProps) {
  return (
    <svg viewBox={BOX} className={className} aria-hidden="true" fill="none">
      <circle cx="24" cy="24" r="16" stroke={color} strokeWidth={STROKE} />
    </svg>
  );
}

export function TriangleShape({ color, className }: ShapeProps) {
  return (
    <svg viewBox={BOX} className={className} aria-hidden="true" fill="none">
      <path
        d="M24 8.5 41 38.5H7z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CursorShape({ color, className }: ShapeProps) {
  return (
    <svg viewBox={BOX} className={className} aria-hidden="true">
      <path
        d="M13 6.5 39 26.4l-12.6 1.5-6.1 11.8z"
        fill={color}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A sticky note — what the Scribe and the Critic leave on the board. */
export function StickyNote({ color, className }: ShapeProps) {
  return (
    <svg viewBox={BOX} className={className} aria-hidden="true" fill="none">
      <path
        d="M8.5 9.5h31v20l-10 10h-21z"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M39.5 29.5h-10v10"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <path
        d="M15 18h18M15 24h12"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A node — what the Architect draws out of a settled thread. */
export function NodeCard({ color, className }: ShapeProps) {
  return (
    <svg viewBox={BOX} className={className} aria-hidden="true" fill="none">
      <rect
        x="6.5"
        y="12.5"
        width="35"
        height="23"
        rx="4"
        stroke={color}
        strokeWidth={STROKE}
      />
      <path
        d="M6.5 20.5h35"
        stroke={color}
        strokeWidth={STROKE}
      />
      <path
        d="M13 27.5h13"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <circle cx="6.5" cy="24" r="2.8" fill={color} />
      <circle cx="41.5" cy="24" r="2.8" fill={color} />
    </svg>
  );
}

/** A connection between two nodes. */
export function Connector({ color, className }: ShapeProps) {
  return (
    <svg viewBox={BOX} className={className} aria-hidden="true" fill="none">
      <path
        d="M9 34c6-16 24-16 30 0"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <circle cx="9" cy="34" r="3.4" fill={color} />
      <circle cx="39" cy="34" r="3.4" fill={color} />
    </svg>
  );
}
