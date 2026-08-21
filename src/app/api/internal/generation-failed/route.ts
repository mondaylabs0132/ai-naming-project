export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { failAndRefund } from "@/lib/payments/refund";

const INTERNAL_JOB_SECRET_HEADER = "x-internal-job-secret";
const internalJobSecret =
  process.env.INTERNAL_JOB_SECRET ?? process.env.WEBHOOK_SECRET;

/**
 * 리퍼(reap_stuck_generations)가 부르는 종착점. 두 경우에 온다.
 *   ① 생성 라우트가 판정조차 못 내리고 죽어(타임아웃·배포 중 종료) 무응답인 건
 *   ② 이미 FAILED지만 자동 환불이 토스 오류로 끊긴 건 (환불 재시도)
 *
 * 실패를 스스로 감지한 건은 생성 라우트가 직접 failAndRefund를 부르므로
 * 여기까지 오지 않는다. 이 경로는 "앱이 말이 없을 때"를 위한 안전망이다.
 *
 * 토스 취소는 외부 HTTP 호출이라 DB 함수가 감당할 일이 아니다.
 * pg_cron이 여기까지 끌고 오고, 실제 환불은 앱이 한다.
 */
export async function POST(req: NextRequest) {
  const actual = req.headers.get(INTERNAL_JOB_SECRET_HEADER);
  if (!internalJobSecret || actual !== internalJobSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let requestId: string | undefined;
  try {
    requestId = (await req.json())?.requestId;
  } catch {
    /* 본문 없음 */
  }
  if (!requestId) {
    return NextResponse.json({ error: "requestId_required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: request } = await admin
    .from("naming_requests")
    .select("status,generation_attempts,generation_failure_reason")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // 이미 FAILED인 건은 환불만 다시 시도하는 경우다. 그때 이미 기록된 사유가
  // 진짜 원인이므로 덮어쓰지 않는다.
  const reason =
    request.status === "FAILED"
      ? (request.generation_failure_reason as string | null) ??
        "AI 생성 실패 (환불 재시도)"
      : `AI 생성 실패 (${request.generation_attempts}회 시도, 응답 없음): ${
          request.generation_failure_reason ?? "생성 라우트 무응답"
        }`;

  const result = await failAndRefund(admin, requestId, reason);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, refunded: false, code: result.code },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    refunded: result.refunded,
    amount: result.amount,
    alreadyRefunded: result.alreadyRefunded,
    skipped: result.skipped,
  });
}
