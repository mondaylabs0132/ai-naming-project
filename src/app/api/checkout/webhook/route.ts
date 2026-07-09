export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { finalizePaymentSuccess } from "@/lib/payments/complete";
import { getPaymentByOrderId } from "@/lib/payments/toss";

/**
 * Toss 결제 webhook — 진실 보정.
 * confirm의 Toss 승인은 됐는데 그 직후 우리 DB 커밋이 실패한 틈을 메운다.
 * 검증: payload를 신뢰하지 않고 orderId로 Toss 결제 조회 API를 재조회해 진실을 확인(확정 방식).
 */
export async function POST(req: NextRequest) {
  let payload: {
    eventType?: string;
    data?: { orderId?: string; status?: string };
    orderId?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const orderId = payload?.data?.orderId ?? payload?.orderId;
  if (!orderId) return new Response(null, { status: 200 }); // 무시(ack)

  // 결제 진실 확인: Toss 조회 API 재조회
  const payment = await getPaymentByOrderId(orderId);
  if (!payment) return new Response(null, { status: 200 });

  const admin = createAdminClient();

  if (payment.status === "DONE") {
    try {
      // confirm이 쓰는 결제 확정 함수를 그대로 재사용. 이미 confirm이 처리했어도
      // 조건부 UPDATE라 다시 안 바뀌고(멱등), 아직이면 여기서 확정한다.
      await finalizePaymentSuccess(admin, orderId, payment);
    } catch (e) {
      // DB 반영 실패 → 500을 반환해 Toss가 webhook을 재전송하게 한다(재수렴).
      console.error("[checkout/webhook] finalize failed:", e);
      return new Response("finalize failed", { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (
    payment.status === "CANCELED" ||
    payment.status === "ABORTED" ||
    payment.status === "EXPIRED"
  ) {
    // 취소/실패 이벤트
    // 이 orderId에 해당하는 결제 시도를 찾는다.
    const { data: attempt } = await admin
      .from("payment_attempts")
      .select("id,premium_order_id,status")
      .eq("toss_order_id", orderId)
      .maybeSingle();
    // 이미 완료된 결제는 건드리지 않는다(취소 이벤트가 성공을 덮어쓰면 안 됨).
    if (attempt && attempt.status !== "COMPLETED") {
      const now = new Date().toISOString();
      // 결제 시도를 CANCELED로 기록 + Toss 원본 응답 보존.
      await admin
        .from("payment_attempts")
        .update({ status: "CANCELED", failed_at: now, raw_response: payment })
        .eq("id", attempt.id);
      // 주문도 CANCELED로. 쿠폰 예약은 풀어(coupon_id=NULL) 다시 쓸 수 있게 한다.
      // 단, 그새 COMPLETED가 됐으면 덮어쓰지 않는다(경쟁 방어).
      await admin
        .from("premium_orders")
        .update({ status: "CANCELED", failed_at: now, coupon_id: null })
        .eq("id", attempt.premium_order_id)
        .neq("status", "COMPLETED");
    }
  }

  return NextResponse.json({ ok: true });
}
