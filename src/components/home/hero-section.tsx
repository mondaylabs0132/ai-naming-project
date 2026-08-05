"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroSection({
  canUseFreeTrial,
}: {
  canUseFreeTrial: boolean;
}) {
  const router = useRouter();
  const [isFreeLimitModalOpen, setIsFreeLimitModalOpen] = useState(false);

  const handleClick = () => {
    if (!canUseFreeTrial) {
      setIsFreeLimitModalOpen(true);
      return;
    }

    router.push("/naming/new");
  };

  return (
    <>
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

            <button
              onClick={handleClick}
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
            </button>
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

      <FreeLimitModal
        isOpen={isFreeLimitModalOpen}
        onClose={() => setIsFreeLimitModalOpen(false)}
      />
    </>
  );
}

function FreeLimitModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-limit-modal-title"
    >
      <div className="w-full max-w-[340px] rounded-lg bg-white px-5 pb-6 pt-4 text-center shadow-card">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="ml-auto flex size-9 items-center justify-end rounded-full text-[#8B849E]"
        >
          <X className="size-5" strokeWidth={2.4} aria-hidden="true" />
        </button>

        <h2
          id="free-limit-modal-title"
          className="mt-2 text-[20px] font-extrabold leading-tight tracking-normal text-[#2D2540]"
        >
          무료 추천 제한을 초과했어요
        </h2>
        <p className="mt-3 text-[14px] leading-[1.7] tracking-normal text-[#8B849E]">
          이미 받은 결과가 있다면 유료 분석으로 더 자세한 풀이를 확인해주세요.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-[#7C6FCD] text-[16px] font-semibold leading-none tracking-normal text-white shadow-btn"
        >
          확인
        </button>
      </div>
    </div>
  );
}
