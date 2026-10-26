import { PORTAL_URL } from "@/lib/content/site";

const PORTAL_HOST = new URL(PORTAL_URL).hostname;

/** Accept only a https link on the patient-portal host. The checkout app rewrites the magic link before posting it. */
export function portalHandoffUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.hostname !== PORTAL_HOST) return null;
  return url.toString();
}
