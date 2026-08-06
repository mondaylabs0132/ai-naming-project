export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { findRefundableOrder, refundOrder } from "@/lib/payments/refund";

/**
 * 사용자가 직접 요청하는 환불.
 *
 * 리퍼가 자동으로 처리해 주지만 최대 20분쯤 걸린다(5분 × 3회 + 확정).
 * 그때까지 기다리기 싫은 사용자를 위한 즉시 경로다.
 *
 * **생성이 최종 실패(FAILED)한 건에만 연다.** 정상 생성된 결과의 단순 변심
 * 환불은 약관(청약철회) 문제라 여기서 다루지 않는다.
 */
export async function POST(req: NextRequest) {
  let requestId: string | undefined;
  try {
    requestId = (await req.json())?.requestId;
  } catch {
    /* 본문 없음 */
  }
  if (!requestId) {
    return NextResponse.json({ error: "requestId_required" }, { status: 400 });
  }

  const authClient = await createServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: request } = await admin
    .from("naming_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (request.status !== "FAILED") {
    // 아직 생성 중이거나 이미 결과가 나온 건. 환불 대상이 아니다.
    return NextResponse.json(
      { error: "not_refundable", status: request.status },
      { status: 409 },
    );
  }

  const order = await findRefundableOrder(admin, requestId);
  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }
  // 결제한 본인만.
  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await refundOrder(admin, order, "사용자 환불 요청 (생성 실패)");

  if (!result.ok) {
    console.error(
      `[refund-api] 실패 requestId=${requestId} orderId=${order.id} code=${result.code}: ${result.message}`,
    );
    return NextResponse.json({ error: result.code }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    amount: result.refunded,
    alreadyRefunded: result.alreadyRefunded,
  });
}
