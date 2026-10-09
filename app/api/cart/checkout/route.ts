import { NextResponse } from "next/server";
import { labs } from "@/lib/content/products";
import { listCheckoutProducts } from "@/lib/genhealth/catalog";
import { genHealthConfigured } from "@/lib/genhealth/client";
import {
  isLabSlug,
  resolveCartHandoff,
  storefrontCheckoutUrl,
  type HandoffLine,
} from "@/lib/cart/storefrontCheckout";

export const runtime = "nodejs";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseLines(body: unknown): HandoffLine[] | null {
  const record = body && typeof body === "object" ? (body as { items?: unknown }) : null;
  if (!record || !Array.isArray(record.items) || record.items.length === 0 || record.items.length > 30) {
    return null;
  }
  const lines: HandoffLine[] = [];
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

  const labSlugs = new Set(labs.map((lab) => lab.slug));
  const blocked = lines.find((line) => isLabSlug(line.slug, labSlugs));
  if (blocked) {
    return NextResponse.json(
      { ok: false, item: blocked.name, error: `${blocked.name} can't be checked out here.` },
      { status: 422 },
    );
  }

  const first = lines[0].name;
  if (!genHealthConfigured()) {
    return NextResponse.json(
      { ok: false, item: first, error: `Couldn't match ${first} to a checkout product.` },
      { status: 503 },
    );
  }

  try {
    const products = await listCheckoutProducts();
    const result = resolveCartHandoff(lines, products, labSlugs);
    if (!result.ok) return NextResponse.json(result, { status: 422 });
    return NextResponse.json({ ok: true, url: storefrontCheckoutUrl(result.ids) });
  } catch {
    return NextResponse.json(
      { ok: false, item: first, error: `Couldn't match ${first} to a checkout product.` },
      { status: 502 },
    );
  }
}
