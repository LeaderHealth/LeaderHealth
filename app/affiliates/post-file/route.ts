import { NextResponse } from "next/server";
import { PostReviewError, loadContentSubmission, readContentFile, submissionFile } from "@/lib/affiliate/post-review";
import { portalAffiliateCode } from "@/lib/affiliate/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const code = await portalAffiliateCode();
  if (!code) return new NextResponse("Unauthorized", { status: 401 });
  const id = new URL(request.url).searchParams.get("post")?.trim() ?? "";
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    const post = await loadContentSubmission(id);
    if (!post || post.code !== code) return new NextResponse("Not found", { status: 404 });
    const url = new URL(request.url);
    const requested = url.searchParams.get("slide");
    const slide = requested == null || requested === "" ? 1 : Number(requested);
    const chosen = submissionFile(post, slide);
    if (!chosen) return new NextResponse("Not found", { status: 404 });
    const file = await readContentFile(chosen.path);
    const download = url.searchParams.get("download") === "1";
    const ext = chosen.path.split(".").pop() ?? "";
    const safeExt = /^(png|jpg|webp|mp4|webm|mov)$/.test(ext) ? ext : "";
    const filename = safeExt ? (slide > 1 ? `slide-${slide}.${safeExt}` : `post.${safeExt}`) : "post";
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "content-type": file.contentType,
        "content-disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof PostReviewError) return new NextResponse("Not found", { status: 404 });
    console.error("[affiliate] post file failed", error instanceof Error ? error.message : "unknown");
    return new NextResponse("Unavailable", { status: 503 });
  }
}
