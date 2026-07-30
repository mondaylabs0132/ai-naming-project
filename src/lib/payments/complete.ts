import "server-only";

import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { setFreeUsageUpgradeEffect } from "@/lib/free-usage/server";
import { markCouponUsed, ensureReanalysisCoupon } from "./coupons";
import type { PaymentAttempt, PremiumOrder } from "./orders";
import type { TossPayment } from "./toss";

/** 생성 API 호출 재시도 횟수. */
const GENERATION_MAX_ATTEMPTS = 3;
// 유료 생성 API를 서버 내부 호출로 인증하기 위해 함께 보내는 커스텀 헤더 이름.
const INTERNAL_JOB_SECRET_HEADER = "x-internal-job-secret";
const internalJobSecret =
  process.env.INTERNAL_JOB_SECRET ?? process.env.WEBHOOK_SECRET;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 유료 생성 API를 호출하고, 실패하면 최대 3회까지 재시도한다.
 *   생성 성공     → premium route가 PREMIUM_RESULT_READY로 바꿈 (여기선 손 안 댐)
 *   3회 모두 실패 → 여기서 FAILED로 바꿈 → generating 화면이 실패 UI를 띄움
 *   재시도 중     → PREMIUM_GENERATING 유지 → 폴링 화면이 "아직 진행 중"으로 봄
 *
 * 재시도 도중에 섣불리 FAILED로 바꾸지 않는 이유: generating 화면이 status를
 * 반복 조회(폴링)하는데, 중간 실패를 최종 실패로 오판해 실패 UI를 띄우면 안 되기 때문.
 */
async function triggerGeneration(admin: SupabaseClient, requestId: string) {
  const url = `${process.env.APP_ORIGIN}/api/naming/${requestId}/premium`;

  for (let i = 0; i < GENERATION_MAX_ATTEMPTS; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          [INTERNAL_JOB_SECRET_HEADER]: internalJobSecret ?? "",
        },
      });
      if (res.ok) return; // 성공 → route가 RESULT_READY 세팅
      // 결제 미완료(403)/요청 없음(404) 등 재시도 무의미 → 중단
      if (res.status === 403 || res.status === 404) break;
    } catch {
      // 네트워크/타임아웃 → 재시도
    }
    await sleep(500 * (i + 1));
  }

  // 재시도 소진 → 최종 실패 착지
  await admin
    .from("naming_requests")
    .update({ status: "FAILED" })
    .eq("id", requestId)
    .eq("status", "PREMIUM_GENERATING");
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
