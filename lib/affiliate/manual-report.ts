import { affiliateEmailConfigured, sendManualReportEmail } from "./email";
import { affiliateFirestore } from "./firebase";
import { checkpointOpensAt, manualReportDue, networkConnectedForPost, trackingWindowMs, type CheckpointInput } from "./manual-checkpoint";
import { loadContentSubmissions, type ContentSubmission } from "./post-review";
import { loadSocialAccounts } from "./social-store";
import { getAffiliate } from "./store";

function checkpointInput(post: ContentSubmission, connected: boolean): CheckpointInput {
  return {
    publicationStatus: post.publicationStatus,
    publishedAt: post.publishedAt,
    metricsRecordedAt: post.metricsRecordedAt,
    metricsSource: post.metricsSource,
    connected,
    trackingDays: post.trackingDays,
  };
}

export async function remindManualReports(email: string, posts: ContentSubmission[]) {
  if (!affiliateEmailConfigured() || !email.trim() || posts.length === 0) return 0;
  const code = posts[0]?.code;
  if (!code) return 0;
  let accounts: { network: string; needsReconnect: boolean }[] = [];
  try {
    accounts = await loadSocialAccounts(code);
  } catch (error) {
    console.error("[affiliate] manual report accounts failed", error instanceof Error ? error.message : "unknown");
    return 0;
  }
  let sent = 0;
  for (const post of posts) {
    const connected = networkConnectedForPost(post.format, accounts);
    const input = checkpointInput(post, connected);
    if (!manualReportDue(input)) continue;
    const published = post.publishedAt ? Date.parse(post.publishedAt) : Number.NaN;
    if (Number.isNaN(published) || Date.now() >= published + trackingWindowMs(post.trackingDays)) continue;
    const opens = checkpointOpensAt(input);
    const emailed = post.manualReportEmailedAt ? Date.parse(post.manualReportEmailedAt) : Number.NaN;
    if (opens != null && !Number.isNaN(emailed) && emailed >= opens) continue;
    try {
      await sendManualReportEmail(email, post.postUrl, post.metricsSource === "manual" ? "update" : "first");
      await affiliateFirestore().collection("contentSubmissions").doc(post.id).update({ manualReportEmailedAt: new Date() });
      sent += 1;
    } catch (error) {
      console.error("[affiliate] manual report email failed", error instanceof Error ? error.message : "unknown");
    }
  }
  return sent;
}

export async function remindDueManualReports() {
  if (!affiliateEmailConfigured()) return 0;
  const posts = await loadContentSubmissions();
  const byCode = new Map<string, ContentSubmission[]>();
  for (const post of posts) {
    const group = byCode.get(post.code) ?? [];
    group.push(post);
    byCode.set(post.code, group);
  }
  let sent = 0;
  for (const [code, group] of byCode) {
    const affiliate = await getAffiliate(code);
    if (!affiliate?.email) continue;
    sent += await remindManualReports(affiliate.email, group);
  }
  return sent;
}
