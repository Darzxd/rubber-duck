export type TranscriptChunk = {
  sessionId: string;
  author: string;
  text: string;
  ts: number;
};

const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8000";

export async function postIngest(chunk: TranscriptChunk): Promise<void> {
  const res = await fetch(`${AGENTS_URL}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: chunk.sessionId,
      author: chunk.author,
      text: chunk.text,
      ts: chunk.ts,
    }),
  });
  if (!res.ok) {
    throw new Error(`ingest failed: ${res.status}`);
  }
}

/** Reports what the transcriber heard badly. Never reaches the Organizer —
 * it exists so the internals page can show why a sentence went missing. */
export async function postUnsure(
  sessionId: string,
  author: string,
  text: string,
  confidence: number,
): Promise<void> {
  await fetch(`${AGENTS_URL}/unsure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      author,
      text,
      confidence,
    }),
  }).catch(() => undefined);
}
