export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { finalizePaymentSuccess } from "@/lib/payments/complete";
import {
  lockOrderForProcessing,
  markPaymentFailed,
  type PaymentAttempt,
  type PremiumOrder,
} from "@/lib/payments/orders";
import { confirmPayment, getPaymentByOrderId } from "@/lib/payments/toss";

function fail(status: number, code: string) {
  return NextResponse.json({ ok: false, code }, { status });
}

export async function POST(req: NextRequest) {
  // 0. 인증
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "unauthorized");

  const body = (await req.json().catch(() => ({}))) as {
    paymentKey?: string;
    orderId?: string;
    amount?: number;
  };
  const { paymentKey, orderId, amount } = body;
  if (!paymentKey || !orderId || typeof amount !== "number") {
    return fail(400, "validation_failed");
  }

  const admin = createAdminClient();

  // 1. Toss orderId로 결제 시도(attempt)를 찾고, 거기 연결된 주문 본체(order - 금액·상태·소유자)까지 로드.
  const { data: attemptRow } = await admin
    .from("payment_attempts")
    .select("*")
    .eq("toss_order_id", orderId)
    .maybeSingle();
  if (!attemptRow) return fail(400, "attempt_not_found");
  const attempt = attemptRow as PaymentAttempt;

  const { data: orderRow } = await admin
    .from("premium_orders")
    .select("*")
    .eq("id", attempt.premium_order_id)
    .maybeSingle();
  if (!orderRow) return fail(400, "order_not_found");
  const order = orderRow as PremiumOrder;

  // 2. 소유권 검증
  if (order.user_id !== user.id) return fail(403, "forbidden");

  // 이미 결제 완료된 주문이 또 confirm으로 들어온 경우(재시도·중복요청) → 재작업 없이 성공만 응답.
  if (order.status === "COMPLETED") {
    return NextResponse.json({ ok: true, requestId: order.request_id });
  }

  // 3. 금액 검증 — 명확한 실패 처리
  if (amount !== order.amount) {
    await markPaymentFailed(admin, {
      attempt,
      order,
      code: "amount_mismatch",
      message: "amount mismatch",
    });
    return fail(400, "amount_mismatch");
  }

  // 4. 결과가 이미 만료 후 정리(purge)됐으면 승인 전에 중단.
  //    시간이 아니라 deleted_at을 보는 이유: 유예가 지나도 크론이 아직 안 돌았으면
  //    설문이 남아 있으므로 정상 완주시킨다.
  const { data: nr } = await admin
    .from("naming_requests")
    .select("status,deleted_at")
    .eq("id", order.request_id)
    .maybeSingle();
  if (!nr || nr.deleted_at || nr.status === "DELETED") {
    await markPaymentFailed(admin, {
      attempt,
      order,
      code: "result_expired",
      message: "result purged before approval",
    });
    return fail(410, "result_expired");
  }

  // 5. 중복 승인 차단: PENDING→PROCESSING 조건부
  const locked = await lockOrderForProcessing(admin, order.id);
  if (!locked) {
    // 잠금 실패(= 다른 요청이 이미 처리 중).  → 현재 상태 재조회
    const { data: fresh } = await admin
      .from("premium_orders")
      .select("status,request_id")
      .eq("id", order.id)
      .maybeSingle();
    // 그 요청이 이미 끝냈으면 성공으로 수렴
    if (fresh?.status === "COMPLETED") {
      return NextResponse.json({ ok: true, requestId: order.request_id });
    }
    // 아직 PROCESSING이면 성공/실패 미확정 → pending 반환
    return NextResponse.json({ ok: false, pending: true }, { status: 202 });
  }

  // 6. Toss 승인 API
  const result = await confirmPayment({
    paymentKey,
    orderId,
    amount,
    idempotencyKey: attempt.idempotency_key,
  });

  // ── 성공 ──
  if (result.ok) {
    // 5. 응답 재검증 — 불일치면 명확한 실패(A)
    if (
      result.payment.status !== "DONE" ||
      result.payment.totalAmount !== order.amount
    ) {
      await markPaymentFailed(admin, {
        attempt,
        order,
        code: "response_mismatch",
        message: "toss response mismatch",
        raw: result.payment,
      });
      return fail(400, "response_mismatch");
    }
    // 7. 결제 성공 확정
    try {
      await finalizePaymentSuccess(admin, orderId, result.payment);
    } catch (e) {
      // Toss 승인은 성공(돈 나감)했는데 DB 반영 실패 → 절대 checkout으로 보내지 않는다
      // (재결제 시 이중결제). PROCESSING 유지 → webhook이 보정, 클라는 pending 폴링.
      console.error("[checkout/confirm] finalize failed:", e);
      return NextResponse.json({ ok: false, pending: true }, { status: 202 });
    }
    // 8. 응답
    return NextResponse.json({ ok: true, requestId: order.request_id });
  }

  // ── A. 명확한 실패 (카드 거절 등 4xx) ──
  if (result.kind === "rejected") {
    await markPaymentFailed(admin, {
      attempt,
      order,
      code: result.code,
      message: result.message,
      raw: result.raw as Record<string, unknown> | null,
    });
    return fail(400, result.code);
  }

  // ── B. 애매한 실패 (타임아웃/네트워크/5xx) — Toss 조회로 진실 확인 ──
  const payment = await getPaymentByOrderId(orderId);
  if (
    payment &&
    payment.status === "DONE" &&
    payment.totalAmount === order.amount
  ) {
    // 실제로 결제됨 → 여기서 처음 완료 적용
    try {
      await finalizePaymentSuccess(admin, orderId, payment);
    } catch (e) {
      // 돈은 나갔는데 DB 반영 실패 → checkout으로 안 보냄. webhook이 보정.
      console.error("[checkout/confirm] finalize failed (B/DONE):", e);
      return NextResponse.json({ ok: false, pending: true }, { status: 202 });
    }
    return NextResponse.json({ ok: true, requestId: order.request_id });
  }
  if (
    payment &&
    (payment.status === "CANCELED" ||
      payment.status === "ABORTED" ||
      payment.status === "EXPIRED")
  ) {
    // 미승인/취소 확정 → A와 동일 처리
    await markPaymentFailed(admin, {
      attempt,
      order,
      code: payment.status,
      message: "payment not approved",
      raw: payment,
    });
    return fail(400, payment.status);
  }

  // 조회조차 불가/여전히 미확정 → PROCESSING 유지, webhook이 보정. 클라는 pending 폴링.
  return NextResponse.json({ ok: false, pending: true }, { status: 202 });
}
