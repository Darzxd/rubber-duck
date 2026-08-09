"use client";

import { useEffect, useRef, useState } from "react";
import { postIngest } from "./agents";
import {
  MIC_CONSTRAINTS,
  startRealtimeTranscription,
  type RealtimeController,
} from "./openai-realtime";

export type SessionArgs = {
  sessionId: string;
  author: string;
  /** Turning this off tears the microphone down; a closed session stops here. */
  enabled?: boolean;
};

export type Chunk = {
  id: string;
  author: string;
  text: string;
  ts: number;
};

export type SessionState = {
  supported: boolean;
  recording: boolean;
  interim: string;
  chunks: Chunk[];
  error: string | null;
};

export function useSession({
  sessionId,
  author,
  enabled = true,
}: SessionArgs): SessionState {
  const [supported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let controller: RealtimeController | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
      } catch {
        if (!cancelled) setError("microphone permission denied");
        return;
      }
      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      try {
        controller = await startRealtimeTranscription(stream, {
          onInterim: (text) => setInterim(text),
          onFinal: (text) => {
            const chunk: Chunk = {
              id: `${Date.now()}-${seqRef.current++}`,
              author,
              text,
              ts: Date.now() / 1000,
            };
            setInterim("");
            setChunks((prev) => [...prev.slice(-49), chunk]);
            void postIngest({
              sessionId,
              author,
              text: chunk.text,
              ts: chunk.ts,
            }).catch((e: unknown) => {
              setError(e instanceof Error ? e.message : "ingest failed");
            });
          },
          onError: (message) => setError(message),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "transcription failed");
        }
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (cancelled) {
        controller?.stop();
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      setRecording(true);
    })();

    return () => {
      cancelled = true;
      controller?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      setRecording(false);
    };
  }, [sessionId, author, enabled]);

  return { supported, recording, interim, chunks, error };
}
