import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/ingest") || pathname.length <= 1 || !pathname.endsWith("/")) {
    return NextResponse.next();
  }

  const url = new URL(request.url);
  url.pathname = pathname.replace(/\/+$/, "");
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|ingest|.*\\..*).*)"],
};
