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

    const controller = createRecognition({
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
      return;
    }

    controller.start();
    setRecording(true);

    return () => {
      controller.stop();
      setRecording(false);
    };
  }, [sessionId, author]);

  return { supported, recording, interim, chunks, error };
}
