import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/supabase/error";

export type OrderState = "COMPLETED" | "PENDING" | "FAILED" | "CANCELED";

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
  // 결제한 분석의 결과를 다시 볼 수 있는지. 생성 실패·삭제 건은 링크를 걸지 않는다.
  isResultReadable: boolean;
};

export const ORDER_STATE_LABEL: Record<OrderState, string> = {
  COMPLETED: "결제 완료",
  PENDING: "결제 진행 중",
  FAILED: "결제 실패",
  CANCELED: "결제 취소",
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
       naming_requests ( status, deleted_at )`,
    )
    .order("created_at", { ascending: false });

  if (error) throw toError(error);

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
    isResultReadable:
      row.naming_requests?.status === "PREMIUM_RESULT_READY" &&
      row.naming_requests?.deleted_at === null,
  }));
}
