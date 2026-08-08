import AvatarStack from "./AvatarStack";
import type { Author } from "./authors";
import {
  ChevronDown,
  CloudCheck,
  LinkIcon,
  LogoMark,
  MoreVertical,
  RedoIcon,
  UndoIcon,
} from "./icons";

type TopBarProps = {
  sessionName: string;
  authors: Author[];
  onShare?: () => void;
};

const GHOST =
  "grid size-8 place-items-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:pointer-events-none disabled:text-neutral-300 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white dark:disabled:text-neutral-700";

export default function TopBar({
  sessionName,
  authors,
  onShare,
}: TopBarProps) {
  return (
    <header className="relative z-30 flex items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2.5 sm:px-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-neutral-900 dark:text-white">
        <LogoMark />
        <span className="text-base font-bold tracking-tight">Liveboard</span>
      </div>

      <div className="mx-auto hidden items-center gap-2 md:flex">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          {sessionName}
          <ChevronDown className="size-3.5 text-neutral-400" />
        </button>

        <span className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

        <span className="flex items-center gap-1.5 px-1 text-sm text-neutral-400">
          <CloudCheck />
          Guardado
        </span>

        <button type="button" aria-label="Deshacer" className={GHOST}>
          <UndoIcon />
        </button>
        <button type="button" aria-label="Rehacer" disabled className={GHOST}>
          <RedoIcon />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-0">
        <AvatarStack authors={authors} />

        <span className="hidden items-center gap-1.5 sm:flex">
          <span className="relative grid size-2.5 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#ff2d2d]/70 motion-reduce:animate-none" />
            <span className="relative size-2.5 rounded-full bg-[#ff2d2d]" />
          </span>
          <span className="text-xs font-bold tracking-wide text-neutral-900 dark:text-white">
            LIVE
          </span>
        </span>

        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          <LinkIcon />
          <span className="hidden sm:inline">Compartir</span>
        </button>

        <button type="button" aria-label="Más opciones" className={GHOST}>
          <MoreVertical />
        </button>
      </div>
    </header>
  );
}
