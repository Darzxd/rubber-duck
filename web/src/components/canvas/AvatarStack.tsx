import type { Author } from "./authors";

type AvatarStackProps = {
  authors: Author[];
  /** How many faces to show before collapsing the rest into a counter. */
  max?: number;
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

export default function AvatarStack({ authors, max = 3 }: AvatarStackProps) {
  const shown = authors.slice(0, max);
  const overflow = authors.length - shown.length;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {shown.map((author) => (
          <span
            key={author.id}
            title={author.name}
            className="grid size-7 place-items-center rounded-full text-[0.68rem] font-bold text-white ring-2 ring-white dark:ring-neutral-900"
            style={{ backgroundColor: author.color }}
          >
            {initials(author.name)}
          </span>
        ))}
      </div>

      {overflow > 0 ? (
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
