import "server-only";

import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { setFreeUsageUpgradeEffect } from "@/lib/free-usage/server";
import { markCouponUsed, ensureReanalysisCoupon } from "./coupons";
import type { PaymentAttempt, PremiumOrder } from "./orders";
import type { TossPayment } from "./toss";

// 생성 요청이 "전달됐다"고 볼 때까지만 기다리는 시간.
// 생성 자체는 1~2분 걸리므로 완주를 기다리지 않는다.
const TRIGGER_TIMEOUT_MS = 10_000;
// 유료 생성 API를 서버 내부 호출로 인증하기 위해 함께 보내는 커스텀 헤더 이름.
const INTERNAL_JOB_SECRET_HEADER = "x-internal-job-secret";
const internalJobSecret =
  process.env.INTERNAL_JOB_SECRET ?? process.env.WEBHOOK_SECRET;

/**
 * 유료 생성 API를 깨우기만 한다. 완주 보장은 DB 쪽 리퍼(reap_stuck_generations)가 맡는다.
 *
 * 이전 구현은 생성이 끝날 때까지(1~2분) 응답을 기다리며 최대 3회 재시도했다.
 * 그 사이 이 함수를 담은 after() 콜백이 수명을 넘겨 죽으면 FAILED 기록조차 남지
 * 않아, 요청이 PREMIUM_GENERATING에 영구히 고착되고 사용자는 무한 로딩을 봤다.
 *
 * 그래서 여기서는 짧은 타임아웃으로 요청만 던지고 빠진다.
 *   - 타임아웃 = 정상. 생성이 시작됐다는 뜻이다.
 *   - 응답이 오든 안 오든 진실은 naming_requests.status에 있다.
 *   - 재시도와 최종 FAILED 확정은 전부 리퍼가 한다. (매분 실행)
 */
async function triggerGeneration(admin: SupabaseClient, requestId: string) {
  const url = `${process.env.APP_ORIGIN}/api/naming/${requestId}/premium`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { [INTERNAL_JOB_SECRET_HEADER]: internalJobSecret ?? "" },
      signal: AbortSignal.timeout(TRIGGER_TIMEOUT_MS),
    });

    // 결제 미완료(403)/요청 없음(404)은 몇 번을 더 불러도 같다.
    // 리퍼가 헛되이 재시도하지 않도록 여기서 바로 실패로 확정한다.
    if (res.status === 403 || res.status === 404) {
      await admin
        .from("naming_requests")
        .update({
          status: "FAILED",
          generation_failure_reason: `생성 호출 거부(${res.status})`,
        })
        .eq("id", requestId)
        .eq("status", "PREMIUM_GENERATING");
    }
  } catch {
    // 타임아웃·네트워크 오류. 요청이 닿았는지 알 수 없지만 판단은 리퍼에 맡긴다.
    // 여기서 FAILED로 쓰면 정상 진행 중인 생성을 실패로 오판한다.
  }
}

async function getCouponType(admin: SupabaseClient, couponId: string | null) {
  if (!couponId) return null;

  const { data, error } = await admin
    .from("coupons")
    .select("type")
    .eq("id", couponId)
    .maybeSingle();

  if (error) throw error;
  return (data?.type as "PRE_REGISTER" | "REANALYSIS" | undefined) ?? null;
}

/**
 * 결제 성공 확정 트랜잭션 + AI 생성 트리거
 * 각 UPDATE가 조건부라 여러 번 호출돼도 1회로 수렴(멱등).
 * - payment_attempts(있으면): COMPLETED + payment_key/confirmed_at/raw
 * - premium_orders: COMPLETED + paid_at
 * - coupons(있으면): ACTIVE→USED
 * - users: is_paid_user=true
 *-  naming_requests: 최초 완료 시에만 PREMIUM_GENERATING + paid_at + user_id
 * - 이어서 AI 생성 호출을 after()로 예약(응답 후 실행)
 */
