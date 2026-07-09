import "server-only";

import { createHash, randomUUID } from "crypto";

const TOSS_API = "https://api.tosspayments.com/v1";

/** Toss 결제 객체(필요 필드만). 나머지는 raw로 보존. */
export type TossPayment = {
  paymentKey: string;
  orderId: string;
  /** 'DONE' | 'CANCELED' | 'ABORTED' | 'EXPIRED' | 'WAITING_FOR_DEPOSIT' | ... */
  status: string;
  totalAmount: number;
  method?: string;
  approvedAt?: string;
  [k: string]: unknown;
};

/**
 * confirm 결과 3분류 (§5-2 실패 처리).
 * - success: 승인 성공
 * - rejected: 명확한 실패(A) — 카드 거절 등 4xx. 돈 안 나감이 확실.
 * - indeterminate: 애매한 실패(B) — 타임아웃/네트워크/5xx. 돈이 나갔을 수 있음.
 */
export type TossConfirmResult =
  | { ok: true; payment: TossPayment }
  | { ok: false; kind: "rejected"; code: string; message: string; raw: unknown }
  | { ok: false; kind: "indeterminate"; message: string };

function authHeader() {
  const secret = process.env.TOSS_PAYMENTS_SECRET_KEY!;
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

/** Toss orderId (UNIQUE). 6~64자 영숫자/-_= 제약을 만족. */
export function generateOrderId() {
  return `order_${randomUUID().replace(/-/g, "")}`;
}

/** 중복 승인 방지 Idempotency-Key. */
export function generateIdempotencyKey() {
  return randomUUID();
}

/** 유저별 고정 customerKey (id 노출 방지 위해 해시). */
export function customerKeyFor(userId: string) {
  return createHash("sha256").update(userId).digest("hex").slice(0, 40);
}

/** Toss 승인 API 호출. 결과를 성공/명확실패/애매실패로 분류해 반환 */
export async function confirmPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
  idempotencyKey: string;
}): Promise<TossConfirmResult> {
  let res: Response;
  try {
    res = await fetch(`${TOSS_API}/payments/confirm`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({
        paymentKey: params.paymentKey,
        orderId: params.orderId,
        amount: params.amount,
      }),
    });
  } catch (e) {
    // 네트워크/타임아웃 → 애매(B)
    return { ok: false, kind: "indeterminate", message: (e as Error).message };
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    body = null;
  }

  if (res.ok && body && typeof body.status === "string") {
    return { ok: true, payment: body as TossPayment };
  }

  // 5xx → 애매(B), 4xx → 명확한 거절(A)
  if (res.status >= 500) {
    return {
      ok: false,
      kind: "indeterminate",
      message: (body?.message as string) ?? `toss_${res.status}`,
    };
  }
  return {
    ok: false,
    kind: "rejected",
    code: (body?.code as string) ?? `HTTP_${res.status}`,
    message: (body?.message as string) ?? "payment rejected",
    raw: body,
  };
}

/** orderId로 Toss 결제 진실 조회 (webhook 검증 / 애매실패 확인용). */
export async function getPaymentByOrderId(
  orderId: string,
): Promise<TossPayment | null> {
  try {
    const res = await fetch(
      `${TOSS_API}/payments/orders/${encodeURIComponent(orderId)}`,
      { headers: { Authorization: authHeader() } },
    );
    if (!res.ok) return null;
    return (await res.json()) as TossPayment;
  } catch {
    return null;
  }
}
