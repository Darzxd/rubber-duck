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
      <path
        d="M24 4.5v5.5"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <circle cx="24" cy="3.4" r="2.6" fill={color} />
      <rect
        x="8.5"
        y="10.5"
        width="31"
        height="27"
        rx="7.5"
        stroke={color}
        strokeWidth={STROKE}
      />
      <circle cx="18.5" cy="21.5" r="3.1" fill={color} />
      <circle cx="29.5" cy="21.5" r="3.1" fill={color} />
      <path
        d="M18.5 30.5h11"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M8.5 19.5h-4v8h4M39.5 19.5h4v8h-4"
        stroke={color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
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
