import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/supabase/error";

// 쿠폰의 화면 표시 상태.
// DB의 status만으로는 부족하다 — ACTIVE인데 만료일이 지난 건이 있어
// 그대로 두면 "사용 가능"으로 잘못 보인다.
export type CouponState = "AVAILABLE" | "USED" | "EXPIRED";

export type CouponItem = {
  id: string;
  state: CouponState;
  typeLabel: string;
  discountAmount: number;
  issuedAt: string | null;
  expiresAt: string | null;
  usedAt: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  REANALYSIS: "재분석 할인",
};

export const COUPON_STATE_LABEL: Record<CouponState, string> = {
  AVAILABLE: "사용 가능",
  USED: "사용 완료",
  EXPIRED: "기간 만료",
};

/** 쿠폰 전체를 최신 발급순으로 조회. RLS가 본인 것만 내준다. */
export async function getCoupons(): Promise<CouponItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("coupons")
    .select("id, type, discount_amount, status, expires_at, used_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw toError(error);

  const now = Date.now();

  type Row = {
    id: string;
    type: string | null;
    discount_amount: number | null;
    status: string | null;
    expires_at: string | null;
    used_at: string | null;
    created_at: string | null;
  };

  return ((data ?? []) as Row[]).map((row) => {
    const expired =
      row.expires_at !== null && new Date(row.expires_at).getTime() <= now;

    // 사용 완료가 만료보다 우선한다. 이미 쓴 쿠폰을 "기간 만료"로
    // 표시하면 쓰지 못하고 날린 것처럼 읽힌다.
    const state: CouponState =
      row.status === "USED" ? "USED" : expired ? "EXPIRED" : "AVAILABLE";

    return {
      id: row.id,
      state,
      typeLabel: TYPE_LABEL[row.type ?? ""] ?? "할인 쿠폰",
      discountAmount: row.discount_amount ?? 0,
      issuedAt: row.created_at,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
    };
  });
}
