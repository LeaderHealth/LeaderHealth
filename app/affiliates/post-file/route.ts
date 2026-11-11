import { NextResponse } from "next/server";
import { PostReviewError, loadContentSubmission, signedContentReadUrl, submissionFile } from "@/lib/affiliate/post-review";
import { portalAffiliateCode } from "@/lib/affiliate/session";

export const runtime = "nodejs";

function fileName(path: string, slide: number) {
  const ext = path.split(".").pop() ?? "";
  const safeExt = /^(png|jpg|webp|mp4|webm|mov)$/.test(ext) ? ext : "";
  return safeExt ? (slide > 1 ? `slide-${slide}.${safeExt}` : `post.${safeExt}`) : "post";
}

export async function GET(request: Request) {
  const code = await portalAffiliateCode();
  if (!code) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("post")?.trim() ?? "";
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    const post = await loadContentSubmission(id);
    if (!post || post.code !== code) return new NextResponse("Not found", { status: 404 });
    const requested = url.searchParams.get("slide");
    const slide = requested == null || requested === "" ? 1 : Number(requested);
    const chosen = submissionFile(post, slide);
    if (!chosen) return new NextResponse("Not found", { status: 404 });
    const signed = await signedContentReadUrl(chosen.path, fileName(chosen.path, slide), url.searchParams.get("download") === "1");
    const response = NextResponse.redirect(signed, 302);
    response.headers.set("cache-control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof PostReviewError) return new NextResponse("Not found", { status: 404 });
    console.error("[affiliate] post file failed", error instanceof Error ? error.message : "unknown");
    return new NextResponse("Unavailable", { status: 503 });
  }
}
