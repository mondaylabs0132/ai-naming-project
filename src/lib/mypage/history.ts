import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/supabase/error";

// 분석 이력 한 건. 유료 결과가 준비된 request만 대상으로 한다.
export type AnalysisHistoryItem = {
  id: string;
  analyzedAt: string | null; // 결제 시각(없으면 생성 시각)
  nameCount: number;
};

/**
 * 재열람 가능한 분석 이력을 최신순으로 조회한다.
 *
 * RLS(naming_requests: auth.uid() = user_id AND deleted_at IS NULL)가
 * 본인 건만 내주므로 user_id 조건은 걸지 않는다.
 * 상태 조건은 남겨둔다 — 무료 건은 재열람할 결과 화면이 없다.
 */
export async function getAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("naming_requests")
    .select("id, paid_at, created_at, name_candidates(count)")
    .eq("status", "PREMIUM_RESULT_READY")
    .order("paid_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw toError(error);

  type Row = {
    id: string;
    paid_at: string | null;
    created_at: string | null;
    name_candidates: { count: number }[] | null;
  };

  return ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    analyzedAt: row.paid_at ?? row.created_at,
    // PostgREST의 count 임베드는 배열 한 칸으로 온다.
    nameCount: row.name_candidates?.[0]?.count ?? 0,
  }));
}
