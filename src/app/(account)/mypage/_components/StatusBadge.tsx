// 쿠폰·결제·문의 목록이 공유하는 상태 배지.
// tone은 의미로 고른다 — 성공/사용가능은 green, 진행 중은 amber,
// 실패는 red, 종료된 상태는 무채색.
export type BadgeTone = "green" | "amber" | "red" | "neutral";

const TONE_CLASS: Record<BadgeTone, string> = {
  green: "bg-[#E8F5E9] text-[#2E7D32]",
  amber: "bg-[#FFF8E1] text-[#8D6E00]",
  red: "bg-[#FDECEA] text-[#B3261E]",
  neutral: "bg-[#F1F0F5] text-ink-muted",
};

export default function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: BadgeTone;
}) {
  return (
    <span
      className={`px-2 py-[3px] rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 ${TONE_CLASS[tone]}`}
    >
      {label}
    </span>
  );
}
