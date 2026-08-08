export type PanelTone = "green" | "violet" | "blue" | "amber";

/** How an agent shows that it is doing something right now. */
export type MeterKind = "wave" | "progress" | "segments";

export type AgentStatus = {
  id: string;
  name: string;
  /** Short state, shown next to the name. */
  state: string;
  detail: string;
  tone: PanelTone;
  meter: MeterKind;
  /** Only read when meter is "progress". */
  progress?: number;
};

/**
 * Stand-ins until the session layer streams the real thing. The four names
 * match the agents the product actually runs.
 */
export const SAMPLE_AGENTS: AgentStatus[] = [
  {
    id: "organizer",
    name: "Organizador",
    state: "Escuchando",
    detail: "Transcripción en tiempo real",
    tone: "green",
    meter: "wave",
  },
  {
    id: "architect",
    name: "Esquemas",
    state: "Construyendo esquema",
    detail: "Tema actual: Propuesta de valor",
    tone: "green",
    meter: "progress",
    progress: 75,
  },
  {
    id: "critic",
    name: "Detector de dudas",
    state: "2 dudas pendientes",
    detail: "Analizando conversación…",
    tone: "violet",
    meter: "segments",
  },
  {
    id: "scribe",
    name: "Escriba",
    state: "Anotando",
    detail: "Decisiones, tareas y preguntas",
    tone: "blue",
    meter: "wave",
  },
];
