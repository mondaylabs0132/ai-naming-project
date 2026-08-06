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

/** 환불로 되살린 쿠폰에 다시 주는 유효기간. */
const RESTORE_EXTENSION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * 환불 시 쿠폰 원상복구 (조건부 USED→ACTIVE, 멱등).
 *
 * 이미 만료됐으면 유효기간을 다시 준다. 사용자가 쿠폰을 못 쓴 이유가
 * 우리 쪽 생성 실패이므로, 껍데기만 돌려주면 환불이 아니다.
 */
export async function restoreCoupon(admin: SupabaseClient, couponId: string) {
  const { data } = await admin
    .from("coupons")
    .select("expires_at")
    .eq("id", couponId)
    .maybeSingle();

  const patch: Record<string, unknown> = { status: "ACTIVE", used_at: null };
  if (data && new Date(data.expires_at as string).getTime() <= Date.now()) {
    patch.expires_at = new Date(Date.now() + RESTORE_EXTENSION_MS).toISOString();
  }

  const { error } = await admin
    .from("coupons")
    .update(patch)
    .eq("id", couponId)
    .eq("status", "USED");
  if (error) throw error;
}

/**
 * '출생 전' 결제 완료자에게 무료재분석 쿠폰을 1장 발급한다.
 *
 * - 대상 request 가 '출생 전'이 아니면 아무것도 하지 않는다.
 * - UNIQUE(original_request_id) 로 멱등 — 혹시 두 번 불려도 DB가 중복을 막는다.
 * - 쿠폰 발급 실패가 결제 확정(본 흐름)을 절대 막지 않도록, 에러는 삼키고 로깅만 한다.
 */
export async function ensureReanalysisCoupon(
  admin: SupabaseClient,
  params: { requestId: string; userId: string },
) {
  // 1) 대상 request 가 '출생 전'인지 확인
  const { data: survey } = await admin
    .from("naming_surveys")
    .select("birth_status")
    .eq("request_id", params.requestId)
    .maybeSingle();

  if (survey?.birth_status !== "BEFORE_BIRTH") return; // 출생 후 → 발급 안 함

  // 2) 쿠폰 발급
  const { error } = await admin.from("coupons").insert({
    user_id: params.userId,
    original_request_id: params.requestId,
    type: "REANALYSIS",
    discount_amount: 19900,
  });

  // 23505(unique_violation) = 이미 발급됨 → 정상으로 간주. 그 외 에러만 로깅.
  if (error && error.code !== "23505") {
    console.error("ensureReanalysisCoupon failed", error);
  }
}
