import { createClient } from "@/lib/supabase/client";
import { toError } from "@/lib/supabase/error";
import { scoreToLabel, scoreToStars } from "@/lib/result/score";

// 보관함 카드 하나. 여러 분석에 걸친 이름이 한 목록에 섞이므로
// 결과 목록과 달리 순위(rank)는 갖지 않고, 어느 분석의 이름인지를 함께 보여준다.
export type BookmarkItem = {
  id: string; // name_candidates.id — 저장 해제·상세 링크의 키
  requestId: string;
  name: string;
  hanja: string;
  stars: number;
  label: string;
  desc: string;
  tags: string[];
  score: number;
  savedAt: string | null; // name_favorites.created_at
  analyzedAt: string | null; // 원본 분석 완료 시각
  isReadable: boolean; // 유료 결과가 준비된 분석만 상세로 이동 가능
};

// 저장한 이름이 속한 분석 결과. 상세 링크와 분석일 캡션에 쓴다.
type FavoriteRow = {
  created_at: string | null;
  name_candidates: {
    id: string;
    request_id: string;
    given_name_hangul: string | null;
    given_name_hanja: string | null;
    meaning_summary: string | null;
    tags: string[] | null;
    score: number | null;
    naming_requests: {
      status: string | null;
      updated_at: string | null;
    } | null;
  } | null;
};

// 저장 목록 조회. user_id 조건을 걸지 않고 RLS(auth.uid() = user_id)에 의존한다.
// — 결과 목록 화면의 좋아요 조회와 같은 전제다.
export async function getBookmarks(): Promise<BookmarkItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("name_favorites")
    .select(
      `created_at,
       name_candidates!inner (
         id, request_id, given_name_hangul, given_name_hanja,
         meaning_summary, tags, score,
         naming_requests!inner ( status, updated_at )
       )`,
    )
    .order("created_at", { ascending: false });

  if (error) throw toError(error);

  const rows = (data ?? []) as unknown as FavoriteRow[];

  return rows.flatMap((row) => {
    const c = row.name_candidates;
    // 후보가 삭제된 저장 행은 보여줄 게 없으므로 조용히 건너뛴다.
    if (!c) return [];

    const score = c.score ?? 0;

    return [
      {
        id: c.id,
        requestId: c.request_id,
        name: c.given_name_hangul ?? "",
        hanja: c.given_name_hanja ?? "",
        stars: scoreToStars(score),
        label: scoreToLabel(score),
        desc: c.meaning_summary ?? "",
        tags: c.tags ?? [],
        score,
        savedAt: row.created_at,
        analyzedAt: c.naming_requests?.updated_at ?? null,
        // 현재 RLS(can_read_premium_name_candidate)가 PREMIUM_RESULT_READY·미삭제 건만
        // 내주므로 여기 도달한 항목은 사실상 항상 true다.
        // 정책이 바뀌어 404 링크가 생기는 걸 막는 방어선으로 남겨둔다.
        isReadable: c.naming_requests?.status === "PREMIUM_RESULT_READY",
      },
    ];
  });
}

// 저장 해제. RLS가 본인 행만 지우도록 보장한다.
export async function removeBookmark(candidateId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("name_favorites")
    .delete()
    .eq("name_candidate_id", candidateId);

  if (error) throw toError(error);
}

// 저장 추가. 상세 화면의 "보관함에 담기"와 보관함의 "되돌리기"가 함께 쓴다.
export async function addBookmark(
  userId: string,
  candidateId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("name_favorites")
    .insert({ user_id: userId, name_candidate_id: candidateId });

  if (error) throw toError(error);
}
