import ActivityMeter from "./ActivityMeter";
import { RobotIcon } from "./icons";
import type { AgentStatus, PanelTone } from "./panelData";

type AgentStatusCardProps = {
  agent: AgentStatus;
};

const EDGE: Record<PanelTone, string> = {
  green: "border-l-emerald-400",
  violet: "border-l-violet-400",
  blue: "border-l-blue-400",
  amber: "border-l-amber-400",
};

const STATE: Record<PanelTone, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  violet: "text-violet-600 dark:text-violet-400",
  blue: "text-blue-600 dark:text-blue-400",
  amber: "text-amber-600 dark:text-amber-400",
};

export default function AgentStatusCard({ agent }: AgentStatusCardProps) {
  return (
    <article
      className={`rounded-xl border border-neutral-200 border-l-[3px] bg-white p-2.5 ${EDGE[agent.tone]} dark:border-neutral-700 dark:bg-neutral-800/60`}
    >
      <div className="flex items-center gap-2">
        <RobotIcon className="size-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
        <h4 className="text-[0.8rem] font-semibold text-neutral-900 dark:text-white">
          {agent.name}
        </h4>
        <span
          className={`ml-auto text-[0.68rem] font-semibold ${STATE[agent.tone]}`}
        >
          {agent.state}
        </span>
      </div>

      <p className="mt-1 text-[0.7rem] text-neutral-500 dark:text-neutral-400">
        {agent.detail}
      </p>

      <div className="mt-2">
        <ActivityMeter
          kind={agent.meter}
          tone={agent.tone}
          progress={agent.progress}
        />
      </div>
    </article>
  );
}
