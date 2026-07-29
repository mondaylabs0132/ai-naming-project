import Link from "next/link";
import type { ReactNode } from "react";

// 이용약관 / 개인정보 처리방침 등 정적 법적 문서용 공통 레이아웃.
// 자체 헤더(뒤로가기 + 제목)를 가지며, top-nav / bottom-nav 는 각 nav 컴포넌트에서 숨김 처리.
export default function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 flex items-center gap-1 bg-bg/80 px-3 py-3 backdrop-blur-md">
        <Link
          href="/"
          aria-label="홈으로"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-section-title font-semibold text-ink">{title}</h1>
      </header>

      <main className="px-5 pb-16 pt-2">
        {effectiveDate && (
          <p className="mb-6 text-caption text-ink-light">
            시행일: {effectiveDate}
          </p>
        )}
        <div className="flex flex-col gap-7 text-body leading-[1.7] text-ink-muted">
          {children}
        </div>
      </main>
    </div>
  );
}

// 문서 내 조(條) 단위 섹션.
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-body font-semibold text-ink">{heading}</h2>
      {children}
    </section>
  );
}
