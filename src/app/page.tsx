import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-20 text-[#1d1d1f]">
      <section className="flex max-w-[820px] flex-col items-center text-center">
        <p className="text-[14px] font-normal leading-[1.43] tracking-[-0.224px] text-[#7a7a7a]">
          AI 작명소
        </p>

        <h1 className="mt-6 text-[56px] font-semibold leading-[1.07] tracking-[-0.28px]">
          이름 하나로,
          <br />
          시작이 달라집니다.
        </h1>

        <p className="mt-8 text-[28px] font-normal leading-[1.14] tracking-[0.196px] text-[#1d1d1f]">
          다섯 가지 질문에 답하면, AI가 당신만의 이름을 지어드려요.
        </p>

        <Link
          href="/naming/new"
          className="mt-12 inline-flex items-center justify-center rounded-full bg-[#0066cc] px-[22px] py-[11px] text-[17px] font-normal leading-[1.47] tracking-[-0.374px] text-white transition-transform duration-100 active:scale-95 focus:outline-2 focus:outline-offset-2 focus:outline-[#0071e3]"
        >
          이름 지으러 가기
        </Link>

        <p className="mt-6 text-[12px] font-normal leading-[1.0] tracking-[-0.12px] text-[#7a7a7a]">
          무료로 시작 · 가입 없이 바로
        </p>
      </section>
    </main>
  );
}
