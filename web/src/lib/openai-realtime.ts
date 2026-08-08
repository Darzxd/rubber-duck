"use client";

// Browser client for OpenAI Realtime transcription. Uses WebRTC directly
// against api.openai.com — audio track sends the mic; a data channel
// receives transcription events. The ephemeral client_secret is minted by
// our backend so the real OPENAI_API_KEY never touches the browser.

export type RealtimeCallbacks = {
  onFinal: (text: string) => void;
  onInterim?: (text: string) => void;
  /** Heard with low confidence. Still passed on, only flagged. */
  onUnsure?: (text: string, avgLogprob: number) => void;
  onError?: (message: string) => void;
};

export const MIC_CONSTRAINTS: MediaStreamConstraints = { audio: true };

export type RealtimeController = {
  stop: () => void;
};

const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8000";

const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime/calls";

type SessionResponse = {
  value?: string;
  client_secret?: { value?: string };
};

type Logprob = { token: string; logprob: number };

type RealtimeEvent = {
  type: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  logprobs?: Logprob[];
  error?: { message?: string };
};

// Invented text scores worse than heard text. Nothing is dropped on this —
// it only flags a segment on the internals page so we can see whether a real
// cutoff is worth having.
const SUSPICIOUS_AVG_LOGPROB = -0.9;

function confidence(logprobs?: Logprob[]): number | null {
  if (!logprobs?.length) return null;
  const total = logprobs.reduce((sum, l) => sum + l.logprob, 0);
  return total / logprobs.length;
}

export async function startRealtimeTranscription(
  stream: MediaStream,
  callbacks: RealtimeCallbacks,
): Promise<RealtimeController> {
  // Whatever tuning is in the page URL goes straight to the mint, so two tabs
  // can run different sensitivities side by side.
  const tuning = new URLSearchParams();
  const pageParams = new URLSearchParams(window.location.search);
  for (const key of ["vad", "eagerness", "silence_ms"]) {
    const value = pageParams.get(key);
    if (value) tuning.set(key, value);
  }
  const query = tuning.toString();

  const sessionRes = await fetch(
    `${AGENTS_URL}/realtime-session${query ? `?${query}` : ""}`,
    { method: "POST" },
  );
  if (!sessionRes.ok) {
    throw new Error(`realtime session mint failed: ${sessionRes.status}`);
  }
  const session = (await sessionRes.json()) as SessionResponse;
  const clientSecret = session.value ?? session.client_secret?.value;
  if (!clientSecret) {
    throw new Error("no ephemeral key in realtime session response");
  }

  const pc = new RTCPeerConnection();
  const [track] = stream.getAudioTracks();
  if (!track) {
    throw new Error("no audio track on stream");
  }
  pc.addTrack(track, stream);

  const dc = pc.createDataChannel("oai-events");
  // Buffer partials per item so we can emit a growing interim string.
  const interimByItem = new Map<string, string>();

  dc.addEventListener("message", (e: MessageEvent<string>) => {
    let event: RealtimeEvent;
    try {
      event = JSON.parse(e.data) as RealtimeEvent;
    } catch {
      return;
    }
    switch (event.type) {
      case "conversation.item.input_audio_transcription.delta": {
        const itemId = event.item_id ?? "_";
        const prev = interimByItem.get(itemId) ?? "";
        const next = prev + (event.delta ?? "");
        interimByItem.set(itemId, next);
        callbacks.onInterim?.(next);
        break;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const itemId = event.item_id ?? "_";
        interimByItem.delete(itemId);
        const text = (event.transcript ?? "").trim();
        if (!text) break;

        const avg = confidence(event.logprobs);
        if (avg !== null && avg < SUSPICIOUS_AVG_LOGPROB) {
          callbacks.onUnsure?.(text, avg);
        }
        callbacks.onFinal(text);
        break;
      }
      case "error": {
        callbacks.onError?.(event.error?.message ?? "realtime error");
        break;
      }
    }
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sdpRes = await fetch(OPENAI_REALTIME_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/sdp",
    },
    body: offer.sdp,
  });
  if (!sdpRes.ok) {
    const body = await sdpRes.text().catch(() => "");
    throw new Error(`realtime SDP exchange failed: ${sdpRes.status} ${body}`);
  }
  const answerSdp = await sdpRes.text();
  await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

  return {
    stop: () => {
      try {
        dc.close();
      } catch {
        // ignore
      }
      try {
        pc.close();
      } catch {
        // ignore
      }
    },
  };
}
