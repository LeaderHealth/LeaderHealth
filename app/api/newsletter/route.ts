import { NextResponse } from "next/server";
import { newsletterConfigured, parseNewsletterEmail, subscribeNewsletter } from "@/lib/ghl/newsletter";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!newsletterConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email = parseNewsletterEmail(body);
  if (!email) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await subscribeNewsletter(email);
  } catch (error) {
    console.error("[newsletter] subscribe failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
