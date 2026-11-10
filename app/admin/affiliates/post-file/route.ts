import { NextResponse } from "next/server";
import { PostReviewError, loadContentSubmission, readContentFile, submissionFile } from "@/lib/affiliate/post-review";
import { adminSessionActor } from "@/lib/affiliate/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await adminSessionActor();
  if (!actor) return new NextResponse("Unauthorized", { status: 401 });
  const id = new URL(request.url).searchParams.get("post")?.trim() ?? "";
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    const url = new URL(request.url);
    const post = await loadContentSubmission(id);
    if (!post) return new NextResponse("Not found", { status: 404 });
    const requested = url.searchParams.get("slide");
    const slide = requested == null || requested === "" ? 1 : Number(requested);
    const chosen = submissionFile(post, slide);
    if (!chosen) return new NextResponse("Not found", { status: 404 });
    const file = await readContentFile(chosen.path);
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "content-type": file.contentType,
        "content-disposition": "inline; filename=\"post\"",
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
