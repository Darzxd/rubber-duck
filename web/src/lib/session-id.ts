// Short opaque session id — good enough for a hackathon shared link.
// Not signed, not validated — anyone with the string joins.
export function newSessionId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}
