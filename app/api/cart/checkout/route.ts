import { NextResponse } from "next/server";
import { campaignForCheckout } from "@/lib/affiliate/checkoutCampaign";
import { affiliateCodeFromCookies } from "@/lib/affiliate/store";
import { listCheckoutProducts } from "@/lib/genhealth/catalog";
import { genHealthConfigured } from "@/lib/genhealth/client";
import { isSellableLine, UNAVAILABLE_TREATMENT } from "@/lib/cart/items";
import { cartRuleIssue } from "@/lib/cart/rules";
import {
  resolveCartHandoff,
  storefrontCheckoutUrl,
  type HandoffLine,
} from "@/lib/cart/storefrontCheckout";

export const runtime = "nodejs";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type CheckoutLine = HandoffLine & { quantity: number };

function quantityOf(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 1;
}

function parseLines(body: unknown): CheckoutLine[] | null {
  const record = body && typeof body === "object" ? (body as { items?: unknown }) : null;
  if (!record || !Array.isArray(record.items) || record.items.length === 0 || record.items.length > 30) {
    return null;
  }
  const lines: CheckoutLine[] = [];
  for (const raw of record.items) {
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Record<string, unknown>;
    const slug = text(item.slug);
    const name = text(item.name);
    if (!slug || !name) return null;
    const variant = text(item.variant);
    const clientProductId = text(item.clientProductId);
    lines.push({
      slug,
      name,
      variant: variant || undefined,
      clientProductId: clientProductId || undefined,
      quantity: quantityOf(item.quantity),
    });
  }
  return lines;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid cart." }, { status: 400 });
  }

  const lines = parseLines(body);
  if (!lines) return NextResponse.json({ ok: false, error: "Invalid cart." }, { status: 400 });
  if (lines.some((line) => !isSellableLine(line))) {
    return NextResponse.json({ ok: false, error: UNAVAILABLE_TREATMENT }, { status: 422 });
  }

  const issue = cartRuleIssue(lines);
  if (issue) return NextResponse.json({ ok: false, error: issue }, { status: 422 });

  const first = lines[0].name;
  if (!genHealthConfigured()) {
    return NextResponse.json(
      { ok: false, item: first, error: `Couldn't match ${first} to a checkout product.` },
      { status: 503 },
    );
  }

  try {
    const products = await listCheckoutProducts();
    const result = resolveCartHandoff(lines, products);
    if (!result.ok) return NextResponse.json(result, { status: 422 });
    const ref = await affiliateCodeFromCookies();
    const campaign = await campaignForCheckout(ref);
    return NextResponse.json({ ok: true, url: storefrontCheckoutUrl(result.ids, ref ?? undefined, campaign) });
  } catch {
    return NextResponse.json(
      { ok: false, item: first, error: `Couldn't match ${first} to a checkout product.` },
      { status: 502 },
    );
  }
}
