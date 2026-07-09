import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** 적용 단계 grace (만료시간+10분) 허용. */
const GRACE_MS = 10 * 60 * 1000;

export type CouponRow = {
  id: string;
  user_id: string;
  type: "PRE_REGISTER" | "REANALYSIS";
  discount_amount: number;
  status: string;
  expires_at: string;
};

/**
 * 적용 단계 유예(grace) — 만료 시각이 지나도 이 시간(10분)까진 쿠폰 사용 허용.
 * 체크아웃 화면 진입~결제 버튼 사이에 만료선을 살짝 넘긴 유저를 구제하기 위함.
 */
export async function validateAndPriceCoupon(
  admin: SupabaseClient,
  couponId: string,
  userId: string,
): Promise<{ ok: true; discount: number; coupon: CouponRow } | { ok: false }> {
  const { data } = await admin
    .from("coupons")
    .select("id,user_id,type,discount_amount,status,expires_at")
    .eq("id", couponId)
    .maybeSingle();

  if (!data) return { ok: false };
  const c = data as CouponRow;

  if (c.user_id !== userId) return { ok: false };
  if (c.status !== "ACTIVE") return { ok: false };
  if (new Date(c.expires_at).getTime() + GRACE_MS <= Date.now()) {
    return { ok: false };
  }

  return { ok: true, discount: c.discount_amount, coupon: c };
}

/** 결제 확정 시 쿠폰 사용 처리 (조건부 ACTIVE→USED, 멱등) */
export async function markCouponUsed(admin: SupabaseClient, couponId: string) {
  const { error } = await admin
    .from("coupons")
    .update({ status: "USED", used_at: new Date().toISOString() })
    .eq("id", couponId)
    .eq("status", "ACTIVE");
  if (error) throw error;
}
