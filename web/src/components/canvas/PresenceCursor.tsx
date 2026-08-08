import type { Author } from "./authors";

type PresenceCursorProps = {
  author: Author;
};

export default function PresenceCursor({ author }: PresenceCursorProps) {
  return (
    <div
      className="pointer-events-none absolute z-20 transition-[left,top] duration-500 ease-out motion-reduce:transition-none"
      style={{ left: `${author.x}%`, top: `${author.y}%` }}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.3)]"
      >
        <path
          d="M5.5 2.4 19 12.6l-6.5.8-3.2 6.1z"
          fill={author.color}
          stroke="#ffffff"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="ml-3 inline-block rounded-md px-1.5 py-0.5 text-[0.65rem] font-bold text-white shadow-sm"
        style={{ backgroundColor: author.color }}
      >
        {author.name}
      </span>
    </div>
  );
}
