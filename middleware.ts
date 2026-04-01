import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Dev-only tooling (e.g. `/dev/leads`). Block in production so shared public URLs do not expose admin-style pages. */
export function middleware(_request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/dev/:path*",
};
