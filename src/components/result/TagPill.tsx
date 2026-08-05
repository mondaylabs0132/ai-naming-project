// AI가 붙인 태그를 의미별 색으로 보여주는 알약. 결과 목록·보관함이 공유한다.
export default function TagPill({ label }: { label: string }) {
  const base =
    "px-1.5 min-[376px]:px-2 py-[3px] text-[10px] min-[376px]:text-[11px] font-medium rounded-full whitespace-nowrap";
  const isGreen = label === "사주 조화 우수";
  const isYellow = label.includes("발음") || label.includes("기운");

  if (isGreen) {
    return (
      <span className={`${base} bg-[#E8F5E9] text-[#2E7D32]`}>{label}</span>
    );
  }
  if (isYellow) {
    return (
      <span className={`${base} bg-[#FFF8E1] text-[#F57F17]`}>{label}</span>
    );
  }
  return <span className={`${base} bg-primary-pale text-primary`}>{label}</span>;
}
