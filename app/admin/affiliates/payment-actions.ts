"use server";

import { revalidatePath } from "next/cache";
import { clearAffiliateMemo } from "@/lib/affiliate/memo";
import { redirect } from "next/navigation";
import { approveWebsitePayout, excludeTrafficSpike, keepTrafficSpike, loadMarketingEvents, markWebsitePayoutPaid } from "@/lib/affiliate/marketing-events";
import { approveAgreementPayout, markAgreementPayoutPaid } from "@/lib/affiliate/agreement-payouts";
import { notifyAffiliatePayout } from "@/lib/affiliate/payout-mail";
import { findClickSpike } from "@/lib/affiliate/traffic-review";
import { PAYMENT_CATEGORIES, defaultPaymentRates, paymentRateCents } from "@/lib/affiliate/payment-rates";
import { savePaymentRates } from "@/lib/affiliate/payment-store";
import { formatPayoutMonth, normalizePayoutPeriod, payoutAmountCents, payoutPaidAt, payoutReference } from "@/lib/affiliate/payouts";
import { adminHasFullAccess, adminSessionActor } from "@/lib/affiliate/session";

const SETTINGS = "/admin/affiliates/settings/payments";

async function requireRatesAdmin() {
  const actor = await adminSessionActor();
  if (!actor) redirect("/admin/affiliates");
  if (!adminHasFullAccess(actor)) redirect("/admin/affiliates/overview");
  return "id" in actor ? actor.id : "owner";
}

function ratesFromForm(formData: FormData) {
  const rates = defaultPaymentRates();
  for (const category of PAYMENT_CATEGORIES) {
    const cents = paymentRateCents(formData.get(`${category}Rate`));
    if (cents == null) return null;
    rates[category] = { enabled: cents > 0, rateCents: cents };
  }
  return rates;
}

export async function savePaymentRatesAction(formData: FormData) {
  const actor = await requireRatesAdmin();
  const rates = ratesFromForm(formData);
  if (!rates) redirect(`${SETTINGS}?error=rate`);
  try {
    await savePaymentRates({ rates, actor });
  } catch (error) {
    console.error("[affiliate] payment rates save failed", error instanceof Error ? error.message : "unknown");
    redirect(`${SETTINGS}?error=unavailable`);
  }
  clearAffiliateMemo();
  revalidatePath(SETTINGS);
  clearAffiliateMemo();
  revalidatePath("/admin/affiliates/records");
  redirect(`${SETTINGS}?notice=saved`);
}

function payoutRedirect(period: string, key: "notice" | "error", value: string): never {
  const params = new URLSearchParams({ month: period, [key]: value });
  redirect(`/admin/affiliates/payouts?${params.toString()}`);
}

export async function approveWebsitePayoutAction(formData: FormData) {
  await requireRatesAdmin();
  const period = String(formData.get("period") ?? "");
  let amountCents: number | null = null;
  try {
    amountCents = await approveWebsitePayout(String(formData.get("code") ?? ""), period);
  } catch (error) {
    console.error("[affiliate] website payout approve failed", error instanceof Error ? error.message : "unknown");
    payoutRedirect(period, "error", "website");
  }
  if (amountCents != null) {
    await notifyAffiliatePayout({
      code: String(formData.get("code") ?? ""),
      stage: "approved",
      label: `${formatPayoutMonth(period)} website traffic`,
      amountCents,
    });
  }
  clearAffiliateMemo();
  revalidatePath("/admin/affiliates/payouts");
  clearAffiliateMemo();
  revalidatePath("/affiliates/payouts");
  payoutRedirect(period, "notice", "website-approved");
}

export async function markWebsitePayoutPaidAction(formData: FormData) {
  await requireRatesAdmin();
  const period = String(formData.get("period") ?? "");
  const paidCents = payoutAmountCents(formData.get("amount"));
  const paidAt = payoutPaidAt(formData.get("paidOn"));
  const reference = payoutReference(formData.get("reference"));
  if (paidCents == null || !paidAt || reference == null) payoutRedirect(period, "error", "website");
  try {
    await markWebsitePayoutPaid({
      code: String(formData.get("code") ?? ""),
      period,
      paidCents,
      paidAt,
      reference,
    });
  } catch (error) {
    console.error("[affiliate] website payout paid failed", error instanceof Error ? error.message : "unknown");
    payoutRedirect(period, "error", "website");
  }
  await notifyAffiliatePayout({
    code: String(formData.get("code") ?? ""),
    stage: "sent",
    label: `${formatPayoutMonth(period)} website traffic`,
    amountCents: paidCents,
    reference,
  });
  clearAffiliateMemo();
  revalidatePath("/admin/affiliates/payouts");
  clearAffiliateMemo();
  revalidatePath("/affiliates/payouts");
  payoutRedirect(period, "notice", "website-paid");
}

