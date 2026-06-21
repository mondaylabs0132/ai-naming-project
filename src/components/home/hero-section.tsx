export default function HeroSection() {
  return (
    <section
      className="bg-[#F9F7F9] overflow-hidden px-5"
      style={{
        minHeight: "420px",
        backgroundImage: "url('/hero-star.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "min(320px, 55%)",
        backgroundPosition: "right 0px top 20px",
      }}
    >
      <div className="flex items-center" style={{ minHeight: "420px" }}>
        {/* 텍스트 + CTA */}
        <div className="flex flex-col" style={{ maxWidth: "54%" }}>
          <h1
            className="font-extrabold text-[#2D2540] leading-[1.25]"
            style={{
              fontSize: "clamp(26px, 7vw, 34px)",
              letterSpacing: "-0.8px",
            }}
          >
            세상에 하나뿐인
            <br />
            우리 <span className="text-[#7C6FCD]">아이 이름</span>
          </h1>

          <p
            className="mt-3 text-[#8B849E] leading-[1.65]"
            style={{ fontSize: "clamp(12px, 3.2vw, 14px)" }}
          >
            AI와 전문가의 마음을 담아,
            <br />
            평생 부를 특별한 이름을 지어드려요.
          </p>

          <button
            className="mt-6 flex items-center gap-2 bg-[#7C6FCD] text-white font-semibold rounded-full w-fit"
            style={{
              fontSize: "clamp(13px, 3.5vw, 15px)",
              padding: "13px 20px",
              letterSpacing: "-0.1px",
              boxShadow: "0px 4px 20px rgba(124,111,205,0.40)",
            }}
          >
            AI 이름 추천 시작하기
            <span aria-hidden="true" style={{ fontSize: "16px" }}>
              →
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}