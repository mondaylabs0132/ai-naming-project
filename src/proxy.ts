import { type NextRequest } from "next/server";
import {
  isUuid,
  VISITOR_ID_COOKIE,
  VISITOR_ID_MAX_AGE_SECONDS,
} from "./lib/free-usage/visitor";
import { updateSession } from "./lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  let visitorId = request.cookies.get(VISITOR_ID_COOKIE)?.value;

  if (!isUuid(visitorId)) {
    visitorId = crypto.randomUUID();
    request.cookies.set(VISITOR_ID_COOKIE, visitorId);
  }

  const response = await updateSession(request);

  response.cookies.set(VISITOR_ID_COOKIE, visitorId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: VISITOR_ID_MAX_AGE_SECONDS,
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
