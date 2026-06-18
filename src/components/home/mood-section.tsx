const MOODS = [
  { label: "부드러운", bg: "#FFF0F3", color: "#E8638C" },
  { label: "특별한", bg: "#EAE7F8", color: "#7C6FCD" },
  { label: "차분한", bg: "#EEF6FF", color: "#5B8DD9" },
  { label: "따뜻한", bg: "#FFF4E0", color: "#E8963A" },
];

export default function MoodSection() {
  return (
    <section className="px-4 pt-6 pb-8">
      <h2
        className="text-center font-semibold text-[#2D2540] mb-5"
        style={{ fontSize: "16px", letterSpacing: "-0.2px" }}
      >
        어떤 느낌의 이름을 원하시나요?{" "}
        <span className="text-[#7C6FCD]">✦</span>
      </h2>

      {/* 4열 1행 */}
      <div className="grid grid-cols-4 gap-[10px]">
        {MOODS.map((mood) => (
          <div
            key={mood.label}
            className="rounded-[16px] flex flex-col items-center justify-center gap-[8px]"
            style={{
              backgroundColor: mood.bg,
              paddingTop: "18px",
              paddingBottom: "14px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/star.png" alt="" style={{ width: "34px", height: "34px", objectFit: "contain" }} />
            <span
              className="font-semibold text-center"
              style={{ fontSize: "12px", color: mood.color }}
            >
              {mood.label}
            </span>
          </div>
        ))}
      </div>

      {/* 안내 텍스트 */}
      <p
        className="text-center text-[#8B849E] mt-5 leading-[1.7]"
        style={{ fontSize: "13px" }}
      >
        원하는 느낌을 선택하면{" "}
        <span className="text-[#7C6FCD] font-medium">↗</span>
        <br />
        더 잘 어울리는 이름을 추천해드려요 💜
      </p>
    </section>
  );
}
