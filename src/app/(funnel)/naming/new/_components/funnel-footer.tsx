"use client";

import { ArrowRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export const TOTAL_STEPS = 5;

export type StepNumber = 1 | 2 | 3 | 4 | 5;

export type FunnelStepProps = {
  currentStep: StepNumber;
  onNext?: () => void;
  onPrev?: () => void;
};

export default function FunnelFooter({
  currentStep,
  onNext,
  onPrev,
}: FunnelStepProps) {
  const router = useRouter();
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  const handleNext = () => {
    if (isLastStep) {
      router.push("/naming/generating");
      return;
    }

    onNext?.();
  };

  return (
    <footer className="bg-bg px-11 pb-8 pt-6">
      <button
        type="button"
        onClick={handleNext}
        className="relative flex h-[72px] w-full items-center justify-center rounded-lg bg-primary px-16 text-[23px] font-semibold leading-none tracking-normal text-white shadow-btn select-none"
      >
        {isLastStep ? "이름 추천 받기" : "다음"}
        <ArrowRight
          aria-hidden="true"
          className="absolute right-8 top-1/2 size-10 -translate-y-1/2"
          strokeWidth={1.8}
        />
      </button>

      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstStep}
        className={[
          "mx-auto mt-5 flex min-h-10 items-center justify-center gap-3 text-[16px] font-semibold leading-none tracking-normal text-ink-muted select-none",
          isFirstStep ? "invisible" : "",
        ].join(" ")}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-card">
          <ChevronLeft aria-hidden="true" size={26} strokeWidth={3} />
        </span>
        이전 단계로 돌아가기
      </button>
    </footer>
  );
}
