// 사업자 등록 정보 푸터 (예시 데이터 — 실제 값으로 교체하세요)
const BUSINESS_INFO = [
  { label: "상호명", value: "먼데이랩스" },
  { label: "대표자명", value: "예병수" },
  { label: "사업자등록번호", value: "203-35-93380" },
  {
    label: "사업장 주소",
    value: "서울특별시 강남구 학동로56길 26, 6층 600-4호",
  },
  { label: "전화번호", value: "010-2873-0132" },
  { label: "이메일", value: "mondaylabs0132@gmail.com" },
];

export default function Footer() {
  return (
    <footer
      className="mt-10 border-t border-divider bg-surface-section px-5 pt-6"
      // bottom nav(고정, 64px) + iOS safe-area 만큼 하단 여백을 확보해
      // 마지막 줄이 하단 탭바에 가려지지 않게 함
      style={{
        paddingBottom: "calc(4rem + env(safe-area-inset-bottom) + 1rem)",
      }}
    >
      <p className="mb-3 text-caption font-semibold text-ink">첫지음</p>

      <dl className="flex flex-col gap-1.5">
        {BUSINESS_INFO.map(({ label, value }) => (
          <div key={label} className="flex gap-2 text-nav leading-[1.6]">
            <dt className="w-19 shrink-0 text-ink-light">{label}</dt>
            <dd className="text-ink-muted">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-nav text-ink-light">
        © 2026 먼데이랩스. All rights reserved.
      </p>
    </footer>
  );
}
