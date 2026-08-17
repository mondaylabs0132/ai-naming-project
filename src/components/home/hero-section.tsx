import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-[#F9F7F9] pl-5 my-12">
      <div className="flex items-center gap-2">
        {/* 왼쪽: 텍스트 + CTA */}
        <div className="flex flex-col min-w-0" style={{ flex: "1 1 56%" }}>
          <h1
            className="font-extrabold text-[#2D2540] leading-tight"
            style={{
              fontSize: "clamp(22px, 6vw, 32px)",
              letterSpacing: "-0.6px",
            }}
          >
            세상에 하나뿐인
            <br />
            우리 <span className="text-[#7C6FCD]">아이 이름</span>
          </h1>

          <p
            className="mt-3 text-[#8B849E] leading-[1.6]"
            style={{ fontSize: "clamp(11px, 3vw, 14px)" }}
          >
            AI와 전문가의 마음을 담아,
            <br />
            평생 부를 특별한 이름을 지어드려요
          </p>

          {/* 무료 횟수 소진 여부와 무관하게 항상 설문으로 보낸다.
              소진된 사용자는 설문을 마친 뒤 결제 안내를 받는다. */}
          <Link
            href="/naming/new"
            className="mt-6 flex items-center justify-center gap-1.5 bg-[#7C6FCD] text-white font-semibold rounded-full w-fit whitespace-nowrap"
            style={{
              fontSize: "clamp(12px, 3.2vw, 15px)",
              padding: "10px 14px",
              letterSpacing: "-0.2px",
              boxShadow: "0px 4px 20px rgba(124,111,205,0.40)",
            }}
          >
            AI 이름 추천 시작하기
            <span aria-hidden="true" style={{ fontSize: "1em" }}>
              →
            </span>
          </Link>
        </div>

        {/* 오른쪽: 히어로 이미지 */}
        <div
          className="flex items-center justify-center min-w-0"
          style={{ flex: "1 1 50%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/hero-star.png"
            alt=""
            aria-hidden="true"
            className="w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
