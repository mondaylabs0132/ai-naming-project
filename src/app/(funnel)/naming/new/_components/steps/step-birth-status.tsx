"use client";

import Image from "next/image";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import FunnelFrame from "../funnel-frame";
import type { FunnelStepProps } from "../funnel-footer";
import type { BirthStatus, SurveyData } from "../../_lib/schema";

type StepBirthStatusProps = FunnelStepProps;

type BirthStatusOption = {
  value: BirthStatus;
  title: string;
  headline: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  tone: "purple" | "warm";
};

const BIRTH_STATUS_OPTIONS: BirthStatusOption[] = [
  {
    value: "AFTER_BIRTH",
    title: "출생 후",
    headline: "정확한 사주 분석이 가능해요",
    description:
      "아이의 생년월일시를 기반으로\n정확한 사주 분석과 맞춤 이름을 추천드려요.",
    imageSrc: "/baby.png",
    imageAlt: "포대기에 싸인 아기 일러스트",
    tone: "purple",
  },
  {
    value: "BEFORE_BIRTH",
    title: "출생 전",
    headline: "예상 사주 기반으로 이름을 추천드려요",
    description:
      "출산 전에는 정확한 사주 분석이 어려워\n예상 사주를 기반으로 이름을 추천드려요.",
    imageSrc: "/bird.png",
    imageAlt: "아기를 상징하는 보따리를 문 새 일러스트",
    tone: "warm",
  },
];

export default function StepBirthStatus({
  currentStep,
  onNext,
  onPrev,
}: StepBirthStatusProps) {
  const { control, setValue, getValues, trigger, clearErrors } =
    useFormContext<SurveyData>();
  const { errors } = useFormState({ control });
  const value = useWatch({ control, name: "birthStatus" });
  const birthStatusError = errors.birthStatus?.message;

  const handleSelect = (birthStatus: BirthStatus) => {
    const prevBirthStatus = getValues("birthStatus");

    setValue("birthStatus", birthStatus, { shouldDirty: true });
    clearErrors("birthStatus");

    // 출생 전/후가 바뀌면 이전에 입력한 날짜·시간을 비운다.
    // (예전 page 레벨 updateSurveyData에 있던 side effect)
    if (prevBirthStatus !== birthStatus) {
      setValue("birthYear", undefined, { shouldDirty: true });
      setValue("birthMonth", undefined, { shouldDirty: true });
      setValue("birthDay", undefined, { shouldDirty: true });
      setValue("birthTime", undefined, { shouldDirty: true });
    }
  };

  const handleNext = async () => {
    const isValid = await trigger("birthStatus");

    if (!isValid) {
      return;
    }

    onNext?.();
  };

  return (
    <FunnelFrame currentStep={currentStep} onNext={handleNext} onPrev={onPrev}>
      <section className="bg-bg px-11 pb-4 pt-2">
        <div className="grid min-h-[250px] grid-cols-[minmax(0,1fr)_190px] items-start gap-1 overflow-hidden">
          <div className="pt-8">
            <h1 className="text-[29px] font-bold leading-[1.35] tracking-normal text-ink">
              아이의 출생 여부를
              <br />
              <span className="text-primary">선택</span>해주세요
            </h1>
            <p className="mt-5 text-body font-semibold leading-[1.75] tracking-normal text-ink-muted">
              정확한 분석을 위해
              <br />
              알맞은 항목을 선택해주세요.
            </p>
          </div>

          <Image
            src="/funnel-star2.png"
            alt=""
            width={260}
            height={260}
            priority
            className="h-[230px] w-[230px] max-w-none -translate-x-6 object-contain object-center"
          />
        </div>

        <div
          role="radiogroup"
          aria-label="아이의 출생 여부"
          aria-describedby="birth-status-error"
          className="space-y-7"
        >
          {BIRTH_STATUS_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            const radioClasses = getRadioClasses(option, isSelected);

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelect(option.value)}
                className={getOptionClasses(option)}
              >
                <Image
                  src={option.imageSrc}
                  alt={option.imageAlt}
                  width={145}
                  height={145}
                  className="h-[145px] w-[145px] shrink-0 object-contain"
                />

                <span className="min-w-0">
                  <span className="block text-[20px] font-bold leading-none tracking-normal text-ink">
                    {option.title}
                  </span>
                  <span
                    className={[
                      "mt-3 block text-[16px] font-bold leading-[1.35] tracking-normal",
                      radioClasses.accentText,
                    ].join(" ")}
                  >
                    {option.headline}
                  </span>
                  <span className="mt-3 block whitespace-pre-line text-[14px] font-semibold leading-[1.75] tracking-normal text-ink-muted">
                    {option.description}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={[
                    "absolute right-7 top-8 flex size-8 items-center justify-center rounded-full border-[3px] bg-white transition",
                    radioClasses.border,
                  ].join(" ")}
                >
                  <span
                    className={[
                      "size-4 rounded-full transition",
                      radioClasses.dot,
                      isSelected
                        ? "scale-100 opacity-100"
                        : "scale-0 opacity-0",
                    ].join(" ")}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <p
          id="birth-status-error"
          className={[
            "mt-3 text-[14px] font-semibold leading-normal tracking-normal text-danger",
            birthStatusError ? "block" : "hidden",
          ].join(" ")}
        >
          아이의 출생 여부를 선택해주세요.
        </p>
      </section>
    </FunnelFrame>
  );
}

function getRadioClasses(option: BirthStatusOption, isSelected: boolean) {
  if (option.tone === "purple") {
    return {
      accentText: "text-primary",
      border: isSelected ? "border-primary" : "border-primary-light",
      dot: "bg-primary",
    };
  }

  return {
    accentText: "text-[#FFB347]",
    border: isSelected ? "border-[#FFB347]" : "border-[#FFD69D]",
    dot: "bg-[#FFB347]",
  };
}

function getOptionClasses(option: BirthStatusOption) {
  const toneClasses =
    option.tone === "purple"
      ? "border-[#E9E2FA] bg-[#FBF9FF]"
      : "border-[#FBE8DC] bg-[#FFFCF9]";

  return [
    "relative flex min-h-[178px] w-full items-center gap-4 rounded-[22px] border px-7 py-8 pr-16 text-left shadow-[0_2px_12px_rgba(124,111,205,0.05)] transition",
    toneClasses,
  ].join(" ");
}
