import { createHash } from "node:crypto";
import { absoluteUrl } from "@/lib/seo/schema";
import { listSubAdmins } from "./admins";
import { normalizeAffiliateEmail } from "./code";
import { affiliateEmailConfigured, sendTrafficSpikeEmail } from "./email";
import { affiliateFirebaseConfigured, affiliateFirestore } from "./firebase";
import { loadMarketingEvents, loadTrafficKeeps } from "./marketing-events";
import { listAffiliateChoices } from "./marketing-store";
import { adminAccountEmail, safeAdminNext } from "./session";
import { trafficReview } from "./traffic-review";

function noticeId(code: string, hour: string, email: string) {
  return createHash("sha256").update(`spike|${code}|${hour}|${email}`).digest("base64url").slice(0, 48);
}

export function trafficReviewUrl(period: string, code: string) {
  const next = safeAdminNext(`/admin/affiliates/reporting?month=${period}&review=${encodeURIComponent(code)}`);
  return absoluteUrl(`/admin/affiliates?next=${encodeURIComponent(next)}`);
}

async function claimNotice(code: string, hour: string, email: string) {
  const db = affiliateFirestore();
  const ref = db.collection("trafficSpikeNotices").doc(noticeId(code, hour, email));
  const claimed = await db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);
    if (existing.exists) return false;
    tx.set(ref, { code, hour, email, sentAt: new Date() });
    return true;
  });
  return { ref, claimed };
}

async function reviewerEmails() {
  const emails = new Set<string>();
  const owner = adminAccountEmail();
  if (owner) emails.add(owner);
  try {
    const admins = await listSubAdmins();
    for (const admin of admins) {
      if (!admin.active || admin.invitePending || admin.role !== "admin") continue;
      const email = normalizeAffiliateEmail(admin.email);
      if (email) emails.add(email);
    }
  } catch (error) {
    console.error("[affiliate] spike reviewer list failed", error instanceof Error ? error.message : "unknown");
  }
  return [...emails];
}

export async function deliverTrafficSpikeNotices(now = new Date()) {
  if (!affiliateFirebaseConfigured() || !affiliateEmailConfigured()) return 0;
  const period = now.toISOString().slice(0, 7);
  const today = now.toISOString().slice(0, 10);
  const [affiliates, events, keeps, reviewers] = await Promise.all([
    listAffiliateChoices(),
    loadMarketingEvents({ period }),
    loadTrafficKeeps(period),
    reviewerEmails(),
  ]);
  if (reviewers.length === 0) return 0;
  const flagged = trafficReview({ period, today, affiliates, events, keeps }).rows.filter((row) => row.status === "flagged" && row.spikeHour);
  let sent = 0;
  for (const row of flagged) {
    for (const email of reviewers) {
      const notice = await claimNotice(row.code, row.spikeHour, email);
      if (!notice.claimed) continue;
      try {
        await sendTrafficSpikeEmail({
          email,
          name: row.name,
          detail: row.spikeLabel,
          url: trafficReviewUrl(period, row.code),
        });
        sent += 1;
      } catch (error) {
        await notice.ref.delete().catch(() => undefined);
        console.error("[affiliate] traffic spike email failed", row.code, error instanceof Error ? error.message : "unknown");
      }
    }
  }
  return sent;
}
