import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { restoreCoupon } from "./coupons";
import type { PremiumOrder } from "./orders";
import { cancelPayment } from "./toss";

/** 환불 후 다시 결제할 수 있도록 열어 주는 시간. */
const REPURCHASE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type RefundResult =
  | { ok: true; refunded: number; alreadyRefunded: boolean }
  | { ok: false; code: string; message: string };

/**
 * 결제 1건을 되돌린다. completeOrder의 역방향이며, 같은 방식으로 멱등하다
 * (조건부 UPDATE + 토스 멱등키).
 *
 * **두 갈래를 반드시 구분해야 한다.**
 *   실결제(amount > 0) → 토스 취소 API 호출
 *   쿠폰 100%(amount = 0) → payment_attempts 행 자체가 없다. 취소할 결제가
 *     없으므로 토스를 부르면 안 되고, 쿠폰을 되살리는 것이 곧 환불이다.
 *   (실제 결제 완료 7건 중 4건이 이 경우였다. 예외가 아니라 주경로다.)
 *
 * 토스 취소를 DB 갱신보다 **먼저** 하는 이유: 반대 순서면 취소가 실패했을 때
 * DB를 되돌려야 한다. 토스는 멱등키로 중복 취소를 막아 주므로 이쪽이 단순하다.
 */
