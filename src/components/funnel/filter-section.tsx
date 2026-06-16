const FILTERS = [
  { label: "느낌", display: "❤️" },
  { label: "한 글자", display: "🧵" },
  { label: "부모 이름", display: "👨‍👩‍👧" },
  { label: "선호 한자", display: "漢", isChar: true },
];

export default function FilterSection() {
  return (
    <section className="pt-2 pb-8">
      <p className="text-center text-[12px] text-[#8B849E] mb-4">
        원하는 조건을 자유롭게 선택
      </p>
      <div
        className="flex gap-3 overflow-x-auto"
        style={{ scrollbarWidth: "none", paddingInline: "20px" }}
      >
        {FILTERS.map((f) => (
          <div
            key={f.label}
            className="flex-none flex items-center gap-[7px] bg-white rounded-full border border-[#EEEBF8] whitespace-nowrap"
            style={{ padding: "10px 16px" }}
          >
            <span
              className={
                f.isChar
                  ? "text-[15px] font-bold text-[#7C6FCD]"
                  : "text-[15px]"
              }
            >
              {f.display}
            </span>
            <span className="text-[13px] font-medium text-[#2D2540]">
              {f.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
