export type Author = {
  id: string;
  name: string;
  color: string;
  /** Position on the board, in percent of the surface. */
  x: number;
  y: number;
};

/**
 * Per-author colours. Picked to stay legible on both the light and the dark
 * board, and to stay apart from each other for people who confuse red/green.
 */
export const AUTHOR_COLORS = [
  "#3b2fe0", // indigo
  "#ffc93c", // amber
  "#12b76a", // green
  "#ff3b3b", // red
  "#111111", // ink
  "#c026d3", // magenta
] as const;

export function colorForAuthor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length];
}

/** Stand-in presence until the session layer feeds real cursors in. */
export const SAMPLE_AUTHORS: Author[] = [
  { id: "ana", name: "Ana", color: AUTHOR_COLORS[0], x: 26, y: 62 },
  { id: "beto", name: "Beto", color: AUTHOR_COLORS[1], x: 44, y: 47 },
  { id: "caro", name: "Caro", color: AUTHOR_COLORS[2], x: 71, y: 38 },
  { id: "dani", name: "Dani", color: AUTHOR_COLORS[3], x: 58, y: 57 },
  { id: "eli", name: "Eli", color: AUTHOR_COLORS[4], x: 76, y: 71 },
];
