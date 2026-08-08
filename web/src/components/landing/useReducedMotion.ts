"use client";

import { useSyncExternalStore } from "react";

let motionQuery: MediaQueryList | null = null;

function getMotionQuery() {
  motionQuery ??= window.matchMedia("(prefers-reduced-motion: reduce)");
  return motionQuery;
}

function subscribe(onChange: () => void) {
  const query = getMotionQuery();
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const read = () => getMotionQuery().matches;
/** The server can't know the preference, so it assumes motion is fine. */
const readOnServer = () => false;

/** True when the visitor asked their OS to keep animation to a minimum. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, read, readOnServer);
}
