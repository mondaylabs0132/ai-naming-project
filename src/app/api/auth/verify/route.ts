import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
]);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};

  // 요청 body가 올바른 JSON 객체인지 확인하고, 아니면 validation 에러로 처리
  try {
    const parsed = await request.json();

    if (parsed && typeof parsed === "object") {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    return NextResponse.json(
      { ok: false, code: "validation_failed" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const token =
    typeof body.token === "string"
      ? body.token.trim()
      : typeof body.code === "string"
        ? body.code.trim()
        : "";

  // 이메일이 없거나 OTP가 숫자가 아니면 Supabase 검증 전에 요청을 거절함
  if (!email || !/^\d+$/.test(token)) {
    return NextResponse.json(
      { ok: false, code: "validation_failed" },
      { status: 400 },
    );
  }

  const resultId =
    typeof body.resultId === "string" ? body.resultId.trim() : "";

  const supabase = await createClient();

  const { data: verifyData, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    console.error("Verify OTP error:", {
      message: error.message,
      status: error.status,
      name: error.name,
      code: error.code,
    });

    const code = error.code ?? "verify_failed";
    const status = RATE_LIMIT_CODES.has(code) ? 429 : 400;
    const retryAfterSeconds = RATE_LIMIT_CODES.has(code)
      ? error.message.match(/(\d+)\s*seconds?/i)?.[1]
      : undefined;

    return NextResponse.json(
      {
        ok: false,
        code,
        ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
      },
      { status },
    );
  }

  // 인증 성공 시 익명 무료 결과(user_id NULL)를 로그인 유저에 귀속.
  const userId = verifyData.user?.id;
  if (userId && resultId && UUID_RE.test(resultId)) {
    const admin = createAdminClient();
    await admin
      .from("naming_requests")
      .update({ user_id: userId })
      .eq("id", resultId)
      .is("user_id", null);
  }

  return NextResponse.json({ ok: true });
}
