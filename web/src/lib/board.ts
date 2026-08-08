"use client";

import { useEffect, useState } from "react";

export type AgentNode = {
  id: string;
  label: string;
  topic?: string;
  author?: string;
};

const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8000";

type Payload = { event: string; content: Record<string, unknown> };

export function useBoardEvents(sessionId: string): { nodes: AgentNode[] } {
  const [nodes, setNodes] = useState<AgentNode[]>([]);

  useEffect(() => {
    const es = new EventSource(`${AGENTS_URL}/events/${sessionId}`);

    es.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data) as Payload;
        if (payload.event === "architect.draw") {
          const incoming = (payload.content.nodes ?? []) as AgentNode[];
          setNodes((prev) => [...prev, ...incoming]);
        }
        // TODO: critic.notes → notes, scribe.patch → decisions/openItems.
      } catch {
        // Ignore malformed frames — SSE is best-effort here.
      }
    };

    return () => es.close();
  }, [sessionId]);

  return { nodes };
}
