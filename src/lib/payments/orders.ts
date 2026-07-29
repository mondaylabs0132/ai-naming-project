import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { TossPayment } from "./toss";

const PRODUCT_PRICE = 19900;

/**
 * 무료 결과가 만료(free_expires_at)된 뒤에도 결제를 더 받아주는 시간.
 * 만료 직전에 결제를 시작한 사람이 몇 초 차이로 실패하는 걸 막아준다.
 */
export const PAYMENT_GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * 아직 결제를 받을 수 있는 기간인지 (만료 + 위 유예 시간이 지나지 않았는지).
 */
export const isPaymentWindowOpen = (freeExpiresAt: string | null) =>
  !!freeExpiresAt &&
  Date.now() < new Date(freeExpiresAt).getTime() + PAYMENT_GRACE_MS;

export type PremiumOrder = {
  id: string;
  request_id: string;
  user_id: string;
  coupon_id: string | null;
  status: string;
  original_amount: number;
  discount_amount: number;
  amount: number;
};

export type PaymentAttempt = {
  id: string;
  premium_order_id: string;
  request_id: string;
  toss_order_id: string;
  idempotency_key: string;
  amount: number;
  status: string;
};

/**
 *  이 결과(request_id)의 주문 1건을 준비한다 (결과당 1장 규칙).
 * - PROCESSING / COMPLETED  → 이미 진행 중이거나 끝남. 건드리지 않고 conflict 반환
 * - PENDING / FAILED / CANCELED → 죽은 주문이라 되살려 씀. 금액·쿠폰 갱신 후 PENDING으로 리셋.
 * - (주문 없음)             → 새로 INSERT.
 * - 참고: 같은 쿠폰을 두 주문서가 동시에 쓰려 하면 DB가 막음(에러 23505 → prepare가 처리).
 */
export async function prepareOrder(
  admin: SupabaseClient,
  p: {
    requestId: string;
    userId: string;
    couponId: string | null;
    discount: number;
  },
): Promise<
  { conflict: true; status: string } | { conflict: false; order: PremiumOrder }
> {
  const amount = PRODUCT_PRICE - p.discount;

  const { data: existing } = await admin
    .from("premium_orders")
    .select("id,status")
    .eq("request_id", p.requestId)
    .maybeSingle();

  if (existing) {
    if (existing.status === "PROCESSING" || existing.status === "COMPLETED") {
      return { conflict: true, status: existing.status };
    }
    const { data, error } = await admin
      .from("premium_orders")
      .update({
        user_id: p.userId,
        coupon_id: p.couponId,
        status: "PENDING",
        original_amount: PRODUCT_PRICE,
        discount_amount: p.discount,
        amount,
        paid_at: null,
        failed_at: null,
        failure_reason: null,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return { conflict: false, order: data as PremiumOrder };
  }

  const { data, error } = await admin
    .from("premium_orders")
    .insert({
      request_id: p.requestId,
      user_id: p.userId,
      coupon_id: p.couponId,
      status: "PENDING",
      original_amount: PRODUCT_PRICE,
      discount_amount: p.discount,
      amount,
    })
    .select("*")
    .single();
  if (error) throw error;
  return { conflict: false, order: data as PremiumOrder };
}

/** payment_attempts(PENDING) 생성 — 0원 주문은 호출하지 않음(amount > 0 제약) */
export async function createAttempt(
  admin: SupabaseClient,
  p: {
    orderId: string;
    requestId: string;
    tossOrderId: string;
    idempotencyKey: string;
    amount: number;
  },
): Promise<PaymentAttempt> {
  const { data, error } = await admin
    .from("payment_attempts")
    .insert({
      premium_order_id: p.orderId,
      request_id: p.requestId,
      toss_order_id: p.tossOrderId,
      idempotency_key: p.idempotencyKey,
      amount: p.amount,
      status: "PENDING",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PaymentAttempt;
}

/**
 * premium_orders 조건부 PENDING→PROCESSING (중복 승인 차단)
 * 갱신 성공 시 order 반환, 0행이면 null.
 */
export async function lockOrderForProcessing(
  admin: SupabaseClient,
  orderId: string,
): Promise<PremiumOrder | null> {
  const { data } = await admin
    .from("premium_orders")
    .update({ status: "PROCESSING" })
    .eq("id", orderId)
    .eq("status", "PENDING")
    .select("*")
    .maybeSingle();
  return (data as PremiumOrder) ?? null;
}

/**
 * 명확한 실패(A) 처리
 * attempt FAILED, order PROCESSING→FAILED, 쿠폰 예약 해제(coupon_id=NULL, 쿠폰은 ACTIVE 유지).
 * naming_requests는 건드리지 않는다.
 */
export async function markPaymentFailed(
  admin: SupabaseClient,
  p: {
    attempt: Pick<PaymentAttempt, "id">;
    order: Pick<PremiumOrder, "id">;
    code?: string;
    message?: string;
    raw?: TossPayment | Record<string, unknown> | null;
  },
) {
  const now = new Date().toISOString();
  await admin
    .from("payment_attempts")
    .update({
      status: "FAILED",
      failure_code: p.code ?? null,
      failure_message: p.message ?? null,
      failed_at: now,
      raw_response: p.raw ?? null,
    })
    .eq("id", p.attempt.id)
    .neq("status", "COMPLETED");

  await admin
    .from("premium_orders")
    .update({
      status: "FAILED",
      failed_at: now,
      failure_reason: p.message ?? p.code ?? null,
      coupon_id: null, // 쿠폰 예약 해제
    })
    .eq("id", p.order.id)
    // amount_mismatch(§5-2-2)는 PENDING 단계에서, 그 외는 PROCESSING 단계에서 실패한다.
    .in("status", ["PENDING", "PROCESSING"]);
}
