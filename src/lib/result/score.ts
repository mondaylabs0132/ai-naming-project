// score(0~100)를 별점 UI(5개)로 보여주기 위해 0~5(0.5 단위)로 환산한다.
// 목록 화면과 상세 화면이 같은 값을 보여야 하므로 한 곳에서만 정의한다.
export function scoreToStars(score: number): number {
  const stars = Math.round(score / 10) / 2; // score/20 을 0.5 단위로 반올림
  return Math.max(0, Math.min(5, stars));
}

export function scoreToLabel(score: number): string {
  if (score >= 90) return "추천도 매우 높음";
  if (score >= 70) return "추천도 높음";
  return "추천도 보통";
}

// 오행 한자 → 화면 표기용 한글. 예: 水 → "수(水)"
const OHANG_KOREAN: Record<string, string> = {
  木: "목",
  火: "화",
  土: "토",
  金: "금",
  水: "수",
};

export function ohangKey(ohang: string | null | undefined): string {
  return ohang ? (OHANG_KOREAN[ohang] ?? "") : "";
}

export function ohangLabel(ohang: string | null | undefined): string {
  const key = ohangKey(ohang);
  return key ? `${key}(${ohang})` : "";
}
