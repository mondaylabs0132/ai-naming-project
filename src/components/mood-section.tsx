const MOODS = [
  { label: "부드러운", emoji: "🩷", bg: "#FFF0F3" },
  { label: "특별한", emoji: "⭐", bg: "#EAE7F8" },
  { label: "차분한", emoji: "🌙", bg: "#EEF6FF" },
  { label: "따뜻한", emoji: "☀️", bg: "#FFF4E0" },
];

export default function MoodSection() {
  return (
    <section className="px-5 pt-4 pb-8">
      <h2 className="text-center text-[16px] font-semibold text-[#2D2540] mb-5 tracking-[-0.2px]">
        어떤 느낌의 이름을 원하시나요?{" "}
        <span className="text-[#7C6FCD]">✦</span>
      </h2>

      {/* 4 cards — single horizontal row */}
      <div className="grid grid-cols-4 gap-[10px]">
        {MOODS.map((mood) => (
          <div
            key={mood.label}
            className="rounded-[18px] bg-white flex flex-col items-center pt-3 pb-3 gap-2"
            style={{ boxShadow: "0px 2px 12px rgba(124,111,205,0.08)" }}
          >
            {/* Icon area */}
            <div
              className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-[28px]"
              style={{ backgroundColor: mood.bg }}
            >
              {mood.emoji}
            </div>
            {/* Label */}
            <span className="text-[12px] font-semibold text-[#2D2540] text-center leading-tight">
              {mood.label}
            </span>
          </div>
        ))}
      </div>

      {/* Guide text */}
      <p className="text-center text-[13px] text-[#8B849E] mt-5 leading-[1.7]">
        원하는 느낌을 선택하면{" "}
        <span className="text-[#7C6FCD] font-medium">↗</span>
        <br />
        더 잘 어울리는 이름을 추천해드려요 💜
      </p>
    </section>
  );
}
