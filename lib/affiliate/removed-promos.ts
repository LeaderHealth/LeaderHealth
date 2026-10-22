import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";

export type RemovedPromoRow = {
  code: string;
  affiliateCodes: string[];
  orders: number;
  salesCents: number | null;
  commissionCents: number;
  clicks: number;
};

type PromoSale = {
  promoCode: string;
  affiliateCode: string;
  amountCents: number | null;
  commissionCents: number;
  dryRun?: boolean;
};

type PromoClick = {
  campaign: string;
  affiliateCode: string;
};

function promoKey(value: string) {
  return value.trim().toLowerCase();
}

export function removedPromoRows(activeCodes: readonly string[], sales: readonly PromoSale[], clicks: readonly PromoClick[]) {
  const active = new Set(activeCodes.map(promoKey).filter(Boolean));
  const rows = new Map<
    string,
    {
      code: string;
      affiliates: Set<string>;
      orders: number;
      salesCents: number;
      salesKnown: boolean;
      commissionCents: number;
      clicks: number;
    }
  >();

  function bucket(raw: string) {
    const code = raw.trim();
    const id = promoKey(code);
    if (!id || id.length > 80 || active.has(id)) return null;
    const current = rows.get(id);
    if (current) return current;
    const created = {
      code,
      affiliates: new Set<string>(),
      orders: 0,
      salesCents: 0,
      salesKnown: false,
      commissionCents: 0,
      clicks: 0,
    };
    rows.set(id, created);
    return created;
  }

  for (const sale of sales) {
    if (sale.dryRun) continue;
    const row = bucket(sale.promoCode);
    if (!row) continue;
    row.orders += 1;
    row.commissionCents += Math.max(0, Math.round(sale.commissionCents || 0));
    if (typeof sale.amountCents === "number" && Number.isFinite(sale.amountCents)) {
      row.salesKnown = true;
      row.salesCents += sale.amountCents;
    }
    const affiliate = sale.affiliateCode.trim();
    if (affiliate) row.affiliates.add(affiliate);
  }

  for (const click of clicks) {
    if (promoKey(click.campaign) === promoKey(click.affiliateCode)) continue;
    const row = bucket(click.campaign);
    if (!row) continue;
    row.clicks += 1;
    const affiliate = click.affiliateCode.trim();
    if (affiliate) row.affiliates.add(affiliate);
  }

  return [...rows.values()]
    .map((row) => ({
      code: row.code,
      affiliateCodes: [...row.affiliates].sort((left, right) => left.localeCompare(right)),
      orders: row.orders,
      salesCents: row.salesKnown ? row.salesCents : null,
      commissionCents: row.commissionCents,
      clicks: row.clicks,
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function loadRemovedPromoRows(activeCodes: readonly string[]) {
  if (!affiliateFirebaseConfigured()) return [];
  const db = affiliateFirestore();
  const [conversions, clicks] = await Promise.all([db.collection("conversions").get(), db.collection("clicks").get()]);
  return removedPromoRows(
    activeCodes,
    conversions.docs.map((doc) => {
      const data = doc.data();
      return {
        promoCode: text(data.promoCode),
        affiliateCode: text(data.code),
        amountCents: typeof data.amountCents === "number" ? data.amountCents : null,
        commissionCents: typeof data.commissionCents === "number" ? data.commissionCents : 0,
        dryRun: data.dryRun === true,
      };
    }),
    clicks.docs.map((doc) => {
      const data = doc.data();
      return { campaign: text(data.campaign), affiliateCode: text(data.code) };
    }),
  );
}
