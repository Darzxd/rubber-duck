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

/** Why the repo could not be read, in the words the card acts on. */
export type RepoRefusal =
  | "needs_token"
  | "bad_token"
  | "not_found"
  | "rate_limited"
  | "bad_url"
  | "unreachable";

export type ConnectRepoResult =
  | { ok: true }
  | { ok: false; reason: RepoRefusal };

/** Hands the repo to the agents. The token, if there is one, is used for this
 * one call: it is not kept here, not put in the URL, and not logged. */
export async function connectRepo(
  sessionId: string,
  url: string,
  token = "",
): Promise<ConnectRepoResult> {
  let data: { ok?: boolean; reason?: string };
  try {
    const res = await fetch(`${AGENTS_URL}/repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, url, token }),
    });
    data = (await res.json()) as { ok?: boolean; reason?: string };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
  if (data.ok) return { ok: true };
  const reason = data.reason as RepoRefusal | undefined;
  return { ok: false, reason: reason ?? "unreachable" };
}

export async function postBrief(
  sessionId: string,
  brief: string,
): Promise<void> {
  const res = await fetch(`${AGENTS_URL}/brief`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, brief }),
  });
  if (!res.ok) {
    throw new Error(`brief failed: ${res.status}`);
  }
}
