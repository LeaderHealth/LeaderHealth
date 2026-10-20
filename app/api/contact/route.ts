import { NextResponse } from "next/server";
import { contactEmailConfigured, parseContactInquiry, sendContactInquiry } from "@/lib/contact/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!contactEmailConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const inquiry = parseContactInquiry(body);
  if (!inquiry) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await sendContactInquiry(inquiry);
  } catch (error) {
    console.error("[contact] send failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
