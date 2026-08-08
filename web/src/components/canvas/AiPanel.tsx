import {
  GroupsIcon,
  IdeaIcon,
  OrganizeIcon,
  SummaryIcon,
  TaskIcon,
} from "./icons";

export type AiActionId =
  | "summarise"
  | "organise"
  | "groups"
  | "ideas"
  | "tasks";

type AiPanelProps = {
  onRunAction?: (action: AiActionId) => void;
};

const ACTIONS: {
  id: AiActionId;
  label: string;
  Icon: typeof SummaryIcon;
}[] = [
  { id: "summarise", label: "Resumir contenido", Icon: SummaryIcon },
  { id: "organise", label: "Organizar elementos", Icon: OrganizeIcon },
  { id: "groups", label: "Detectar grupos", Icon: GroupsIcon },
  { id: "ideas", label: "Generar ideas", Icon: IdeaIcon },
  { id: "tasks", label: "Convertir a tareas", Icon: TaskIcon },
];

export default function AiPanel({ onRunAction }: AiPanelProps) {
  return (
    <aside className="pointer-events-auto absolute right-16 top-6 z-30 w-56 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl shadow-neutral-900/10 sm:right-20 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-2 px-1 pb-2">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
          AI Assistant
        </h2>
        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
          Beta
        </span>
      </div>

      <ul className="flex flex-col">
        {ACTIONS.map(({ id, label, Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onRunAction?.(id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-2 text-left text-[0.8rem] text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Icon className="size-4 shrink-0 text-neutral-400" />
              {label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
