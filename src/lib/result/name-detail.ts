import type { SupabaseClient } from "@supabase/supabase-js";

// 상세 페이지에서 쓰는 사격(수리) 한 칸.
export type DetailGridItem = {
  label: string; // 원격/형격/이격/정격/총격
  stroke: number;
  luck: "good" | "bad" | "mixed";
  description: string;
};

// name_candidates 한 행을 상세 화면 표시용으로 정규화한 형태.
export type NameDetailData = {
  id: string;
  rank: number; // score 내림차순(동점 시 sound_score) 기준 순위. 목록 화면과 동일 규칙.
  totalCount: number;

  fullHangul: string; // 성 + 이름
  fullHanja: string;
  givenHangul: string;
  givenHanja: string;

  hanja1: string;
  hanja2: string;
  hangul1: string; // 한자 독음
  hangul2: string;
  meanings1: string[]; // "준수할 준" 형태의 훈+음 전체
  meanings2: string[];
  ohang1: string | null;
  ohang2: string | null;

  score: number;
  totalStrokes: number;
  summary: string; // meaning_summary
  tags: string[];
  categories: { title: string; description: string }[];

  sajuSummary: string; // saju_summary[0]
  ohangSummary: string; // saju_summary[1]
  numerologySummary: string;
  grids: DetailGridItem[];

  soundScore: number;
  soundOhangList: string[];
  soundDetails: string[];

  detailBody: string; // AI 상세 해설 본문

  isFavorite: boolean; // 로그인 유저가 이 이름을 보관함에 담아뒀는지
};

// 화면에 필요한 컬럼만 명시적으로 조회한다(select * 지양).
const DETAIL_COLUMNS = [
  "id",
  "name_hangul",
  "name_hanja",
  "given_name_hangul",
  "given_name_hanja",
  "hanja1",
  "hanja2",
  "hangul1",
  "hangul2",
  "meaning1",
  "meaning2",
  "meaning_summary",
  "saju_summary",
  "numerology_summary",
  "detail_body",
  "detailed_explanation",
  "tags",
  "categories",
  "grids",
  "total_strokes",
  "score",
  "ohang1",
  "ohang2",
  "sound_score",
  "sound_ohang_list",
  "sound_details",
].join(", ");

const GRID_LABELS = ["원격", "형격", "이격", "정격", "총격"] as const;

// 한자 사전의 뜻(訓) 배열을 "훈+음" 표시형으로 변환. 예: ["준수할"] + "준" → ["준수할 준"]
function buildMeanings(meanings: unknown, reading: string): string[] {
  if (!Array.isArray(meanings)) return [];
  return meanings
    .map((m) => String(m).trim())
    .filter(Boolean)
    .map((m) => (reading ? `${m} ${reading}` : m));
}

function buildGrids(raw: unknown): DetailGridItem[] {
  if (!raw || typeof raw !== "object") return [];
  const grids = raw as Record<
    string,
    { stroke?: unknown; luck?: unknown; description?: unknown }
  >;

  return GRID_LABELS.flatMap((label) => {
    const item = grids[label];
    if (!item || typeof item.stroke !== "number") return [];

    // jsonb는 타입 보장이 없으므로 luck/description을 런타임에서 정규화한다.
    const luck: DetailGridItem["luck"] =
      item.luck === "good" || item.luck === "bad" || item.luck === "mixed"
        ? item.luck
        : "mixed";

    return [
      {
        label,
        stroke: item.stroke,
        luck,
        description:
          typeof item.description === "string" ? item.description : "",
      },
    ];
  });
}

/**
 * 특정 이름 후보 1건을 상세 화면용으로 조회한다.
 *
 * request_id로 후보 전체를 가져온 뒤 그 안에서 nameId를 찾는다.
 * 이렇게 하면 (1) 다른 결과의 이름을 끼워 넣는 요청이 자연스럽게 차단되고,
 * (2) 목록 화면과 동일한 정렬 규칙으로 순위를 계산할 수 있다.
 * 후보는 요청당 수십 건 수준이라 한 번에 읽어도 부담이 없다.
 *
 * @returns 해당 요청에 속한 이름이 아니면 null
 */
export async function fetchNameDetail(
  supabase: SupabaseClient,
  requestId: string,
  nameId: string,
): Promise<NameDetailData | null> {
  const { data, error } = await supabase
    .from("name_candidates")
    .select(DETAIL_COLUMNS)
    .eq("request_id", requestId)
    .order("score", { ascending: false })
    .order("sound_score", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const index = rows.findIndex((row) => row.id === nameId);
  if (index === -1) return null;

  const row = rows[index];

  // 보관함 담김 여부. RLS가 본인 행만 보여주므로 user_id 조건은 걸지 않는다.
  // 실패해도 상세 화면 자체는 보여줘야 하므로 에러를 전파하지 않고 false로 둔다.
  const { data: favorite } = await supabase
    .from("name_favorites")
    .select("name_candidate_id")
    .eq("name_candidate_id", nameId)
    .maybeSingle();

  const saju = Array.isArray(row.saju_summary) ? (row.saju_summary as string[]) : [];
  const hangul1 = (row.hangul1 as string) ?? "";
  const hangul2 = (row.hangul2 as string) ?? "";

  return {
    id: row.id as string,
    rank: index + 1,
    totalCount: rows.length,

    fullHangul: (row.name_hangul as string) ?? "",
    fullHanja: (row.name_hanja as string) ?? "",
    givenHangul: (row.given_name_hangul as string) ?? "",
    givenHanja: (row.given_name_hanja as string) ?? "",

    hanja1: (row.hanja1 as string) ?? "",
    hanja2: (row.hanja2 as string) ?? "",
    hangul1,
    hangul2,
    meanings1: buildMeanings(row.meaning1, hangul1),
    meanings2: buildMeanings(row.meaning2, hangul2),
    ohang1: (row.ohang1 as string | null) ?? null,
    ohang2: (row.ohang2 as string | null) ?? null,

    score: (row.score as number) ?? 0,
    totalStrokes: (row.total_strokes as number) ?? 0,
    summary: (row.meaning_summary as string) ?? "",
    tags: (row.tags as string[]) ?? [],
    categories: (row.categories as NameDetailData["categories"]) ?? [],

    sajuSummary: saju[0] ?? "",
    ohangSummary: saju[1] ?? "",
    numerologySummary: (row.numerology_summary as string) ?? "",
    grids: buildGrids(row.grids),

    soundScore: (row.sound_score as number) ?? 0,
    soundOhangList: (row.sound_ohang_list as string[]) ?? [],
    soundDetails: (row.sound_details as string[]) ?? [],

    // detail_body 도입 이전 행은 빈 값이므로 합본 문자열로 폴백한다.
    detailBody:
      ((row.detail_body as string) || (row.detailed_explanation as string)) ?? "",

    isFavorite: Boolean(favorite),
  };
}
