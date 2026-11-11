import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { acknowledgeDisclosureAction } from "../../compliance-actions";
import { PostsHub, type HubPost } from "@/components/affiliate/PostsHub";
import { disclosureAcknowledged } from "@/lib/affiliate/disclosures";
import { formatWhen } from "@/lib/affiliate/format";
import { affiliateTrackingLink } from "@/lib/affiliate/link";
import { DISCLOSURE_LINE, instagramCheckCopy, instagramLinkChecks, loadContentSubmissions, metricLines, type ContentSubmission } from "@/lib/affiliate/post-review";
import { currentAffiliate } from "../../current";

export const metadata: Metadata = {
  title: "Posts",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-medium text-white hover:bg-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const postErrors: Record<string, string> = {
  acknowledge: "Confirm the sponsorship disclosure before continuing.",
  invalid: "Add a caption and a picture or video.",
  disclosure: "Include “Paid partnership with Leader Health” in the caption.",
  link: "Put your tracking link in the caption. A link in your bio is not enough.",
  url: "Paste a full https://www.instagram.com/p/ or /reel/ link.",
  file: "Use a PNG, JPEG, or WebP image under 8 MB, or an MP4, MOV, or WebM reel under 100 MB.",
  storage: "Post storage is not set up. Set FIREBASE_STORAGE_BUCKET.",
  status: "That post can no longer be changed that way.",
  unavailable: "That could not be saved right now.",
};

const notices: Record<string, string> = {
  acknowledged: "Disclosure acknowledged.",
  post: "Sent for review. We’ll email you when it’s approved.",
  revised: "Sent back for review. We’ll email you when it’s approved.",
  tracked: "Your post is live.",
  check: "We could not confirm that Instagram post.",
  withdrawn: "Post withdrawn.",
  drafts: "Drafts saved.",
};

function formatDay(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function titleOf(caption: string) {
  const lines = caption
    .split("\n")
    .map((part) => part.trim())
    .filter(Boolean);
  const line = lines.find((part) => part.toLowerCase() !== DISCLOSURE_LINE.toLowerCase() && !/^https?:\/\//i.test(part));
  const chosen = line || lines.find((part) => !/^https?:\/\//i.test(part)) || "";
  if (!chosen) return "Untitled post";
  return chosen.length > 80 ? `${chosen.slice(0, 77)}...` : chosen;
}

function excerptOf(caption: string) {
  const line = caption.replace(/\s+/g, " ").trim();
  if (!line) return "Untitled post";
  return line.length > 64 ? `${line.slice(0, 61)}...` : line;
}

function historyFor(post: ContentSubmission): HubPost["history"] {
  const when = (value: string | null) => (value ? formatWhen(value) : "");
  if (post.contentStatus === "draft") return [{ label: "Draft, not sent yet", when: when(post.createdAt), note: "", tone: "neutral" }];
  const events: HubPost["history"] = [{ label: "You sent it for review", when: when(post.createdAt), note: "", tone: "neutral" }];
  if (post.contentStatus === "revision_requested") events.push({ label: "Changes requested", when: when(post.reviewedAt), note: post.reviewNote, tone: "bad" });
  if (post.contentStatus === "rejected") events.push({ label: "Not approved", when: when(post.reviewedAt), note: post.reviewNote, tone: "bad" });
  if (post.contentStatus === "withdrawn") events.push({ label: "You withdrew it", when: when(post.reviewedAt), note: "", tone: "neutral" });
  if (post.contentStatus === "approved") events.push({ label: "Approved", when: when(post.reviewedAt), note: "", tone: "neutral" });
  if (post.postUrl) events.push({ label: "You added the Instagram link", when: "", note: post.postUrl, tone: "neutral" });
  if (post.publicationStatus === "tracking_active") events.push({ label: "Live. Disclosure and tracking link found", when: "", note: "", tone: "good" });
  if (post.publicationStatus === "verification_failed") events.push({ label: "The Instagram check needs a fix", when: "", note: post.verificationNote, tone: "bad" });
  return events;
}

function captionsForSlides(post: ContentSubmission, count: number) {
  if (post.slideCaptions.length === count) return post.slideCaptions;
  const split = post.caption.split(/\n\n/).map((item) => item.trim()).filter(Boolean);
  if (count > 1 && split.length === count) return split;
  if (count <= 1) return [post.caption];
  return [post.caption, ...Array.from({ length: Math.max(count - 1, 0) }, () => "")];
}

function hubPost(post: ContentSubmission): HubPost {
  const copy = instagramCheckCopy(post.publicationStatus, post.verificationNote);
  const files = post.files.length ? post.files : post.filePath ? [{ path: post.filePath, contentType: post.contentType }] : [];
  const captions = captionsForSlides(post, files.length);
  return {
    id: post.id,
    title: titleOf(post.caption),
    excerpt: excerptOf(post.caption),
    caption: post.caption,
    status: post.contentStatus,
    publication: post.publicationStatus,
    sent: formatDay(post.createdAt),
    reviewNote: post.reviewNote,
    postUrl: post.postUrl,
    fileHref: `/affiliates/post-file?post=${encodeURIComponent(post.id)}`,
    downloadHref: `/affiliates/post-file?post=${encodeURIComponent(post.id)}&download=1`,
    hasFile: Boolean(post.filePath),
    media: post.contentType.startsWith("video/") ? "video" : "photo",
    slides: files.map((file, index) => ({
      href: `/affiliates/post-file?post=${encodeURIComponent(post.id)}&slide=${index + 1}`,
      downloadHref: `/affiliates/post-file?post=${encodeURIComponent(post.id)}&slide=${index + 1}&download=1`,
      media: file.contentType.startsWith("video/") ? "video" as const : "photo" as const,
      caption: captions[index] ?? "",
    })),
    checks: instagramLinkChecks(post.publicationStatus, post.verificationNote),
    headline: copy.headline,
    detail: copy.detail,
    metrics: post.publicationStatus === "tracking_active" ? metricLines(post) : [],
    history: historyFor(post),
    batchId: post.batchId,
    mediaKey: (post.files.length ? post.files : []).map((file) => file.name || file.path).join("\n"),
  };
}

export default async function AffiliatePostsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const affiliate = await currentAffiliate();
  if (!affiliate) redirect("/affiliates");
  const query = await searchParams;
  const acknowledged = await disclosureAcknowledged(affiliate.code).catch(() => false);
  let posts: ContentSubmission[] = [];
  let postsUnavailable = false;
  if (acknowledged) {
    try {
      posts = await loadContentSubmissions(affiliate.code);
    } catch {
      postsUnavailable = true;
    }
  }
  const error = query.error ? (postErrors[query.error] ?? "") : "";
  const notice = notices[query.notice ?? ""] ?? "";

  return (
    <div className="min-w-0 rounded-[28px] bg-white p-4 sm:p-8">
      {error ? (
        <p role="alert" className="mb-4 rounded-2xl bg-rose px-4 py-3 text-sm text-ink">
          {error}
        </p>
      ) : null}
      {acknowledged ? null : (
        <>
          <h2 className="text-2xl">Posts</h2>
          {notice ? <p role="status" className="mt-4 rounded-2xl bg-background px-4 py-3 text-sm text-ink">{notice}</p> : null}
        <form action={acknowledgeDisclosureAction} className="mt-6">
          <input type="hidden" name="next" value="posts" />
          <h3 className="text-lg">Sponsorship agreement</h3>
          <p className="mt-2 max-w-2xl text-sm text-brown">Put “Paid partnership with Leader Health” and your tracking link in the caption. A link in your bio is not enough.</p>
          <label className="mt-4 flex items-start gap-3 text-sm text-ink">
            <input name="acknowledge" type="checkbox" required className="mt-1 size-4 accent-ink" />
            <span>I will include a clear sponsorship disclosure on posts and videos I publish for Leader Health, and I will send each new post for review before I publish it, with my tracking link in the caption.</span>
          </label>
          <button type="submit" className={`${buttonClass} mt-4`}>
            Acknowledge
          </button>
        </form>
        </>
      )}
      {acknowledged && postsUnavailable ? <p className="text-sm text-ink">Posts are unavailable right now.</p> : null}
      {acknowledged && !postsUnavailable ? (
        <PostsHub
          posts={posts.map(hubPost)}
          trackingUrl={affiliateTrackingLink(affiliate.code)}
          disclosureLine={DISCLOSURE_LINE}
          affiliateCode={affiliate.code}
          email={affiliate.email}
          notice={notice}
          noticeTone={query.notice === "check" ? "warn" : "ok"}
        />
      ) : null}
    </div>
  );
}
