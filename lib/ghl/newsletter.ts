const GHL_API = "https://services.leadconnectorhq.com";
const NEWSLETTER_TAG = "website-newsletter";

export function newsletterConfigured() {
  return Boolean(process.env.GHL_PRIVATE_TOKEN?.trim() && process.env.GHL_LOCATION_ID?.trim());
}

function cleanEmail(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().toLowerCase().slice(0, 200);
}

export function parseNewsletterEmail(input: unknown) {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const email = cleanEmail(String(record.email ?? ""));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function ghlHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Version: "2021-07-28",
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function ghlError(response: Response) {
  const text = await response.text();
  let message = response.statusText || "request failed";
  try {
    const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) message = parsed.message;
    else if (typeof parsed.error === "string" && parsed.error.trim()) message = parsed.error;
  } catch {
    if (text.trim()) message = text.trim().slice(0, 180);
  }
  return message.replace(/pit-[a-z0-9-]+/gi, "[token]");
}

export async function subscribeNewsletter(email: string) {
  const token = process.env.GHL_PRIVATE_TOKEN?.trim() ?? "";
  const locationId = process.env.GHL_LOCATION_ID?.trim() ?? "";
  if (!token || !locationId) throw new Error("GoHighLevel is not configured.");

  const upsert = await fetch(`${GHL_API}/contacts/upsert`, {
    method: "POST",
    headers: ghlHeaders(token),
    body: JSON.stringify({
      locationId,
      email,
      source: "Website newsletter",
    }),
  });
  if (!upsert.ok) throw new Error(`upsert ${upsert.status}: ${await ghlError(upsert)}`);

  const created = (await upsert.json()) as { contact?: { id?: unknown } };
  const contactId = typeof created.contact?.id === "string" ? created.contact.id : "";
  if (!contactId) throw new Error("upsert returned no contact id");

  const tagged = await fetch(`${GHL_API}/contacts/${encodeURIComponent(contactId)}/tags`, {
    method: "POST",
    headers: ghlHeaders(token),
    body: JSON.stringify({ tags: [NEWSLETTER_TAG] }),
  });
  if (!tagged.ok) throw new Error(`tag ${tagged.status}: ${await ghlError(tagged)}`);
}
