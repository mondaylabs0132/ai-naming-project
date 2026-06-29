import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
  const emailName = email.includes("@") ? email.split("@")[0] : email;

  if (!email) {
    return NextResponse.json(
      { ok: false, code: "validation_failed" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: {
        email_name: emailName,
      },
    },
  });

  if (error) {
    console.error("Send OTP error:", {
      message: error.message,
      status: error.status,
      name: error.name,
      code: error.code,
    });

    const code = error.code ?? "send_failed";
    const status = RATE_LIMIT_CODES.has(code) ? 429 : 502;
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

  return NextResponse.json({ ok: true });
}
