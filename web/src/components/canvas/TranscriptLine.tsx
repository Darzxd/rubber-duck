import type { TranscriptLine as Line } from "./panelData";

type TranscriptLineProps = {
  line: Line;
};

export default function TranscriptLine({ line }: TranscriptLineProps) {
  return (
    <li className="flex gap-2 px-1 py-1.5">
      <span className="pt-0.5 text-[0.65rem] tabular-nums text-neutral-400">
        {line.time}
      </span>
      <div className="min-w-0 flex-1">
        <span
          className="mr-1.5 inline-block rounded px-1.5 py-px align-middle text-[0.62rem] font-bold text-white"
          style={{ backgroundColor: line.color }}
        >
          {line.author}
        </span>
        <span className="text-[0.72rem] leading-snug text-neutral-600 dark:text-neutral-300">
          {line.text}
        </span>
      </div>
    </li>
  );
}
