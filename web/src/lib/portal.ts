import { Portal } from "@portalsdk/core";

// Anonymous mode: the publishable key is meant to ship in the bundle, and every
// browser that opens a session link gets a stable identity without logging in.
// That is why presence needs no backend of ours — the front alone is enough.
export const portal = new Portal({
  apiKey: process.env.NEXT_PUBLIC_PORTAL_KEY ?? "",
});
