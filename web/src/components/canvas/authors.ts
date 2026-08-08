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

/**
 * There is deliberately no sample roster here. Presence must come from the
 * session layer: a face or a cursor on screen always means a real person.
 */
