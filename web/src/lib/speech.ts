// Minimal typing over the browser SpeechRecognition API. Not shipped in every
// browser; we feature-detect at runtime.

type SpeechRecognitionAlternative = { transcript: string; confidence: number };
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResult;
  };
};
type SpeechRecognitionErrorEvent = { error: string; message?: string };

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechSupported(): boolean {
  return getCtor() !== null;
}

export type SpeechCallbacks = {
  onFinal: (text: string) => void;
  onInterim?: (text: string) => void;
  onError?: (message: string) => void;
};

export type SpeechController = {
  start: () => void;
  stop: () => void;
};

export function createRecognition(
  callbacks: SpeechCallbacks,
  lang = "es-ES",
): SpeechController | null {
  const Ctor = getCtor();
  if (!Ctor) return null;

  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = lang;

  // Chrome stops recognition after ~60s of silence — auto-restart while the
  // controller is "on" so a long meeting keeps producing chunks.
  let wantsOn = false;

  rec.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript.trim();
      if (!text) continue;
      if (result.isFinal) callbacks.onFinal(text);
      else callbacks.onInterim?.(text);
    }
  };

  rec.onerror = (event) => {
    if (event.error === "no-speech" || event.error === "aborted") return;
    callbacks.onError?.(event.message ?? event.error);
  };

  rec.onend = () => {
    if (wantsOn) {
      try {
        rec.start();
      } catch {
        // Already started — ignore.
      }
    }
  };

  return {
    start: () => {
      wantsOn = true;
      try {
        rec.start();
      } catch {
        // Already started — ignore.
      }
    },
    stop: () => {
      wantsOn = false;
      rec.stop();
    },
  };
}
