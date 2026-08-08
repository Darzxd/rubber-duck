import type { Author } from "./authors";

type PresenceCursorProps = {
  author: Author;
};

export default function PresenceCursor({ author }: PresenceCursorProps) {
  return (
    <div
      className="pointer-events-none absolute z-10 transition-[left,top] duration-500 ease-out motion-reduce:transition-none"
      style={{ left: `${author.x}%`, top: `${author.y}%` }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
      >
        <path
          d="M5.5 2.4 19 12.6l-6.5.8-3.2 6.1z"
          fill={author.color}
          stroke="#ffffff"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="ml-4 inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
        style={{ backgroundColor: author.color }}
      >
        {author.name}
      </span>
    </div>
  );
}
