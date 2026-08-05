import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/supabase/error";

export type MyPageSummary = {
  email: string | null;
  joinedAt: string | null; // users.created_at

  // 최근 분석 — 재열람 가능한(유료 결과가 준비된) 건만 센다.
  // 무료 건은 결과 화면이 없어 "결과 보러가기"의 대상이 될 수 없다.
  latestRequestId: string | null;
  latestNameCount: number; // 최근 request의 name_candidates 개수
  latestAnalyzedAt: string | null; // 최근 request의 결제 완료 시각

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
    error: authError,
  } = await supabase.auth.getUser();
  // 세션 없음은 미로그인(null)으로 처리하고, 그 외 인증 오류는 전파
  if (authError && authError.name !== "AuthSessionMissingError") {
    throw authError;
  }
  if (!user) return null;

  const userId = user.id;

  // 1) 유저 정보 (email, 가입일)
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("email, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (userError) throw toError(userError);

  // 2) 최근 분석 request — 유료 결과가 준비된 건만.
  //    결제 시각 우선, 없으면 생성 시각으로 최신 판정.
  const { data: latestRequest, error: requestError } = await supabase
    .from("naming_requests")
    .select("id, paid_at, created_at")
    .eq("user_id", userId)
    .eq("status", "PREMIUM_RESULT_READY")
    .is("deleted_at", null)
    .order("paid_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (requestError) throw toError(requestError);

  // 3) 최근 request의 이름 후보 개수
  let latestNameCount = 0;
  if (latestRequest) {
    const { count, error: countError } = await supabase
      .from("name_candidates")
      .select("id", { count: "exact", head: true })
      .eq("request_id", latestRequest.id);
    if (countError) throw toError(countError);
    latestNameCount = count ?? 0;
  }

  // 4) 보유(사용 가능) 쿠폰 개수 — ACTIVE + 미만료
  const { count: activeCouponCount, error: couponError } = await supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .gt("expires_at", new Date().toISOString());
  if (couponError) throw toError(couponError);

  // 5) 최근 결제 (COMPLETED) — paid_at 기준 최신
  const { data: latestOrder, error: orderError } = await supabase
    .from("premium_orders")
    .select("amount, paid_at")
    .eq("user_id", userId)
    .eq("status", "COMPLETED")
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (orderError) throw toError(orderError);

  return {
    email: userRow?.email ?? user.email ?? null,
    joinedAt: userRow?.created_at ?? null,
    latestRequestId: latestRequest?.id ?? null,
    latestNameCount,
    latestAnalyzedAt: latestRequest?.paid_at ?? latestRequest?.created_at ?? null,
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
