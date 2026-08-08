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

export type TranscriptLine = {
  id: string;
  time: string;
  author: string;
  color: string;
  text: string;
};

export type Insight = {
  id: string;
  time: string;
  title: string;
  question: string;
  relatedTo: string;
};

export type SummaryCount = {
  id: string;
  label: string;
  value: number;
  tone: PanelTone;
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

export const SAMPLE_TRANSCRIPT: TranscriptLine[] = [
  {
    id: "t1",
    time: "14:32",
    author: "Dani",
    color: "#ff3b3b",
    text: "No estoy seguro de si el usuario realmente pagaría por esto…",
  },
  {
    id: "t2",
    time: "14:33",
    author: "Caro",
    color: "#12b76a",
    text: "Bueno, tenemos tres clientes que ya pagan por algo similar.",
  },
  {
    id: "t3",
    time: "14:34",
    author: "Ana",
    color: "#3b2fe0",
    text: "Entonces validemos primero con entrevistas.",
  },
];

export const SAMPLE_INSIGHT: Insight = {
  id: "i1",
  time: "14:33",
  title: "Duda detectada",
  question: "¿El usuario realmente pagaría por esto?",
  relatedTo: "Propuesta de valor",
};

export const SAMPLE_SUMMARY: SummaryCount[] = [
  { id: "ideas", label: "Ideas", value: 12, tone: "amber" },
  { id: "decisions", label: "Decisiones", value: 4, tone: "green" },
  { id: "tasks", label: "Tareas", value: 7, tone: "blue" },
  { id: "doubts", label: "Dudas", value: 2, tone: "violet" },
];
