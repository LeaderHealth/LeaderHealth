const TO = "support@myleaderhealth.com";
const SUBJECT = "New Contact Form Submission – LeaderHealth";

export function contactEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function contactFrom() {
  const configured = process.env.CONTACT_FROM_EMAIL?.trim() ?? "";
  if (!configured) return "LeaderHealth Website <support@myleaderhealth.com>";
  if (configured.includes("<")) return configured;
  return `LeaderHealth Website <${configured}>`;
}

function clean(value: string, max: number) {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanMessage(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, 4000);
}

export function parseContactInquiry(input: unknown) {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const name = clean(String(record.name ?? ""), 120);
  const email = clean(String(record.email ?? ""), 200);
  const subject = clean(String(record.subject ?? ""), 200);
  const message = cleanMessage(String(record.message ?? ""));
  if (!name || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return { name, email, subject, message };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendContactInquiry(inquiry: { name: string; email: string; subject: string; message: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = contactFrom();
  if (!apiKey || !from) throw new Error("Contact email is not configured.");

  const text = [
    "A new inquiry has been submitted through the LeaderHealth website's Contact Us form.",
    "",
    `Full Name: ${inquiry.name}`,
    "",
    `Email Address: ${inquiry.email}`,
    "",
    `Subject of Interest: ${inquiry.subject}`,
    "",
    "How May We Assist You?",
    inquiry.message,
    "",
    "This is an automated notification from the LeaderHealth website.",
  ].join("\n");

  const html = [
    "<p>A new inquiry has been submitted through the LeaderHealth website's Contact Us form.</p>",
    `<p><strong>Full Name:</strong> ${escapeHtml(inquiry.name)}</p>`,
    `<p><strong>Email Address:</strong> ${escapeHtml(inquiry.email)}</p>`,
    `<p><strong>Subject of Interest:</strong> ${escapeHtml(inquiry.subject)}</p>`,
    `<p><strong>How May We Assist You?</strong><br>${escapeHtml(inquiry.message).replaceAll("\n", "<br>")}</p>`,
    "<p>This is an automated notification from the LeaderHealth website.</p>",
  ].join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [process.env.CONTACT_TO_EMAIL?.trim() || TO],
      reply_to: inquiry.email,
      subject: SUBJECT,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Contact email failed (${response.status}).`);
  }
}
