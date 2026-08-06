export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { findRefundableOrder, refundOrder } from "@/lib/payments/refund";

const INTERNAL_JOB_SECRET_HEADER = "x-internal-job-secret";
const internalJobSecret =
  process.env.INTERNAL_JOB_SECRET ?? process.env.WEBHOOK_SECRET;

/**
 * 리퍼(reap_stuck_generations)가 재시도를 소진했을 때 부르는 종착점.
 * 생성을 최종 실패로 확정하고 결제를 되돌린다.
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

  // 그사이 생성이 성공했거나 이미 처리된 건. 리퍼가 늦게 도착했을 뿐이다.
  if (request.status !== "PREMIUM_GENERATING") {
    return NextResponse.json({ ok: true, skipped: request.status });
  }

  const reason = `AI 생성 실패 (${request.generation_attempts}회 시도): ${
    request.generation_failure_reason ?? "응답 없음"
  }`;

  // 먼저 실패로 확정한다. 사용자를 무한 로딩에 더 붙잡아 두지 않기 위해서다.
  // 이 전이가 결과 안내 메일 트리거도 태우므로, 결제 후 이탈한 사용자에게도 닿는다.
  await admin
    .from("naming_requests")
    .update({ status: "FAILED", generation_failure_reason: reason })
    .eq("id", requestId)
    .eq("status", "PREMIUM_GENERATING");

  const order = await findRefundableOrder(admin, requestId);
  if (!order || order.status !== "COMPLETED") {
    return NextResponse.json({ ok: true, refunded: false });
  }

  const result = await refundOrder(admin, order, reason);

  if (!result.ok) {
    // 상태는 이미 FAILED라 리퍼가 다시 부르지 않는다. 즉 이 환불은 여기서 끊긴다.
    // 사용자에겐 실패 화면의 '환불 요청' 버튼이 남아 있지만, 그걸 누르지 않으면
    // 돈이 그대로 남으므로 반드시 사람이 봐야 한다.
    console.error(
      `[generation-failed] 자동 환불 실패 — 수동 처리 필요 requestId=${requestId} orderId=${order.id} code=${result.code}: ${result.message}`,
    );
    return NextResponse.json(
      { ok: false, refunded: false, code: result.code },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    refunded: true,
    amount: result.refunded,
    alreadyRefunded: result.alreadyRefunded,
  });
}
