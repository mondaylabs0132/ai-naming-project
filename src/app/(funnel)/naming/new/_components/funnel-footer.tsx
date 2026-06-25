"use client";

import { ArrowRight, ChevronLeft, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

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
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useFormContext<SurveyData>();
  const [submitError, setSubmitError] = useState("");
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === TOTAL_STEPS;

  const submitSurvey = handleSubmit(
    async (surveyData) => {
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
          setSubmitError(
            typeof result.error === "string"
              ? result.error
              : "설문을 저장하지 못했어요. 잠시 후 다시 시도해주세요.",
          );
          return;
        }

        sessionStorage.removeItem(SURVEY_STORAGE_KEY);
        sessionStorage.removeItem(PREFERENCES_UI_STORAGE_KEY);
        router.push(`/naming/generating?requestId=${result.requestId}`);
      } catch {
        setSubmitError("설문을 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
      }
    },
    () => {
      setSubmitError("입력값을 다시 확인해주세요.");
    },
  );

  const handleNext = () => {
    if (isLastStep) {
      void submitSurvey();
      return;
    }

    onNext?.();
  };

  return (
    <footer className="bg-bg px-11 pb-8 pt-6">
      <button
        type="button"
        onClick={handleNext}
        disabled={isSubmitting}
        className="relative flex h-[72px] w-full items-center justify-center rounded-lg bg-primary px-16 text-[23px] font-semibold leading-none tracking-normal text-white shadow-btn select-none"
      >
        {isSubmitting ? "저장 중" : isLastStep ? "이름 추천 받기" : "다음"}
        {isSubmitting ? (
          <LoaderCircle
            aria-hidden="true"
            className="absolute right-8 top-1/2 size-8 -translate-y-1/2 animate-spin"
            strokeWidth={2.2}
          />
        ) : (
          <ArrowRight
            aria-hidden="true"
            className="absolute right-8 top-1/2 size-10 -translate-y-1/2"
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
        disabled={isFirstStep || isSubmitting}
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
