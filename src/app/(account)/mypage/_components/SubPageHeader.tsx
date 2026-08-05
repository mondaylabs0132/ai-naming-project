"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// 마이페이지 하위 화면(분석 이력·쿠폰·결제·문의)이 공유하는 상단 바.
// 상세 화면과 같은 형태라 이동 경험이 이어진다.
export default function SubPageHeader({ title }: { title: string }) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-10 flex items-center px-4 h-14 bg-white"
      style={{ borderBottom: "1px solid #f0eeff" }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center justify-center w-9 h-9 -ml-1 shrink-0"
        aria-label="뒤로 가기"
      >
        <ArrowLeft size={22} className="text-ink" />
      </button>
      <span className="flex-1 text-center font-semibold text-ink text-section-title">
        {title}
      </span>
      {/* 좌측 버튼과 폭을 맞춰 제목을 가운데 유지 */}
      <span className="w-9 shrink-0" aria-hidden="true" />
    </header>
  );
}
