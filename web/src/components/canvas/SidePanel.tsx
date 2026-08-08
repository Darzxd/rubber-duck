"use client";

import { useState } from "react";
import AgentStatusCard from "./AgentStatusCard";
import InsightCard from "./InsightCard";
import LiveSummary from "./LiveSummary";
import TranscriptLine from "./TranscriptLine";
import { ChevronRight, FilterIcon, SearchIcon } from "./icons";
import {
  SAMPLE_AGENTS,
  SAMPLE_INSIGHT,
  SAMPLE_SUMMARY,
  SAMPLE_TRANSCRIPT,
  type AgentStatus,
  type Insight,
  type SummaryCount,
  type TranscriptLine as Line,
} from "./panelData";

type TabId = "agents" | "transcript" | "activity";

type SidePanelProps = {
  agents?: AgentStatus[];
  transcript?: Line[];
  insight?: Insight | null;
  summary?: SummaryCount[];
  onHide?: () => void;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "agents", label: "Agentes" },
  { id: "transcript", label: "Transcripción" },
  { id: "activity", label: "Actividad" },
];

const ICON_BUTTON =
  "grid size-6 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white";

export default function SidePanel({
  agents = SAMPLE_AGENTS,
  transcript = SAMPLE_TRANSCRIPT,
  insight = SAMPLE_INSIGHT,
  summary = SAMPLE_SUMMARY,
  onHide,
}: SidePanelProps) {
  const [tab, setTab] = useState<TabId>("agents");

  return (
    <aside className="hidden w-[19rem] shrink-0 flex-col border-l border-neutral-200 bg-neutral-50 lg:flex dark:border-neutral-800 dark:bg-neutral-900">
      <div
        role="tablist"
        aria-label="Panel de sesión"
        className="flex shrink-0 border-b border-neutral-200 px-2 dark:border-neutral-800"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`relative flex-1 px-1 py-2.5 text-[0.68rem] font-bold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
              tab === id
                ? "text-neutral-900 dark:text-white"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            {label}
            {tab === id ? (
              <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-neutral-900 dark:bg-white" />
            ) : null}
          </button>
        ))}

        <button
          type="button"
          onClick={onHide}
          title="Ocultar panel"
          aria-label="Ocultar panel"
          className="my-auto ml-1 grid size-7 shrink-0 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3">
        {tab === "agents" ? (
          <div className="space-y-2">
            {agents.map((agent) => (
              <AgentStatusCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : null}

        {tab === "agents" || tab === "transcript" ? (
          <section className="rounded-xl border border-neutral-200 bg-white p-2.5 dark:border-neutral-700 dark:bg-neutral-800/60">
            <div className="flex items-center gap-1 px-1">
              <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-neutral-400">
                Transcripción en vivo
              </h3>
              <button
                type="button"
                aria-label="Buscar en la transcripción"
                className={`${ICON_BUTTON} ml-auto`}
              >
                <SearchIcon className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Filtrar transcripción"
                className={ICON_BUTTON}
              >
                <FilterIcon className="size-3.5" />
              </button>
            </div>

            <ul className="mt-1 divide-y divide-neutral-100 dark:divide-neutral-700/60">
              {transcript.map((line) => (
                <TranscriptLine key={line.id} line={line} />
              ))}
            </ul>

            {insight ? <InsightCard insight={insight} /> : null}
          </section>
        ) : null}

        {tab === "agents" ? (
          <LiveSummary counts={summary} />
        ) : null}

        {tab === "activity" ? (
          <section className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
            <h3 className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Actividad reciente
            </h3>
            <ul className="mt-2 space-y-2">
              {agents.map((agent) => (
                <li
                  key={agent.id}
                  className="flex items-baseline gap-2 text-[0.72rem]"
                >
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {agent.name}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {agent.state}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
