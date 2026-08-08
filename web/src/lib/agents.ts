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
