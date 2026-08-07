// Shared contract between `web` and `agents`.
// This is the ONLY file both apps import from. Keep it dependency-free.

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

export type WsEvent =
  | { type: "agent.message"; payload: AgentMessage }
  | { type: "agent.response"; payload: AgentResponse }
  | { type: "error"; payload: { message: string } };