export async function approveAgreementPayoutAction(formData: FormData) {
  await requireRatesAdmin();
  const period = String(formData.get("period") ?? "");
  let amountCents: number | null = null;
  try {
    amountCents = await approveAgreementPayout(String(formData.get("code") ?? ""), period);
  } catch (error) {
    console.error("[affiliate] monthly rate approve failed", error instanceof Error ? error.message : "unknown");
    payoutRedirect(period, "error", "agreement");
  }
  if (amountCents != null) {
    await notifyAffiliatePayout({
      code: String(formData.get("code") ?? ""),
      stage: "approved",
      label: `${formatPayoutMonth(period)} monthly posting rate`,
      amountCents,
    });
  }
  clearAffiliateMemo();
  revalidatePath("/admin/affiliates/payouts");
  clearAffiliateMemo();
  revalidatePath("/affiliates/payouts");
  payoutRedirect(period, "notice", "agreement-approved");
}

export async function markAgreementPayoutPaidAction(formData: FormData) {
  await requireRatesAdmin();
  const period = String(formData.get("period") ?? "");
  const paidCents = payoutAmountCents(formData.get("amount"));
  const paidAt = payoutPaidAt(formData.get("paidOn"));
  const reference = payoutReference(formData.get("reference"));
  if (paidCents == null || !paidAt || reference == null) payoutRedirect(period, "error", "agreement");
  try {
    await markAgreementPayoutPaid({
      code: String(formData.get("code") ?? ""),
      period,
      paidCents,
      paidAt,
      reference,
    });
  } catch (error) {
    console.error("[affiliate] monthly rate paid failed", error instanceof Error ? error.message : "unknown");
    payoutRedirect(period, "error", "agreement");
  }
  await notifyAffiliatePayout({
    code: String(formData.get("code") ?? ""),
    stage: "sent",
    label: `${formatPayoutMonth(period)} monthly posting rate`,
    amountCents: paidCents,
    reference,
  });
  clearAffiliateMemo();
  revalidatePath("/admin/affiliates/payouts");
  clearAffiliateMemo();
  revalidatePath("/affiliates/payouts");
  payoutRedirect(period, "notice", "agreement-paid");
}

const TRAFFIC = "/admin/affiliates/reporting";

function trafficMonth(value: unknown) {
  return normalizePayoutPeriod(value) ?? "";
}

function trafficRedirect(month: string, notice: string, extra?: Record<string, string>): never {
  const params = new URLSearchParams({ month, notice, ...extra });
  redirect(`${TRAFFIC}?${params.toString()}`);
}

function trafficFail(month: string): never {
  const params = new URLSearchParams({ month, error: "traffic" });
  redirect(`${TRAFFIC}?${params.toString()}`);
}

async function spikeHour(code: string, period: string) {
  const events = await loadMarketingEvents({ code, period });
  return findClickSpike(
    events.filter((event) => event.kind === "click" && event.payable && event.excluded !== true).map((event) => event.createdAt),
  );
}

export async function excludeTrafficAction(formData: FormData) {
  await requireRatesAdmin();
  const period = trafficMonth(formData.get("month"));
  const code = String(formData.get("code") ?? "");
  if (!period) redirect(TRAFFIC);
  try {
    const spike = await spikeHour(code, period);
    if (!spike) trafficFail(period);
    const count = await excludeTrafficSpike(code, period, spike.hour);
    clearAffiliateMemo();
  revalidatePath(TRAFFIC);
    clearAffiliateMemo();
  revalidatePath("/admin/affiliates/payouts");
    trafficRedirect(period, "excluded", { count: String(count) });
  } catch (error) {
    console.error("[affiliate] traffic exclude failed", error instanceof Error ? error.message : "unknown");
    trafficFail(period);
  }
}

export async function keepTrafficAction(formData: FormData) {
  await requireRatesAdmin();
  const period = trafficMonth(formData.get("month"));
  const code = String(formData.get("code") ?? "");
  if (!period) redirect(TRAFFIC);
  try {
    const spike = await spikeHour(code, period);
    if (!spike) trafficFail(period);
    await keepTrafficSpike(code, period, spike.hour);
  } catch (error) {
    console.error("[affiliate] traffic keep failed", error instanceof Error ? error.message : "unknown");
    trafficFail(period);
  }
  clearAffiliateMemo();
  revalidatePath(TRAFFIC);
  trafficRedirect(period, "kept");
}
