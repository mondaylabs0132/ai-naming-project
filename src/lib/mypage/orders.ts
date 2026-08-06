import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/supabase/error";

// premium_orders.status의 CHECK 제약과 같은 집합이어야 한다.
// 하나라도 빠지면 ORDER_STATE_LABEL 조회가 undefined가 되어 배지가 빈다.
export type OrderState =
  | "COMPLETED"
  | "PENDING"
  | "PROCESSING"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED";

export type RefundRecord = {
  id: string;
  amount: number;
  reason: string;
  refundedAt: string | null;
  /** 쿠폰을 되살려 준 건인지. 0원 결제는 돈이 아니라 쿠폰이 돌아간다. */
  restoredCoupon: boolean;
};

export type OrderItem = {
  id: string;
  requestId: string;
  state: OrderState;
  originalAmount: number;
  discountAmount: number;
  amount: number;
  usedCoupon: boolean;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string | null;
  refundedAt: string | null;
  refundAmount: number | null;
  refundReason: string | null;
  // 이 주문에서 지금까지 일어난 환불 전부(최신순).
  // 주문 행은 재구매 시 되살려 쓰느라 위 refund* 필드가 지워지므로,
  // 과거 환불은 이쪽에만 남는다.
  refundHistory: RefundRecord[];
  // 결제한 분석의 결과를 다시 볼 수 있는지. 생성 실패·삭제 건은 링크를 걸지 않는다.
  isResultReadable: boolean;
};

export const ORDER_STATE_LABEL: Record<OrderState, string> = {
  COMPLETED: "결제 완료",
  PENDING: "결제 진행 중",
  PROCESSING: "결제 진행 중",
  FAILED: "결제 실패",
  CANCELED: "결제 취소",
  REFUNDED: "환불 완료",
};

/**
 * 결제 내역 전체를 최신순으로 조회한다.
 *
 * 실패·진행 중 주문도 함께 보여준다. 성공 건만 노출하면
 * "결제했는데 내역에 없다"는 문의를 부르고, 실제 실패 여부를 확인할 방법이 없다.
 * 대신 상태 라벨을 반드시 함께 표시해야 한다.
 */
export async function getOrders(): Promise<OrderItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("premium_orders")
    .select(
      `id, request_id, status, original_amount, discount_amount, amount,
       coupon_id, paid_at, failed_at, failure_reason, created_at,
       refunded_at, refund_amount, refund_reason,
       naming_requests ( status, deleted_at )`,
    )
    .order("created_at", { ascending: false });

  if (error) throw toError(error);

  // 환불 이력은 별도 테이블에 있다. 주문에 임베드하지 않고 따로 읽는 이유는
  // premium_orders ↔ refunds에 선언된 FK가 없으면 PostgREST 중첩 조회가
  // 안 되기도 하고, 건수가 적어 한 번 더 읽는 비용이 무의미하기 때문이다.
  const { data: refundRows, error: refundError } = await supabase
    .from("refunds")
    .select("id, premium_order_id, amount, reason, coupon_id, refunded_at")
    .order("refunded_at", { ascending: false });

  if (refundError) throw toError(refundError);

  type RefundRow = {
    id: string;
    premium_order_id: string;
    amount: number | null;
    reason: string | null;
    coupon_id: string | null;
    refunded_at: string | null;
  };

  const refundsByOrder = new Map<string, RefundRecord[]>();
  for (const r of (refundRows ?? []) as RefundRow[]) {
    const list = refundsByOrder.get(r.premium_order_id) ?? [];
    list.push({
      id: r.id,
      amount: r.amount ?? 0,
      reason: r.reason ?? "",
      refundedAt: r.refunded_at,
      // 0원 결제는 돌려줄 돈이 없다. 이때 환불의 실체는 쿠폰 복원이라
      // "0원 환불"로만 보이면 사용자가 아무것도 못 받았다고 오해한다.
      restoredCoupon: (r.amount ?? 0) === 0 && r.coupon_id !== null,
    });
    refundsByOrder.set(r.premium_order_id, list);
  }

  type Row = {
    id: string;
    request_id: string;
    status: string | null;
    original_amount: number | null;
    discount_amount: number | null;
    amount: number | null;
    coupon_id: string | null;
    paid_at: string | null;
    failed_at: string | null;
    failure_reason: string | null;
    created_at: string | null;
    refunded_at: string | null;
    refund_amount: number | null;
    refund_reason: string | null;
    naming_requests: { status: string | null; deleted_at: string | null } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    requestId: row.request_id,
    state: (row.status ?? "PENDING") as OrderState,
    originalAmount: row.original_amount ?? 0,
    discountAmount: row.discount_amount ?? 0,
    amount: row.amount ?? 0,
    usedCoupon: row.coupon_id !== null,
    paidAt: row.paid_at,
    failedAt: row.failed_at,
    failureReason: row.failure_reason,
    createdAt: row.created_at,
    refundedAt: row.refunded_at,
    refundAmount: row.refund_amount,
    refundReason: row.refund_reason,
    refundHistory: refundsByOrder.get(row.id) ?? [],
    isResultReadable:
      row.naming_requests?.status === "PREMIUM_RESULT_READY" &&
      row.naming_requests?.deleted_at === null,
  }));
}
