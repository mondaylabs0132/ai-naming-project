import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // TODO: 세션 검사 후 없으면 /login redirect
  return NextResponse.next();
}

export const config = {
  matcher: ["/mypage/:path*"],
};
