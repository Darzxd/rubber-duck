"use client";

// Browser client for OpenAI Realtime transcription. Uses WebRTC directly
// against api.openai.com — audio track sends the mic; a data channel
// receives transcription events. The ephemeral client_secret is minted by
// our backend so the real OPENAI_API_KEY never touches the browser.
//
// The model is gpt-live-transcribe: it emits deltas while the person is
// still talking, and accepts no server-side turn detection at all. Closing a
// turn is therefore our job — see the silence watcher below.

export type RealtimeCallbacks = {
  /** A turn closed. This is what reaches the agents. */
  onFinal: (text: string) => void;
  /** Text so far for the turn being spoken. Fires several times a second. */
  onInterim?: (text: string) => void;
  onError?: (message: string) => void;
};

export const MIC_CONSTRAINTS: MediaStreamConstraints = { audio: true };

export type RealtimeController = {
  stop: () => void;
};

const AGENTS_URL =
  process.env.NEXT_PUBLIC_AGENTS_URL ?? "http://localhost:8000";

const OPENAI_REALTIME_URL = "https://api.openai.com/v1/realtime/calls";

// How quiet, and for how long, counts as the end of a turn. Short enough that
// the board reacts inside the 3s budget, long enough to survive the pause
// somebody takes mid-sentence to think.
const SILENCE_RMS = 0.012;
const SILENCE_MS = 700;
const SILENCE_POLL_MS = 100;

type SessionResponse = {
  value?: string;
  client_secret?: { value?: string };
};

type RealtimeEvent = {
  type: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  error?: { message?: string };
};

/** Watches the mic and calls back once the speaker has gone quiet. */
function watchSilence(stream: MediaStream, onSilence: () => void) {
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(analyser);

  const buf = new Float32Array(analyser.fftSize);
  let quietFor = 0;
  let fired = true; // nothing said yet, so nothing to close

  const timer = setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    const rms = Math.sqrt(sum / buf.length);

    if (rms > SILENCE_RMS) {
      quietFor = 0;
      fired = false;
      return;
    }
    quietFor += SILENCE_POLL_MS;
    if (!fired && quietFor >= SILENCE_MS) {
      fired = true;
      onSilence();
    }
  }, SILENCE_POLL_MS);

  return () => {
    clearInterval(timer);
    void ctx.close().catch(() => undefined);
  };
}

export async function startRealtimeTranscription(
  stream: MediaStream,
  callbacks: RealtimeCallbacks,
): Promise<RealtimeController> {
  const sessionRes = await fetch(`${AGENTS_URL}/realtime-session`, {
    method: "POST",
  });
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
  // Buffer partials per item: the docs warn that ordering across turns is not
  // guaranteed, so everything reconciles by item_id.
  const interimByItem = new Map<string, string>();

  // What the model has emitted for the current turn but has not closed. If a
  // commit never lands, this is still the truth of what was said.
  let openText = "";

  const flush = () => {
    const text = openText.trim();
    openText = "";
    interimByItem.clear();
    if (text) callbacks.onFinal(text);
  };

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
        interimByItem.set(itemId, prev + (event.delta ?? ""));
        openText = [...interimByItem.values()].join(" ").trim();
        callbacks.onInterim?.(openText);
        break;
      }
      case "conversation.item.input_audio_transcription.completed": {
        const itemId = event.item_id ?? "_";
        interimByItem.set(itemId, (event.transcript ?? "").trim());
        openText = [...interimByItem.values()].join(" ").trim();
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

  const stopWatching = watchSilence(stream, () => {
    // Ask the server to close the turn, then hand over what we have. The
    // commit is best effort: over WebRTC the audio never went through the
    // input buffer, so the server may ignore it. The flush is what we rely on.
    if (dc.readyState === "open") {
      try {
        dc.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      } catch {
        // ignore
      }
    }
    flush();
  });

  return {
    stop: () => {
      stopWatching();
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