export async function refundOrder(
  admin: SupabaseClient,
  order: PremiumOrder,
  reason: string,
): Promise<RefundResult> {
  if (order.status === "REFUNDED") {
    return { ok: true, refunded: order.amount, alreadyRefunded: true };
  }
  if (order.status !== "COMPLETED") {
    return {
      ok: false,
      code: "not_refundable",
      message: `환불 대상이 아닌 주문 상태: ${order.status}`,
    };
  }

  const now = new Date().toISOString();

  // 환불 이력에 남길 값. 실결제 건에서만 채워진다.
  let refundedAttemptId: string | null = null;
  let tossResponse: unknown = null;

  // ── 1. 실결제분 취소 ────────────────────────────────────────
  if (order.amount > 0) {
    const { data: attempt } = await admin
      .from("payment_attempts")
      .select("id,payment_key")
      .eq("premium_order_id", order.id)
      .eq("status", "COMPLETED")
      .maybeSingle();

    // 돈은 받았는데 결제 시도 기록이 없다. 자동으로 처리하면 안 되는 상황이므로
    // 조용히 넘어가지 않고 실패로 올려 사람이 보게 한다.
    if (!attempt?.payment_key) {
      console.error(
        `[refund] paymentKey 없음 — 수동 확인 필요 orderId=${order.id} amount=${order.amount}`,
      );
      return {
        ok: false,
        code: "payment_key_not_found",
        message: "결제 기록을 찾을 수 없어 자동 환불할 수 없습니다.",
      };
    }

    const result = await cancelPayment({
      paymentKey: attempt.payment_key as string,
      cancelReason: reason,
      // 주문당 전액 취소는 평생 한 번뿐이라 주문 id를 그대로 멱등키로 쓴다.
      // 재시도가 여러 번 와도 토스 쪽에서 1회로 수렴한다.
      idempotencyKey: order.id,
    });

    if (!result.ok) {
      console.error(
        `[refund] 토스 취소 실패 orderId=${order.id} code=${result.code}: ${result.message}`,
      );
      return { ok: false, code: result.code, message: result.message };
    }

    refundedAttemptId = attempt.id as string;
    tossResponse = result.payment ?? { alreadyCanceled: true };

    const { error } = await admin
      .from("payment_attempts")
      .update({
        status: "REFUNDED",
        canceled_at: now,
        cancel_response: tossResponse,
      })
      .eq("id", attempt.id)
      .neq("status", "REFUNDED");
    if (error) throw error;
  }

  // ── 2. 쿠폰 복원 ────────────────────────────────────────────
  // 0원 주문에서는 이게 유일한 환불 수단이다.
  if (order.coupon_id) {
    await restoreCoupon(admin, order.coupon_id);
  }

  // ── 3. 주문을 REFUNDED로 확정 ───────────────────────────────
  // .select()로 실제 갱신된 행을 받는다. 이 UPDATE는 COMPLETED일 때만 걸리므로,
  // 행이 돌아왔다면 이번 호출이 환불을 확정한 유일한 주체라는 뜻이다.
  // 이걸 아래 이력 삽입의 조건으로 삼아 중복 기록을 막는다.
  //
  // coupon_id를 여기서 해제해야 한다. UNIQUE(coupon_id) 인덱스에 주문 상태
  // 조건이 없어서, REFUNDED 주문이 쿠폰을 계속 물고 있으면 위에서 되살린
  // 쿠폰을 다른 결제에 쓰려는 순간 23505(coupon_in_use)로 막힌다.
  // 환불 이력의 쿠폰 정보는 아래 refunds 테이블에 남는다.
  const { data: refundedOrder, error: orderError } = await admin
    .from("premium_orders")
    .update({
      status: "REFUNDED",
      refunded_at: now,
      refund_amount: order.amount,
      refund_reason: reason.slice(0, 500),
      coupon_id: null,
    })
    .eq("id", order.id)
    .eq("status", "COMPLETED")
    .select("id")
    .maybeSingle();
  if (orderError) throw orderError;

  // ── 4. 환불 이력 적재 ───────────────────────────────────────
  // premium_orders는 request_id당 1행이고 재구매 시 되살려 쓰므로,
  // refunded_at/refund_amount/refund_reason이 지워진다. 분쟁·정산의 근거는
  // 이 테이블에만 남는다. 특히 쿠폰 100% 건은 payment_attempts 행조차 없어
  // 여기 기록하지 않으면 환불한 사실 자체가 사라진다.
  if (refundedOrder) {
    const { error } = await admin.from("refunds").insert({
      premium_order_id: order.id,
      request_id: order.request_id,
      user_id: order.user_id,
      payment_attempt_id: refundedAttemptId,
      coupon_id: order.coupon_id,
      amount: order.amount,
      reason: reason.slice(0, 500),
      toss_response: tossResponse,
      refunded_at: now,
    });

    // 이력을 못 남겼다고 이미 끝난 환불을 되돌릴 수는 없다.
    // 돈은 나갔으므로 성공으로 처리하되, 반드시 사람이 볼 수 있게 남긴다.
    if (error) {
      console.error(
        `[refund] 환불 이력 적재 실패 — 수동 확인 필요 orderId=${order.id} amount=${order.amount}: ${error.message}`,
      );
    }
  }

  // ── 5. 유료 회원 여부 재계산 ────────────────────────────────
  // 다른 결제 건이 남아 있으면 유료 회원 그대로 둔다.
  {
    const { count } = await admin
      .from("premium_orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", order.user_id)
      .eq("status", "COMPLETED");

    if (!count) {
      const { error } = await admin
        .from("users")
        .update({ is_paid_user: false })
        .eq("id", order.user_id);
      if (error) throw error;
    }
  }

  // ── 6. 재구매 창 열어 두기 ──────────────────────────────────
  // 환불만 해 주고 결제 기간이 닫혀 있으면 다시 사고 싶어도 못 산다.
  {
    const { data: request } = await admin
      .from("naming_requests")
      .select("free_expires_at")
      .eq("id", order.request_id)
      .maybeSingle();

    const reopenAt = Date.now() + REPURCHASE_WINDOW_MS;
    const current = request?.free_expires_at
      ? new Date(request.free_expires_at as string).getTime()
      : 0;

    if (current < reopenAt) {
      await admin
        .from("naming_requests")
        .update({ free_expires_at: new Date(reopenAt).toISOString() })
        .eq("id", order.request_id);
    }
  }

  console.log(
    `[refund] 완료 orderId=${order.id} requestId=${order.request_id} amount=${order.amount} coupon=${order.coupon_id ?? "없음"} 사유=${reason}`,
  );

  return { ok: true, refunded: order.amount, alreadyRefunded: false };
}

/** request_id로 환불 대상 주문을 찾는다. */
export async function findRefundableOrder(
  admin: SupabaseClient,
  requestId: string,
): Promise<PremiumOrder | null> {
  const { data } = await admin
    .from("premium_orders")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();

  return (data as PremiumOrder) ?? null;
}
