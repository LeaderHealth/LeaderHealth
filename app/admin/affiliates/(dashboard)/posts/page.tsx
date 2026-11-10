import type { Metadata } from "next";
import { PostReviewQueue, type ReviewCheck, type ReviewPost, type ReviewQueue, type ReviewSlide } from "@/components/affiliate/PostReviewQueue";
import { formatWhen } from "@/lib/affiliate/format";
import { DISCLOSURE_LINE, loadContentSubmissions, treatmentClaims, type ContentSubmission } from "@/lib/affiliate/post-review";
import { textHasTrackingCode } from "@/lib/affiliate/social-match";
import { loadAffiliateOverview, type AffiliateSummary } from "@/lib/affiliate/store";
import { ADMIN_ERRORS } from "../../messages";

export const metadata: Metadata = {
  title: "Post review",
  robots: { index: false, follow: false },
};
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOTICES: Record<string, string> = {
  "post-approved": "Approved. The affiliate can publish it.",
  "post-change": "Changes requested. The affiliate will see your note.",
  "post-declined": "Not approved. The affiliate will see your note.",
  "post-checked": "Link marked as checked.",
};

function queueOf(post: ContentSubmission): ReviewQueue | null {
  if (post.contentStatus === "draft" || post.contentStatus === "withdrawn") return null;
  if (post.contentStatus === "submitted") return "waiting";
  if (post.contentStatus === "revision_requested") return "changes";
  if (post.contentStatus === "rejected") return "declined";
  if (post.publicationStatus === "tracking_active") return "live";
  if (post.publicationStatus === "verification_failed") return "link";
  if (post.contentStatus === "approved") return "approved";
  return null;
}

function whenStamp(post: ContentSubmission) {
  return post.submittedAt ?? post.createdAt ?? "";
}

function waitingLabel(iso: string) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `waiting ${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `waiting ${hours}h`;
  return `waiting ${Math.round(hours / 24)}d`;
}

function joinNumbers(values: number[]) {
  if (values.length <= 1) return String(values[0] ?? "");
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`;
}

function slidesOf(post: ContentSubmission): ReviewSlide[] {
  const files = post.files.length ? post.files : [];
  const split = post.caption.split(/\n\n/).map((item) => item.trim()).filter(Boolean);
  const captions = post.slideCaptions.length === files.length
    ? post.slideCaptions
    : files.length > 1 && split.length === files.length
      ? split
      : files.length <= 1
        ? [post.caption]
        : [post.caption, ...Array(Math.max(files.length - 1, 0)).fill("")];
  return files.map((file, index) => {
    const caption = captions[index] ?? "";
    return {
      index: index + 1,
      name: file.name,
      href: `/admin/affiliates/post-file?post=${encodeURIComponent(post.id)}&slide=${index + 1}`,
      video: file.contentType.startsWith("video/"),
      caption,
      cover: index === 0 && files.length > 1,
      disclosure: caption.toLowerCase().includes(DISCLOSURE_LINE.toLowerCase()),
      tracking: textHasTrackingCode(caption, post.code),
      claims: treatmentClaims(caption),
    };
  });
}

function checksFor(slides: ReviewSlide[]): ReviewCheck[] {
  const disclosure = slides.find((slide) => slide.disclosure);
  const tracking = slides.find((slide) => slide.tracking);
  const checks: ReviewCheck[] = [
    disclosure
      ? { tone: "pass", label: `Disclosure line · slide ${disclosure.index} caption` }
      : { tone: "warn", label: "Disclosure line is missing" },
    tracking
      ? { tone: "pass", label: `Tracking link matches this affiliate · slide ${tracking.index} caption` }
      : { tone: "warn", label: "Tracking link is missing" },
    { tone: "pass", label: `${slides.length} of 20 slides · formats supported` },
  ];
  for (const slide of slides) {
    for (const claim of slide.claims) checks.push({ tone: "warn", label: `Possible treatment claim · slide ${slide.index}: “${claim}”` });
  }
  return checks;
}

