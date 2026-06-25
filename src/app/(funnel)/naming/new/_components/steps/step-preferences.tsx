"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Lightbulb,
  Minus,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import type { FunnelStepProps } from "../funnel-footer";
import FunnelFrame from "../funnel-frame";
import {
  MOOD_KEYWORDS,
  type Gender,
  type MoodKeyword,
  type SurveyData,
} from "../../_lib/schema";

type GenderOption = {
  value: Gender;
  label: string;
  imageSrc: string;
  imageAlt: string;
};

type StepPreferencesProps = FunnelStepProps;

const GENDER_OPTIONS: GenderOption[] = [
  {
    value: "남자",
    label: "남아",
    imageSrc: "/assets/funnel/boy.png",
    imageAlt: "남아 얼굴 일러스트",
  },
  {
    value: "여자",
    label: "여아",
    imageSrc: "/assets/funnel/girl.png",
    imageAlt: "여아 얼굴 일러스트",
  },
];
const PREFERENCES_UI_STORAGE_KEY = "naming:new:preferencesUi";
const PREFERENCE_FIELDS = [
  "gender",
  "moodKeywords",
  "generationName",
  "siblingNames",
  "checkEnglishPronunciation",
] as const;
const SECTION_TITLE_CLASS =
  "text-[19px] font-bold leading-tight tracking-normal text-[#15386D]";
const SECTION_TITLE_SUFFIX_CLASS =
  "ml-1 text-[15px] font-semibold text-[#687896]";
const ERROR_TEXT_CLASS =
  "mt-3 text-[14px] font-semibold leading-normal tracking-normal text-danger";

