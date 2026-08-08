"use client";

import { useEffect, useRef, useState } from "react";
import { postIngest } from "./agents";
import { createRecognition, isSpeechSupported } from "./speech";

export type SessionArgs = {
  sessionId: string;
  author: string;
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

export function useSession({ sessionId, author }: SessionArgs): SessionState {
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [interim, setInterim] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    if (!isSpeechSupported()) {
      setSupported(false);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let controller: ReturnType<typeof createRecognition> = null;

    // Hold a MediaStream open alongside recognition. SpeechRecognition
    // internally cycles the audio pipeline (silence timeouts, no-speech,
    // Chrome's ~60s cap) — without a parallel stream the OS mic indicator
    // flickers on/off every restart.
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (!cancelled) setError("microphone permission denied");
        return;
      }
      if (cancelled) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      controller = createRecognition({
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

      if (!controller) {
        setSupported(false);
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      controller.start();
      setRecording(true);
    })();

    return () => {
      cancelled = true;
      controller?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      setRecording(false);
    };
  }, [sessionId, author]);

  return { supported, recording, interim, chunks, error };
}
