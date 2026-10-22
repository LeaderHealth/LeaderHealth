import { readFileSync } from "node:fs";
import { join } from "node:path";

export const AFFILIATE_INVITE_DAYS = 7;

export function affiliateEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.AFFILIATE_FROM_EMAIL?.trim());
}

const LOGO_CID = "leaderhealth-logo";

function logoAttachment() {
  const content = readFileSync(join(process.cwd(), "public", "images", "leaderhealth-logo.png")).toString("base64");
  return {
    filename: "leaderhealth-logo.png",
    content,
    content_type: "image/png",
    content_id: LOGO_CID,
  };
}

async function deliverAffiliateEmail(
  email: string,
  subject: string,
  text: string,
  failureLabel: string,
  html?: string,
  attachments?: ReturnType<typeof logoAttachment>[],
) {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.AFFILIATE_FROM_EMAIL?.trim() ?? "";
  if (!apiKey || !from) throw new Error("Affiliate email is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject,
      text,
      ...(html ? { html } : {}),
      ...(attachments ? { attachments } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`${failureLabel} (${response.status}).`);
  }
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function brandedEmailHtml(input: { preview: string; heading: string; body: string; note: string; button: string; url: string }) {
  const href = escapeHtml(input.url);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&amp;display=swap" rel="stylesheet" type="text/css" />
    <style type="text/css">
      @font-face {
        font-family: "Instrument Serif";
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-2zI.ttf) format("truetype");
      }
      .lh-title {
        font-family: "Instrument Serif", Georgia, "Times New Roman", serif !important;
        font-weight: 400 !important;
        font-style: normal !important;
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f7f3f5;">
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(input.preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:28px;">
            <tr>
              <td style="padding:40px 36px 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="cid:${LOGO_CID}" alt="Leader Health" width="293" height="20" style="display:block;width:293px;height:20px;border:0;" />
                    </td>
                    <td style="vertical-align:middle;padding-left:12px;">
                      <span style="display:inline-block;background:#f6d5d8;color:#e33d4d;border-radius:999px;padding:3px 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;line-height:14px;text-transform:uppercase;">Affiliates</span>
                    </td>
                  </tr>
                </table>
                <h1 class="lh-title" style="margin:0 0 16px;font-family:'Instrument Serif',Georgia,'Times New Roman',serif;font-size:36px;line-height:1.15;font-weight:400;font-style:normal;color:#321110;">${escapeHtml(input.heading)}</h1>
                <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#4a2a26;">${escapeHtml(input.body)}</p>
                <p style="margin:0 0 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#7a5a56;">${escapeHtml(input.note)}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:999px;background:#321110;">
                      <a href="${href}" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(input.button)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#7a5a56;">If the button does not open, paste this link into your browser:<br><a href="${href}" style="color:#321110;word-break:break-all;">${href}</a></p>
              </td>
            </tr>
          </table>
          <p style="max-width:560px;margin:18px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#7a5a56;">If you were not expecting this, you can ignore this email.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendAffiliateSignInEmail(email: string, url: string) {
  await deliverAffiliateEmail(
    email,
    "Your Leader Health affiliate sign-in link",
    [
      "Use this link to sign in to your Leader Health affiliate page.",
      "It expires in 15 minutes and works once.",
      "",
      url,
      "",
      "If you did not ask for this, you can ignore this email.",
    ].join("\n"),
    "Affiliate sign-in email failed",
    brandedEmailHtml({
      preview: "Sign in to your Leader Health affiliate page.",
      heading: "Sign in",
      body: "Use this link to sign in to your Leader Health affiliate page.",
      note: "It expires in 15 minutes and works once.",
      button: "Sign in",
      url,
    }),
    [logoAttachment()],
  );
}

export async function sendAffiliateWeeklySalesEmail(input: {
  email: string;
  weekLabel: string;
  orderCount: number;
  salesCents: number | null;
  commissionCents: number;
  lines: string[];
}) {
  const sales = input.salesCents == null ? "—" : formatWeeklyMoney(input.salesCents);
  await deliverAffiliateEmail(
    input.email,
    `Your Leader Health sales for ${input.weekLabel}`,
    [
      `Here are your affiliate sales for ${input.weekLabel}.`,
      "",
      `Orders: ${input.orderCount}`,
      `Sales: ${sales}`,
      `Commission: ${formatWeeklyMoney(input.commissionCents)}`,
      "",
      ...input.lines,
    ].join("\n"),
    "Affiliate weekly sales email failed",
  );
}

function formatWeeklyMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export async function sendAffiliateInvitationEmail(email: string, url: string) {
  await deliverAffiliateEmail(
    email,
    "Activate your Leader Health affiliate account",
    [
      "You are invited to the Leader Health affiliate portal.",
      "Use this link to set your password and open your dashboard.",
      `It expires in ${AFFILIATE_INVITE_DAYS} days and works once.`,
      "",
      url,
      "",
      "If you were not expecting this, you can ignore this email.",
    ].join("\n"),
    "Affiliate invitation email failed",
    brandedEmailHtml({
      preview: "Set your password and open your Leader Health affiliate dashboard.",
      heading: "You are invited",
      body: "You are invited to the Leader Health affiliate portal. Use the button below to set your password and open your dashboard.",
      note: `This link expires in ${AFFILIATE_INVITE_DAYS} days and works once.`,
      button: "Set your password",
      url,
    }),
    [logoAttachment()],
  );
}
