import type { ReactNode } from "react";

export type StickyTone = "amber" | "blue" | "green" | "pink" | "violet";

type StickyNoteProps = {
  /** Category tag shown on the little flag above the note. */
  tag?: string;
  tone?: StickyTone;
  /** Position on the board, in percent of the surface. */
  x: number;
  y: number;
  /** Slight tilt, in degrees, so a wall of notes never looks like a table. */
  tilt?: number;
  children: ReactNode;
};

export const TONES: Record<StickyTone, { note: string; flag: string }> = {
  amber: {
    note: "bg-[#fef3c7] text-[#78350f]",
    flag: "bg-[#fcd34d] text-[#78350f]",
  },
  blue: {
    note: "bg-[#dbeafe] text-[#1e3a8a]",
    flag: "bg-[#93c5fd] text-[#1e3a8a]",
  },
  green: {
    note: "bg-[#d1fae5] text-[#065f46]",
    flag: "bg-[#6ee7b7] text-[#065f46]",
  },
  pink: {
    note: "bg-[#fee2e2] text-[#991b1b]",
    flag: "bg-[#fca5a5] text-[#991b1b]",
  },
  violet: {
    note: "bg-[#ede9fe] text-[#5b21b6]",
    flag: "bg-[#c4b5fd] text-[#5b21b6]",
  },
};

export default function StickyNote({
  tag,
  tone = "amber",
  x,
  y,
  tilt = 0,
  children,
}: StickyNoteProps) {
  const palette = TONES[tone];

  return (
    <div
      className="absolute z-10 w-40"
      style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${tilt}deg)` }}
    >
      {tag ? (
        <span
          className={`inline-block rounded-t-md px-2 py-0.5 text-[0.6rem] font-bold ${palette.flag}`}
        >
          {tag}
        </span>
      ) : null}
      <div
        className={`rounded-b-md rounded-tr-md p-3 text-[0.8rem] leading-snug shadow-md shadow-neutral-900/10 ${palette.note}`}
      >
        {children}
      </div>
    </div>
  );
}