export default function StepPreferences({
  currentStep,
  onNext,
  onPrev,
}: StepPreferencesProps) {
  const { control, setValue, trigger, clearErrors } =
    useFormContext<SurveyData>();
  const { errors } = useFormState({ control });
  const [
    gender,
    moodKeywords,
    generationName,
    siblingNames,
    checkEnglishPronunciation,
  ] = useWatch({
    control,
    name: [
      "gender",
      "moodKeywords",
      "generationName",
      "siblingNames",
      "checkEnglishPronunciation",
    ],
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [siblingNamesInput, setSiblingNamesInput] = useState(
    () => siblingNames?.join(", ") ?? "",
  );
  const selectedMoods = moodKeywords ?? [];
  const genderError = errors.gender?.message;
  const moodError = errors.moodKeywords?.message;

  const selectGender = (nextGender: Gender) => {
    setValue("gender", nextGender, { shouldDirty: true });
    clearErrors(["gender", "moodKeywords"]);
  };

  const toggleMood = (mood: MoodKeyword) => {
    let nextMoodKeywords = selectedMoods;

    if (selectedMoods.includes(mood)) {
      nextMoodKeywords = selectedMoods.filter((item) => item !== mood);
    } else if (selectedMoods.length < 3) {
      nextMoodKeywords = [...selectedMoods, mood];
    }

    setValue("moodKeywords", nextMoodKeywords, { shouldDirty: true });
    clearErrors(["gender", "moodKeywords"]);
  };

  const handleNext = async () => {
    const isValid = await trigger([...PREFERENCE_FIELDS]);

    if (!isValid) {
      return;
    }

    onNext?.();
  };

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const nextIsExpanded = !prev;

      sessionStorage.setItem(
        PREFERENCES_UI_STORAGE_KEY,
        JSON.stringify({ isExpanded: nextIsExpanded }),
      );

      return nextIsExpanded;
    });
  };

  useEffect(() => {
    const saved = sessionStorage.getItem(PREFERENCES_UI_STORAGE_KEY);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as { isExpanded?: unknown };

      if (parsed.isExpanded === true) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsExpanded(true);
      }
    } catch {
      sessionStorage.removeItem(PREFERENCES_UI_STORAGE_KEY);
    }
  }, []);

  return (
    <FunnelFrame currentStep={currentStep} onNext={handleNext} onPrev={onPrev}>
      <section className="bg-bg px-11 pt-2">
        <div className="grid min-h-[250px] grid-cols-[minmax(0,1fr)_190px] items-start gap-1 overflow-hidden">
          <div className="pt-8">
            <h1 className="text-[29px] font-bold leading-[1.35] tracking-normal text-[#15386D]">
              아이의 성별과
              <br />
              <span className="text-primary">선호 스타일</span>을 선택해주세요
            </h1>
            <p className="mt-5 text-body font-semibold leading-[1.75] tracking-normal text-[#687896]">
              원하는 분위기와 조건을 선택하면
              <br />더 만족스러운 이름을 추천해드릴 수 있어요.
            </p>
          </div>

          <Image
            src="/assets/funnel/funnel-star3.png"
            alt=""
            width={260}
            height={260}
            priority
            className="h-[220px] w-[220px] max-w-none -translate-x-3 object-contain object-center"
          />
        </div>

        <div className="rounded-[22px] bg-white px-7 py-8 shadow-card">
          {/* 1. 성별 */}
          <fieldset>
            <legend>
              <h2 className={SECTION_TITLE_CLASS}>1. 성별을 선택해주세요</h2>
            </legend>

            <div
              role="radiogroup"
              aria-label="아이 성별"
              className="mt-4 grid grid-cols-2 gap-6"
            >
              {GENDER_OPTIONS.map((option) => {
                const isSelected = gender === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => selectGender(option.value)}
                    className={[
                      "relative flex h-[80px] min-w-0 items-center rounded-[14px] border-2 px-3 pr-10 text-[20px] font-bold leading-none tracking-normal transition",
                      isSelected
                        ? "border-primary bg-[#FBFAFF] text-primary shadow-[0_0_0_3px_rgba(124,111,205,0.06)]"
                        : "border-divider bg-white text-[#15386D] hover:border-primary-light",
                    ].join(" ")}
                  >
                    <Image
                      src={option.imageSrc}
                      alt={option.imageAlt}
                      width={54}
                      height={54}
                      className="size-[54px] shrink-0 object-contain"
                    />
                    <span className="ml-4 min-w-0">{option.label}</span>
                    <span className="absolute right-4 top-4">
                      {isSelected ? (
                        <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-white">
                          <Check
                            aria-hidden="true"
                            className="size-3"
                            strokeWidth={3.2}
                          />
                        </span>
                      ) : (
                        <Circle
                          aria-hidden="true"
                          className="size-[18px] shrink-0 text-primary-muted"
                          strokeWidth={1.8}
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <p
              className={[ERROR_TEXT_CLASS, genderError ? "block" : "hidden"].join(
                " ",
              )}
            >
              {genderError}
            </p>
          </fieldset>

          {/* 2. 분위기 */}
          <fieldset className="mt-10">
            <legend>
              <h2 className={SECTION_TITLE_CLASS}>
                2. 선호하는 분위기를 선택해주세요
                <span className={SECTION_TITLE_SUFFIX_CLASS}>(최대 3개)</span>
              </h2>
            </legend>

            <div className="mt-4 grid grid-cols-2 gap-3 min-[520px]:grid-cols-4">
              {MOOD_KEYWORDS.map((mood) => {
                const isSelected = selectedMoods.includes(mood);
                const isDisabled = !isSelected && selectedMoods.length >= 3;

                return (
                  <button
                    key={mood}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={isDisabled}
                    onClick={() => toggleMood(mood)}
                    className={[
                      "flex h-[62px] min-w-0 items-center gap-2 overflow-hidden rounded-[14px] border px-2 text-left text-[14px] font-bold leading-none tracking-normal transition",
                      isSelected
                        ? "border-primary bg-[#FBFAFF] text-primary shadow-[0_0_0_2px_rgba(124,111,205,0.04)]"
                        : "border-divider bg-white text-[#4F5E7D] hover:border-primary-light",
                      isDisabled ? "opacity-45" : "",
                    ].join(" ")}
                  >
                    {isSelected ? (
                      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <Check
                          aria-hidden="true"
                          className="size-3"
                          strokeWidth={3.2}
                        />
                      </span>
                    ) : (
                      <Circle
                        aria-hidden="true"
                        className="size-[18px] shrink-0 text-primary-muted"
                        strokeWidth={1.8}
                      />
                    )}
                    <span className="min-w-0 whitespace-nowrap">{mood}</span>
                  </button>
                );
              })}
            </div>
            <p
              className={[ERROR_TEXT_CLASS, moodError ? "block" : "hidden"].join(
                " ",
              )}
            >
              {moodError}
            </p>
          </fieldset>

          {/* 추가 분위기 토글 */}
          <button
            type="button"
            onClick={toggleExpanded}
            className="mt-7 flex min-h-10 items-center gap-3 text-[16px] font-bold leading-none tracking-normal text-[#687896]"
          >
            {isExpanded ? (
              <>
                <Minus
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={2.4}
                />
                더 적은 분위기 보기
                <ChevronUp
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={2.4}
                />
              </>
            ) : (
              <>
                <Plus aria-hidden="true" className="size-5" strokeWidth={2.4} />
                더 많은 분위기 보기
                <ChevronDown
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={2.4}
                />
              </>
            )}
          </button>

          {isExpanded && (
            <div className="mt-7 space-y-10">
              {/* 3. 돌림자 */}
              <div>
                <label htmlFor="generation-characters" className="block">
                  <h2 className={SECTION_TITLE_CLASS}>
                    3. 돌림자
                    <span className={SECTION_TITLE_SUFFIX_CLASS}>(선택)</span>
                  </h2>
                </label>
                <input
                  id="generation-characters"
                  type="text"
                  value={generationName ?? ""}
                  onChange={(event) => {
                    const nextValue = event.target.value.trim();

                    setValue("generationName", nextValue || undefined, {
                      shouldDirty: true,
                    });
                  }}
                  placeholder="예) 준, 서, 민"
                  className="mt-4 h-[60px] w-full rounded-lg border border-divider bg-white px-5 text-[17px] font-semibold leading-none tracking-normal text-ink outline-none transition placeholder:text-ink-light focus:border-primary focus:shadow-[0_0_0_4px_rgba(124,111,205,0.12)]"
                />
                <p className="mt-3 text-[13px] font-semibold leading-normal tracking-normal text-[#687896]">
                  특정 돌림자가 있다면 입력해주세요.
                </p>
              </div>

              {/* 4. 형제자매 이름 */}
              <div>
                <label htmlFor="sibling-names" className="block">
                  <h2 className={SECTION_TITLE_CLASS}>
                    4. 형제자매 이름
                    <span className={SECTION_TITLE_SUFFIX_CLASS}>(선택)</span>
                  </h2>
                </label>
                <input
                  id="sibling-names"
                  type="text"
                  value={siblingNamesInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    setSiblingNamesInput(nextValue);
                    setValue(
                      "siblingNames",
                      nextValue
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                      { shouldDirty: true },
                    );
                  }}
                  placeholder="예) 지우, 민주"
                  className="mt-4 h-[60px] w-full rounded-lg border border-divider bg-white px-5 text-[17px] font-semibold leading-none tracking-normal text-ink outline-none transition placeholder:text-ink-light focus:border-primary focus:shadow-[0_0_0_4px_rgba(124,111,205,0.12)]"
                />
                <p className="mt-3 text-[13px] font-semibold leading-normal tracking-normal text-[#687896]">
                  형제자매 이름과 어울리는 이름을 추천해드려요.
                </p>
              </div>

              {/* 5. 영문발음 */}
              <div>
                <h2 className={SECTION_TITLE_CLASS}>
                  5. 영문 발음도 고려할까요?
                  <span className={SECTION_TITLE_SUFFIX_CLASS}>(선택)</span>
                </h2>

                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checkEnglishPronunciation ?? false}
                    onClick={() =>
                      setValue(
                        "checkEnglishPronunciation",
                        !(checkEnglishPronunciation ?? false),
                        { shouldDirty: true },
                      )
                    }
                    className={[
                      "relative h-9 w-[62px] shrink-0 rounded-full p-1 transition",
                      checkEnglishPronunciation ? "bg-primary" : "bg-[#DDDAE8]",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "block size-7 rounded-full bg-white shadow-[0_2px_8px_rgba(45,37,64,0.18)] transition",
                        checkEnglishPronunciation
                          ? "translate-x-[26px]"
                          : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>
                  <span className="text-[16px] font-bold leading-tight tracking-normal text-[#4F5E7D]">
                    영문 발음이 쉬운 이름을 우선 추천
                  </span>
                </div>
                <p className="mt-1 pl-[78px] text-[13px] font-semibold leading-normal tracking-normal text-[#687896]">
                  끄면 기본적으로 발음을 크게 고려하지 않아요.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-2 rounded-[14px] bg-[#F5EFFF] p-4 text-primary">
            <Lightbulb
              aria-hidden="true"
              className="size-8 shrink-0"
              strokeWidth={2.2}
            />
            <p className="text-[15px] font-semibold leading-normal tracking-normal text-[#687896]">
              선택한 조건을 기반으로 어울리는 이름을 추천해드려요.
            </p>
          </div>
        </div>
      </section>
    </FunnelFrame>
  );
}
