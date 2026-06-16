export default function HeroSection() {
  return (
    <section
      className="relative bg-[#F9F7F9] overflow-hidden"
      style={{ minHeight: "400px" }}
    >
      {/* 3D 별 캐릭터 영역 — 에셋 추가 시 img 태그로 교체 */}
      <div
        className="absolute right-0 top-0"
        style={{ width: "58%", height: "340px" }}
      />

      {/* 반짝이 장식 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/star.png" alt="" className="absolute pointer-events-none select-none" style={{ right: "22px", top: "28px", width: "20px", height: "20px", objectFit: "contain" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/star.png" alt="" className="absolute pointer-events-none select-none opacity-60" style={{ right: "80px", top: "12px", width: "13px", height: "13px", objectFit: "contain" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/star.png" alt="" className="absolute pointer-events-none select-none opacity-40" style={{ right: "14px", top: "110px", width: "9px", height: "9px", objectFit: "contain" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/star.png" alt="" className="absolute pointer-events-none select-none opacity-60" style={{ right: "130px", top: "58px", width: "10px", height: "10px", objectFit: "contain" }} />

      {/* 텍스트 + CTA */}
      <div className="px-5 pt-[88px] pb-10" style={{ maxWidth: "62%" }}>
        <h1
          className="font-extrabold text-[#2D2540] leading-[1.25]"
          style={{ fontSize: "34px", letterSpacing: "-0.8px" }}
        >
          세상에 하나뿐인
          <br />
          우리{" "}
          <span className="text-[#7C6FCD]">아이 이름</span>
        </h1>
        <p
          className="mt-3 text-[#8B849E] leading-[1.6]"
          style={{ fontSize: "14px" }}
        >
          AI와 전문가의 마음을 담아,
          <br />
          평생 부를 특별한 이름을 지어드려요.
        </p>
        <button
          className="mt-6 flex items-center gap-2 bg-[#7C6FCD] text-white font-semibold rounded-full"
          style={{
            fontSize: "15px",
            padding: "13px 22px",
            letterSpacing: "-0.1px",
            boxShadow: "0px 4px 20px rgba(124,111,205,0.40)",
          }}
        >
          AI 이름 추천 시작하기
          <span style={{ fontSize: "16px" }}>→</span>
        </button>
      </div>

      {/* 스크롤 유도 */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[#8B849E]"
        style={{ fontSize: "18px" }}
      >
        ∨
      </div>
    </section>
  );
}
