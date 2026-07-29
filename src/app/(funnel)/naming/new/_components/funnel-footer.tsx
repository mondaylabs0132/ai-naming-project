"use client";

import { ArrowRight, ChevronLeft, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useFormContext, useFormState } from "react-hook-form";

import type { SurveyData } from "../_lib/schema";

export const TOTAL_STEPS = 5;
const SURVEY_STORAGE_KEY = "naming:new:surveyData";
const PREFERENCES_UI_STORAGE_KEY = "naming:new:preferencesUi";

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
  const { control, handleSubmit } = useFormContext<SurveyData>();
  // formState를 useFormContext에서 구조분해만 하면 이 컴포넌트에 구독이 걸리지 않아
  // isSubmitting이 바뀌어도 리렌더되지 않는다. useFormState로 직접 구독한다.
  const { isSubmitting } = useFormState({ control });
  const [submitError, setSubmitError] = useState("");
  // 제출 성공 후 /naming/generating으로 이동하는 동안의 상태.
  // isSubmitting은 fetch가 끝나면 바로 false가 되는데, 그 시점부터 실제 화면 전환까지
  // 버튼이 다시 눌리는 빈틈이 생기므로 이동이 시작되면 계속 잠가둔다.
  const [isRedirecting, setIsRedirecting] = useState(false);
  // isSubmitting은 react-hook-form 내부에서 비동기로 켜지기 때문에, 같은 tick 안의
  // 연타는 막지 못한다. 실제 중복 요청 차단은 ref 잠금으로 한다.
  const isSubmitLockedRef = useRef(false);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;
  const isBusy = isSubmitting || isRedirecting;

  // 실패했을 때만 잠금을 풀어 다시 시도할 수 있게 한다.
  const failSubmit = (message: string) => {
    isSubmitLockedRef.current = false;
    setSubmitError(message);
  };

  const submitValidSurvey = async (surveyData: SurveyData) => {
    setSubmitError("");

    try {
      const response = await fetch("/api/naming/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyData }),
      });

      const result = (await response.json()) as {
        requestId?: unknown;
        error?: unknown;
      };

      if (!response.ok || typeof result.requestId !== "string") {
        failSubmit(
          typeof result.error === "string"
            ? result.error
            : "이름 추천에 실패했어요. 잠시 후 다시 시도해주세요.",
        );
        return;
      }

      sessionStorage.removeItem(SURVEY_STORAGE_KEY);
      sessionStorage.removeItem(PREFERENCES_UI_STORAGE_KEY);
      // 이동이 끝날 때까지 잠금을 유지한다. (성공 경로에서는 풀지 않음)
      setIsRedirecting(true);
      router.push(`/naming/generating?requestId=${result.requestId}`);
    } catch {
      failSubmit("이름 추천에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      onNext?.();
      return;
    }

    if (isSubmitLockedRef.current) {
      return;
    }

    // handleSubmit 호출은 렌더가 아닌 이벤트 시점에 한다. ref 접근이 렌더 밖에서 일어나야 하고,
    // 매 렌더마다 제출 핸들러를 다시 만들 이유도 없다.
    isSubmitLockedRef.current = true;
    void handleSubmit(submitValidSurvey, () => {
      failSubmit("입력값을 다시 확인해주세요.");
    })();
  };

  return (
    <footer className="bg-bg px-[clamp(20px,5.5vw,44px)] pb-8 pt-6">
      <button
        type="button"
        onClick={handleNext}
        disabled={isBusy}
        aria-busy={isBusy}
        className="relative flex h-[clamp(56px,15vw,68px)] w-full items-center justify-center rounded-lg bg-primary px-[clamp(16px,5vw,28px)] text-[clamp(17px,4.8vw,22px)] font-semibold leading-none tracking-normal text-white shadow-btn select-none transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isBusy ? "저장 중" : isLastStep ? "이름 추천 받기" : "다음"}
        {isBusy ? (
          <LoaderCircle
            aria-hidden="true"
            className="absolute right-[clamp(16px,5vw,28px)] top-1/2 size-[clamp(22px,6vw,30px)] -translate-y-1/2 animate-spin"
            strokeWidth={2.2}
          />
        ) : (
          <ArrowRight
            aria-hidden="true"
            className="absolute right-[clamp(16px,5vw,28px)] top-1/2 size-[clamp(26px,7vw,36px)] -translate-y-1/2"
            strokeWidth={1.8}
          />
        )}
      </button>

      {isLastStep && submitError ? (
        <p className="mt-3 text-center text-[14px] font-semibold leading-normal tracking-normal text-danger">
          {submitError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onPrev}
        disabled={isFirstStep || isBusy}
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