function suggestedNote(slides: ReviewSlide[]) {
  const flagged = slides.filter((slide) => slide.claims.length);
  return flagged
    .map((slide) => {
      const others = slides.filter((item) => item.index !== slide.index).map((item) => item.index);
      const rest = others.length ? ` Slides ${joinNumbers(others)} are good to go.` : "";
      return `Slide ${slide.index}: please remove “${slide.claims[0]}.” We can’t make treatment claims in affiliate posts.${rest}`;
    })
    .join("\n\n");
}

function reviewPost(post: ContentSubmission, affiliate: AffiliateSummary | undefined, batchLabel: string): ReviewPost | null {
  const queue = queueOf(post);
  if (!queue) return null;
  const slides = slidesOf(post);
  if (!slides.length) return null;
  const checks = checksFor(slides);
  const video = slides.length === 1 && slides[0]?.video;
  const excerptSource = slides.find((slide) => slide.caption.trim())?.caption ?? post.caption;
  return {
    id: post.id,
    name: affiliate?.name || post.code,
    email: affiliate?.email || "",
    code: post.code,
    sent: formatWhen(whenStamp(post)),
    waiting: waitingLabel(whenStamp(post)),
    version: post.version,
    batchLabel,
    kind: slides.length > 1 ? `Carousel, ${slides.length} slides` : video ? "Single video" : "Single photo",
    kindShort: slides.length > 1 ? `Carousel · ${slides.length}` : video ? "Single video" : "Single photo",
    excerpt: excerptSource.replace(/\s+/g, " ").trim().slice(0, 72),
    flagCount: checks.filter((check) => check.tone === "warn").length,
    checksPass: checks.every((check) => check.tone === "pass"),
    slides,
    checks,
    queue,
    canDecide: queue === "waiting",
    canMark: queue === "link",
    pastHref: `/admin/affiliates/accounts?code=${encodeURIComponent(post.code)}`,
    suggestedNote: suggestedNote(slides),
  };
}

export default async function AdminPostReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; post?: string }>;
}) {
  const query = await searchParams;
  let posts: ContentSubmission[] = [];
  let affiliates: AffiliateSummary[] = [];
  let unavailable = false;
  try {
    const [loaded, overview] = await Promise.all([loadContentSubmissions(), loadAffiliateOverview()]);
    posts = loaded;
    affiliates = overview.affiliates;
  } catch {
    unavailable = true;
  }
  const byCode = new Map(affiliates.map((affiliate) => [affiliate.code, affiliate]));
  const batches = new Map<string, ContentSubmission[]>();
  for (const post of posts) {
    if (!post.batchId || post.contentStatus === "draft") continue;
    const group = batches.get(post.batchId) ?? [];
    group.push(post);
    batches.set(post.batchId, group);
  }
  for (const group of batches.values()) group.sort((left, right) => whenStamp(left).localeCompare(whenStamp(right)));
  const reviewPosts = posts
    .slice()
    .sort((left, right) => whenStamp(left).localeCompare(whenStamp(right)))
    .flatMap((post) => {
      const group = post.batchId ? batches.get(post.batchId) ?? [] : [];
      const place = group.findIndex((item) => item.id === post.id);
      const batchLabel = group.length > 1 && place >= 0 ? `${place + 1} of ${group.length} sent together` : "";
      const view = reviewPost(post, byCode.get(post.code), batchLabel);
      return view ? [view] : [];
    });
  const notice = NOTICES[query.notice ?? ""] ?? ADMIN_ERRORS[query.error ?? ""] ?? "";
  return (
    <div className="flex flex-1 flex-col">
      {unavailable ? <p className="mb-4 text-sm text-ink">Posts are unavailable right now.</p> : null}
      <PostReviewQueue posts={reviewPosts} initialId={query.post ?? ""} notice={notice} />
    </div>
  );
}
