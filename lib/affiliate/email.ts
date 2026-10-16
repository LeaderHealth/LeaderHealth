export function affiliateEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.AFFILIATE_FROM_EMAIL?.trim());
}

export async function sendAffiliateSignInEmail(email: string, url: string) {
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
      subject: "Your Leader Health affiliate sign-in link",
      text: [
        "Use this link to sign in to your Leader Health affiliate page.",
        "It expires in 15 minutes and works once.",
        "",
        url,
        "",
        "If you did not ask for this, you can ignore this email.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error(`Affiliate sign-in email failed (${response.status}).`);
  }
}
