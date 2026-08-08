import AvatarStack from "./AvatarStack";
import type { Author } from "./authors";
import {
  ChevronDown,
  LinkIcon,
  LogoMark,
  MoreVertical,
  SparkleIcon,
} from "./icons";

type TopBarProps = {
  sessionName: string;
  authors: Author[];
  /** How many agents are currently working, shown in the centre pill. */
  workingAgents?: number;
  onShare?: () => void;
};

export default function TopBar({
  sessionName,
  authors,
  workingAgents = 0,
  onShare,
}: TopBarProps) {
  return (
    <header className="relative z-30 flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2.5 sm:px-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
          <LogoMark className="size-4" />
        </span>
        <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white">
          Liveboard
        </span>

        <span className="mx-1 hidden h-5 w-px bg-neutral-200 sm:block dark:bg-neutral-700" />

        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:flex dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          {sessionName}
          <ChevronDown className="size-3.5 text-neutral-400" />
        </button>
      </div>

      {workingAgents > 0 ? (
        <button
          type="button"
          className="mx-auto hidden items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[0.8rem] font-medium text-neutral-700 transition-colors hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 md:flex dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <SparkleIcon className="size-3.5 text-violet-500" />
          {workingAgents} agentes trabajando
          <ChevronDown className="size-3.5 text-neutral-400" />
        </button>
      ) : null}

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:ml-0">
        {authors.length > 0 ? <AvatarStack authors={authors} /> : null}

        <span className="hidden items-center gap-1.5 sm:flex">
          <span className="relative grid size-2.5 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#ff2d2d]/70 motion-reduce:animate-none" />
            <span className="relative size-2.5 rounded-full bg-[#ff2d2d]" />
          </span>
          <span className="text-xs font-bold tracking-wide text-neutral-900 dark:text-white">
            EN VIVO
          </span>
        </span>

        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <LinkIcon />
          <span className="hidden sm:inline">Compartir</span>
        </button>

        <button
          type="button"
          aria-label="Más opciones"
          className="grid size-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <MoreVertical />
        </button>
      </div>
    </header>
  );
}
