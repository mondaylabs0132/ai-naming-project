import { createClient } from "@/lib/supabase/client";

export type MyPageSummary = {
  email: string | null;
  joinedAt: string | null; // users.created_at

  // 최근 분석
  latestNameCount: number; // 최근 request의 name_candidates 개수
  latestAnalyzedAt: string | null; // 최근 request의 updated_at

  // 쿠폰
  activeCouponCount: number;

  // 결제
  latestPaidAmount: number | null; // 최근 COMPLETED 주문의 amount
  latestPaidAt: string | null; // 최근 COMPLETED 주문의 paid_at
};

/** 마이페이지 대시보드 요약값을 로그인 유저 기준으로 조회.*/
export async function getMyPageSummary(): Promise<MyPageSummary | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const userId = user.id;

  // 1) 유저 정보 (email, 가입일)
  const { data: userRow } = await supabase
    .from("users")
    .select("email, created_at")
    .eq("id", userId)
    .maybeSingle();

  // 2) 최근 분석 request (삭제되지 않은 것 중 가장 최근)
  const { data: latestRequest } = await supabase
    .from("naming_requests")
    .select("id, updated_at")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3) 최근 request의 이름 후보 개수
  let latestNameCount = 0;
  if (latestRequest) {
    const { count } = await supabase
      .from("name_candidates")
      .select("id", { count: "exact", head: true })
      .eq("request_id", latestRequest.id);
    latestNameCount = count ?? 0;
  }

  // 4) 보유(사용 가능) 쿠폰 개수 — ACTIVE + 미만료
  const { count: activeCouponCount } = await supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .gt("expires_at", new Date().toISOString());

  // 5) 최근 결제 (COMPLETED) — paid_at 기준 최신
  const { data: latestOrder } = await supabase
    .from("premium_orders")
    .select("amount, paid_at")
    .eq("user_id", userId)
    .eq("status", "COMPLETED")
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    email: userRow?.email ?? user.email ?? null,
    joinedAt: userRow?.created_at ?? null,
    latestNameCount,
    latestAnalyzedAt: latestRequest?.updated_at ?? null,
    activeCouponCount: activeCouponCount ?? 0,
    latestPaidAmount: latestOrder?.amount ?? null,
    latestPaidAt: latestOrder?.paid_at ?? null,
  };
}

/** 날짜를 Asia/Seoul 기준 YYYY.MM.DD 로 포맷 */
export function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

/** 금액을 "-원" 형태로 포맷 */
export function formatWon(amount: number | null): string {
  if (amount == null) return "-";
  return `${amount.toLocaleString("ko-KR")}원`;
}
