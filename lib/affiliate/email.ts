export const AFFILIATE_INVITE_DAYS = 7;

export function affiliateEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.AFFILIATE_FROM_EMAIL?.trim());
}

async function deliverAffiliateEmail(email: string, subject: string, text: string, failureLabel: string) {
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
    }),
  });

  if (!response.ok) {
    throw new Error(`${failureLabel} (${response.status}).`);
  }
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
  );
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
  );
}
