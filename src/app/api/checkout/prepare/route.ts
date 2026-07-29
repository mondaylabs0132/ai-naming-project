export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { completeOrder } from "@/lib/payments/complete";
import { validateAndPriceCoupon } from "@/lib/payments/coupons";
import {
  createAttempt,
  prepareOrder,
  isPaymentWindowOpen,
} from "@/lib/payments/orders";
import {
  customerKeyFor,
  generateIdempotencyKey,
  generateOrderId,
} from "@/lib/payments/toss";

const PRODUCT_PRICE = 19900;
const ORDER_NAME = "첫지음 작명 서비스";

function fail(status: number, code: string) {
  return NextResponse.json({ ok: false, code }, { status });
}

export async function POST(req: NextRequest) {
  // 1. 인증
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, "unauthorized");

  const body = (await req.json().catch(() => ({}))) as {
    requestId?: string;
    couponId?: string;
  };
  const requestId = body.requestId;
  const couponId = body.couponId ?? null;
  if (!requestId) return fail(400, "validation_failed");

  const admin = createAdminClient();

  // 2. naming_requests 조회
  const { data: nr } = await admin
    .from("naming_requests")
    .select("id,user_id,status,deleted_at,free_expires_at")
    .eq("id", requestId)
    .maybeSingle();
  if (!nr || nr.status === "DELETED" || nr.deleted_at) {
    return fail(404, "not_found");
  }
  if (
    nr.status === "PREMIUM_GENERATING" ||
    nr.status === "PREMIUM_RESULT_READY"
  ) {
    return fail(409, "already_paid");
  }
  // 본인 소유권 확인
  if (nr.user_id && nr.user_id !== user.id) return fail(403, "forbidden");
  if (!nr.user_id) {
    await admin
      .from("naming_requests")
      .update({ user_id: user.id })
      .eq("id", requestId);
  }

  // 기결제 방어: COMPLETED 주문 존재 시 already_paid
  const { data: existingOrder } = await admin
    .from("premium_orders")
    .select("status")
    .eq("request_id", requestId)
    .maybeSingle();
  if (existingOrder?.status === "COMPLETED") return fail(409, "already_paid");

  // 보관 기간이 끝난 결과는 새 결제를 받지 않는다.
  // 결제 완료 건도 이 기간은 지나 있으므로 반드시 위의 기결제 검사들보다 뒤에 둔다.
  if (!isPaymentWindowOpen(nr.free_expires_at)) {
    return fail(410, "payment_window_closed");
  }

  // 4. 쿠폰 검증
  let discount = 0;
  if (couponId) {
    const v = await validateAndPriceCoupon(admin, couponId, user.id);
    if (!v.ok) return fail(400, "invalid_coupon");
    discount = v.discount;
  }

  // 5. 금액 계산
  discount = Math.min(Math.max(discount, 0), PRODUCT_PRICE);
  const amount = PRODUCT_PRICE - discount;

  // 6~7. premium_orders upsert + 쿠폰 예약
  let prep;
  try {
    prep = await prepareOrder(admin, {
      requestId,
      userId: user.id,
      couponId,
      discount,
    });
  } catch (e) {
    // partial UNIQUE(coupon_id) 위반 → 쿠폰이 이미 다른 주문에 예약됨
    if ((e as { code?: string }).code === "23505") {
      return fail(409, "coupon_in_use");
    }
    throw e;
  }
  if (prep.conflict) return fail(409, "order_in_progress");
  const order = prep.order;

  // 100% 할인(REANALYSIS) → 0원: 결제창 없이 서버가 바로 완료
  if (amount === 0) {
    await completeOrder(admin, order, {}); // attempt/Toss 없음
    return NextResponse.json({ ok: true, free: true, requestId });
  }

  // 8. payment_attempts(PENDING) INSERT
  const tossOrderId = generateOrderId();
  const idempotencyKey = generateIdempotencyKey();
  await createAttempt(admin, {
    orderId: order.id,
    requestId,
    tossOrderId,
    idempotencyKey,
    amount,
  });

  // 9. 응답
  const origin = process.env.APP_ORIGIN!;
  return NextResponse.json({
    ok: true,
    orderId: tossOrderId,
    amount,
    orderName: ORDER_NAME,
    customerKey: customerKeyFor(user.id),
    clientKey: process.env.TOSS_PAYMENTS_CLIENT_KEY,
    successUrl: `${origin}/upgrade/${requestId}/generating`,
    failUrl: `${origin}/upgrade/${requestId}/checkout`,
  });
}
