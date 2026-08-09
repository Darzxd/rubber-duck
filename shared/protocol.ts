// Shared contract between `web` and `agents`.
// Wire format of the SSE events and the ops the Architect emits. Kept in one
// place so the Python side and the TypeScript side never drift.

export type AgentId = string;
export type SessionId = string;

export interface AgentMessage {
  id: string;
  sessionId: SessionId;
  agentId: AgentId;
  role: "user" | "agent" | "system";
  content: string;
  createdAt: string; // ISO 8601
}

export interface AgentRequest {
  sessionId: SessionId;
  agentId: AgentId;
  input: string;
}

export interface AgentResponse {
  sessionId: SessionId;
  agentId: AgentId;
  output: string;
  done: boolean;
}

// The kinds of thing the Architect can put on the board.
export type NodeKind = "idea" | "decision" | "tarea" | "duda";

// The agents that draw on the pizarra. The Scribe writes to a side list, so it
// is not one of these.
export type KnownAgent = "architect" | "critic";

// The Architect works through tool calls. Each call turns into one op on the
// wire and one visible change on the board. The op names match the six the
// project committed to in CLAUDE.md, plus `titular_columna` for group titles.
//
// Every op carries the pixel position the frontend needs to draw it. The model
// never sees pixels — the backend maintains layout and fills them in.
export type ArchitectOp =
  | {
      type: "crear_nodo";
      id: string;
      texto: string;
      columna: number;
      kind: NodeKind;
      x: number;
      y: number;
    }
  | {
      type: "editar_nodo";
      id: string;
      texto: string;
    }
  | {
      type: "mover_nodo";
      id: string;
      columna: number;
      x: number;
      y: number;
    }
  | {
      type: "conectar";
      id: string;
      de: string;
      a: string;
      label?: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }
  | {
      type: "pegar_nota";
      id: string;
      nodo_id: string;
      texto: string;
      autor?: string;
      x: number;
      y: number;
    }
  | {
      type: "borrar";
      id: string;
    }
  | {
      type: "titular_columna";
      columna: number;
      titulo: string;
      x: number;
      y: number;
    };

// Where an agent's cursor is right now, so the pizarra can show it moving from
// one spot to the next as the ops land. Emitted just before each op.
export interface AgentCursor {
  agent: KnownAgent;
  x: number;
  y: number;
  // What the agent is about to do at that spot. The pizarra can use it to pick
  // a matching cursor icon (pen when writing, hand when moving).
  action?: "writing" | "moving" | "connecting" | "annotating" | "erasing";
}

export type WsEvent =
  | { type: "agent.message"; payload: AgentMessage }
  | { type: "agent.response"; payload: AgentResponse }
  | { type: "architect.op"; payload: { revision: number; op: ArchitectOp } }
  | { type: "agent.cursor"; payload: AgentCursor }
  | { type: "error"; payload: { message: string } };
