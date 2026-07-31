export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function fail(status: number, code: string) {
  return NextResponse.json({ ok: false, code }, { status });
}

function normalizeOrigin(origin: string) {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function isTrustedOrigin(request: NextRequest) {
  // 브라우저가 보낸 요청 출처를 확인한다.
  // 계정 삭제는 쿠키만 있으면 실행되는 POST라서, 외부 사이트의 form POST를 막음
  const origin = request.headers.get("origin");
  if (!origin) return false;

  // Origin 값이 URL 형태가 아니면 신뢰하지 않음
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  const allowedOrigins = new Set<string>();
  const appOrigin = process.env.APP_ORIGIN;

  // 운영 환경에서는 배포된 앱 origin만 계정 삭제 요청을 보낼 수 있음
  if (appOrigin) {
    const normalizedAppOrigin = normalizeOrigin(appOrigin);
    if (normalizedAppOrigin) allowedOrigins.add(normalizedAppOrigin);
  }

  // 로컬 개발에서는 localhost/dev server origin도 허용
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add(request.nextUrl.origin);
  }

  // 요청 Origin이 허용 목록에 정확히 있을 때만 통과
  return allowedOrigins.has(normalizedOrigin);
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return fail(403, "forbidden_origin");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return fail(401, "unauthorized");
  }

  const admin = createAdminClient();

  const { error: rpcError } = await admin.rpc("delete_account_data", {
    p_user_id: user.id,
  });

  if (rpcError) {
    console.error("Account data deletion failed:", {
      message: rpcError.message,
      code: rpcError.code,
    });

    return fail(500, "delete_failed");
  }

  const { error: authError } = await admin.auth.admin.deleteUser(user.id, true);

  if (authError) {
    console.error("Auth user soft deletion failed:", {
      message: authError.message,
      status: authError.status,
      name: authError.name,
      code: authError.code,
    });

    return fail(500, "delete_failed");
  }

  return NextResponse.json({ ok: true });
}