export async function completeOrder(
  admin: SupabaseClient,
  order: PremiumOrder,
  opts: {
    attempt?: Pick<PaymentAttempt, "id">;
    tossResponse?: TossPayment;
  } = {},
) {
  const now = new Date().toISOString();
  const couponType = await getCouponType(admin, order.coupon_id);

  // 결제 시도 기록을 COMPLETED로 확정 (attempt가 있을 때만).
  if (opts.attempt) {
    const { error } = await admin
      .from("payment_attempts")
      .update({
        status: "COMPLETED",
        payment_key: opts.tossResponse?.paymentKey ?? null,
        confirmed_at: now,
        raw_response: opts.tossResponse ?? null,
      })
      .eq("id", opts.attempt.id)
      .neq("status", "COMPLETED");
    if (error) throw error;
  }

  // 주문을 COMPLETED로 확정하고 결제 시각 기록.
  {
    const { error } = await admin
      .from("premium_orders")
      .update({ status: "COMPLETED", paid_at: now })
      .eq("id", order.id)
      .neq("status", "COMPLETED");
    if (error) throw error;
  }

  // 사용한 쿠폰을 USED로 소진 (쿠폰이 적용된 주문일 때만).
  if (order.coupon_id) {
    await markCouponUsed(admin, order.coupon_id);
  }

  // 실결제는 무료 사용권을 회복하고, 재분석 쿠폰은 무료 제한에 계속 포함시킴
  if (order.amount > 0) {
    await setFreeUsageUpgradeEffect(admin, {
      requestId: order.request_id,
      effect: "PAID",
    });
  } else if (couponType === "REANALYSIS") {
    await setFreeUsageUpgradeEffect(admin, {
      requestId: order.request_id,
      effect: "REANALYSIS",
    });
  }

  // 유저를 유료 회원으로 전환.
  {
    const { error } = await admin
      .from("users")
      .update({ is_paid_user: true })
      .eq("id", order.user_id);
    if (error) throw error;
  }

  // 무료 상태였던 최초 완료 건만 PREMIUM_GENERATING으로 전이 (유료 생성 시작).
  {
    const { error } = await admin
      .from("naming_requests")
      .update({
        status: "PREMIUM_GENERATING",
        paid_at: now,
        user_id: order.user_id,
        // 리퍼의 기준점을 여기서 먼저 찍는다. 생성 라우트가 갱신하지만,
        // 트리거 호출이 아예 닿지 못한 경우엔 이 값만 남는다. 비워 두면
        // 리퍼가 이 건을 영영 못 보고 무한 로딩이 그대로 남는다.
        generation_started_at: now,
        generation_attempts: 0,
        generation_failure_reason: null,
      })
      .eq("id", order.request_id)
      .in("status", ["FREE_ACTIVE", "FREE_EXPIRED"]); // 상태가 무료인 경우에만
    if (error) throw error;
  }

  // '출생 전' 결제자에게 무료재분석 쿠폰을 발급한다.
  //   1) 여기서 매 호출 발급 시도 (confirm·webhook·재시도마다)
  //   2) 헬퍼가 멱등(UNIQUE) → 여러 번 불려도 1장, 실패해도 다음 호출이 재시도
  //   3) 그래도 빠지면 pg_cron 잡(reconcile_reanalysis_coupons)이 매시 최종 보정
  if (order.amount > 0) {
    await ensureReanalysisCoupon(admin, {
      requestId: order.request_id,
      userId: order.user_id,
    });
  }

  // 응답을 먼저 반환하고 백그라운드로 생성 트리거 (generating 페이지가 status 폴링).
  after(() => triggerGeneration(admin, order.request_id));
}

/**
 * 결제 성공 확정 (confirm·webhook 공용, 여러 번 불려도 안전).
 * 1) toss_order_id로 attempt·order 로드
 * 2) 금액이 주문과 맞는지 재검증
 * 3) completeOrder로 상태 확정 + AI 생성 트리거
 */
export async function finalizePaymentSuccess(
  admin: SupabaseClient,
  tossOrderId: string,
  tossResponse: TossPayment,
): Promise<{ ok: true; requestId: string } | { ok: false }> {
  const { data: attempt, error: attemptErr } = await admin
    .from("payment_attempts")
    .select("*")
    .eq("toss_order_id", tossOrderId)
    .maybeSingle();
  if (attemptErr) throw attemptErr; // 조회 실패는 throw → 호출자가 재시도(webhook 500/confirm pending)
  if (!attempt) return { ok: false };

  const { data: order, error: orderErr } = await admin
    .from("premium_orders")
    .select("*")
    .eq("id", attempt.premium_order_id)
    .maybeSingle();
  if (orderErr) throw orderErr;
  if (!order) return { ok: false };

  // 금액 재검증
  if (
    tossResponse.status !== "DONE" ||
    tossResponse.totalAmount !== (order as PremiumOrder).amount
  ) {
    return { ok: false };
  }

  await completeOrder(admin, order as PremiumOrder, {
    attempt: attempt as PaymentAttempt,
    tossResponse,
  });
  return { ok: true, requestId: (order as PremiumOrder).request_id };
}
