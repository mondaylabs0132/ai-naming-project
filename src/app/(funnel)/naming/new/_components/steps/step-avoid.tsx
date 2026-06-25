"use client";

import {
  Check,
  CircleAlert,
  Info,
  Lightbulb,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import type { FunnelStepProps } from "../funnel-footer";
import FunnelFrame from "../funnel-frame";
import {
  searchAvoidHanjaOptions,
  type HanjaOption,
} from "../../_lib/search-options";
import type { SurveyData } from "../../_lib/schema";

const MAX_AVOID_ITEMS = 5;
const SEARCH_DEBOUNCE_MS = 200;

type StepAvoidProps = FunnelStepProps;
type SearchState = {
  status: "idle" | "loading" | "success" | "error";
  options: HanjaOption[];
};

const EMPTY_SEARCH_STATE: SearchState = { status: "idle", options: [] };

function getAvoidHangulInput(value: string) {
  const inputValue = value
    .replace(/，/g, ",")
    .split(",")
    .slice(0, MAX_AVOID_ITEMS)
    .join(",");

  const items = Array.from(
    new Set(
      inputValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

  return { inputValue, items };
}

function getHanjaLabel(option: HanjaOption) {
  const meaning = option.meanings[0];

  if (!meaning) {
    return option.hangulMain;
  }

  return `${meaning} ${option.hangulMain}`;
}

export default function StepAvoid({
  currentStep,
  onNext,
  onPrev,
}: StepAvoidProps) {
  const { control, setValue } = useFormContext<SurveyData>();
  const avoidHangul = useWatch({ control, name: "avoidHangul" });
  const avoidHanja = useWatch({ control, name: "avoidHanja" });

  const [avoidInput, setAvoidInput] = useState(
    () => avoidHangul?.join(", ") ?? "",
  );
  const [hanjaQuery, setHanjaQuery] = useState("");
  const [searchState, setSearchState] =
    useState<SearchState>(EMPTY_SEARCH_STATE);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  const activeSearchRef = useRef("");
  const selectedHanja = avoidHanja ?? [];

  const handleAvoidHangulChange = (nextValue: string) => {
    const { inputValue, items } = getAvoidHangulInput(nextValue);

    setAvoidInput(inputValue);
    setValue("avoidHangul", items, { shouldDirty: true });
  };

  const handleHanjaQueryChange = (nextValue: string) => {
    // 입력값은 그대로 보여주고, 검색에 넘길 값은 공백과 길이만 정리
    const nextQuery = nextValue.replace(/\s+/g, " ").slice(0, 20);
    const searchQuery = nextQuery.trim();

    setHanjaQuery(nextQuery);
    setIsDropdownOpen(Boolean(searchQuery));

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!searchQuery) {
      activeSearchRef.current = "";
      setSearchState(EMPTY_SEARCH_STATE);
      return;
    }

    // 마지막 검색어만 유효하게 두어, 늦게 도착한 이전 검색 결과가 UI를 덮지 않게 한다.
    activeSearchRef.current = searchQuery;
    setSearchState({ status: "idle", options: [] });

    debounceTimerRef.current = window.setTimeout(async () => {
      setSearchState({ status: "loading", options: [] });

      try {
        const nextOptions = await searchAvoidHanjaOptions(searchQuery);

        if (activeSearchRef.current === searchQuery) {
          setSearchState({ status: "success", options: nextOptions });
        }
      } catch {
        if (activeSearchRef.current === searchQuery) {
          setSearchState({ status: "error", options: [] });
        }
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const toggleHanja = (option: HanjaOption) => {
    // 이미 선택한 한자는 제거하고, 새 한자는 최대 개수 안에서만 추가한다.
    const isSelected = selectedHanja.some((item) => item.id === option.id);
    const nextSelectedHanja = isSelected
      ? selectedHanja.filter((item) => item.id !== option.id)
      : selectedHanja.length >= MAX_AVOID_ITEMS
        ? selectedHanja
        : [...selectedHanja, option];

    // 선택 직후에는 진행 중인 검색과 드롭다운 상태를 모두 비움
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setValue("avoidHanja", nextSelectedHanja, { shouldDirty: true });
    activeSearchRef.current = "";
    setSearchState(EMPTY_SEARCH_STATE);
    setHanjaQuery("");
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <FunnelFrame currentStep={currentStep} onNext={onNext} onPrev={onPrev}>
      <section className="bg-bg px-11 pt-2">
        <div className="grid min-h-[250px] grid-cols-[minmax(0,1fr)_190px] items-start gap-1 overflow-hidden">
          <div className="pt-8">
            <h1 className="text-[29px] font-bold leading-[1.35] tracking-normal text-[#15386D]">
              회피할 스타일을
              <br />
              <span className="text-primary">입력해주세요</span>
            </h1>
            <p className="mt-5 text-body font-semibold leading-[1.75] tracking-normal text-[#687896]">
              원하지 않거나 피하고 싶은 글자나
              <br />
              이름, 한자를 입력해주세요.
            </p>
          </div>

          <Image
            src="/assets/funnel/funnel-star4.png"
            alt=""
            width={260}
            height={260}
            priority
            className="h-[210px] w-[210px] max-w-none -translate-x-3 object-contain object-center"
          />
        </div>

        <div className="space-y-5">
          <section className="rounded-[22px] bg-white px-7 py-8 shadow-card">
            <label
              htmlFor="avoid-hangul"
              className="block text-[19px] font-bold leading-tight tracking-normal text-[#15386D]"
            >
              1. 회피 글자 혹은 이름
              <span className="ml-1 text-[15px] font-semibold text-[#687896]">
                (없으면 비워주세요)
              </span>
            </label>
            <p className="mt-5 text-[16px] font-semibold leading-normal tracking-normal text-[#687896]">
              원하지 않거나 피하고 싶은 글자나 이름을 입력해주세요.
            </p>

            <div className="relative mt-6">
              <input
                id="avoid-hangul"
                type="text"
                inputMode="text"
                value={avoidInput}
                onChange={(event) =>
                  handleAvoidHangulChange(event.target.value)
                }
                placeholder="예) 재, 민, 성, 지민, 서연"
                aria-describedby="avoid-hangul-help"
                className="h-[68px] w-full rounded-lg border-2 border-primary-light bg-white px-5 pr-20 text-[19px] font-semibold leading-none tracking-normal text-ink outline-none transition placeholder:text-primary-muted focus:border-primary focus:shadow-[0_0_0_4px_rgba(124,111,205,0.12)]"
              />
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[18px] font-bold leading-none tracking-normal text-primary">
                {getAvoidHangulInput(avoidInput).items.length}/{MAX_AVOID_ITEMS}
              </span>
            </div>

            <div
              id="avoid-hangul-help"
              className="mt-5 flex items-center gap-2 text-[15px] font-semibold leading-normal tracking-normal text-[#687896]"
            >
              <Info
                aria-hidden="true"
                className="size-5 shrink-0 text-[#687896]"
                strokeWidth={2.2}
              />
              쉼표로 구분해서 최대 5개까지 입력할 수 있어요.
            </div>
          </section>

          <section className="rounded-[22px] bg-white px-7 py-8 shadow-card">
            <h2 className="text-[19px] font-bold leading-tight tracking-normal text-[#15386D]">
              2. 회피 한자
              <span className="ml-1 text-[15px] font-semibold text-[#687896]">
                (없으면 비워주세요)
              </span>
            </h2>
            <p className="mt-5 text-[16px] font-semibold leading-normal tracking-normal text-[#687896]">
              피하고 싶은 한자를 입력하면 자동으로 검색되어 선택할 수 있어요.
            </p>

            <div className="relative mt-6">
              <span className="pointer-events-none absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-[10px] bg-primary-pale text-[21px] font-bold leading-none tracking-normal text-primary">
                漢
              </span>
              <input
                id="avoid-hanja"
                type="text"
                inputMode="text"
                value={hanjaQuery}
                onChange={(event) => handleHanjaQueryChange(event.target.value)}
                onFocus={() => {
                  if (hanjaQuery) {
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder="회피 한자 설정하기"
                aria-label="회피 한자 검색"
                className="h-[68px] w-full rounded-lg border border-divider bg-white py-0 pl-[70px] pr-14 text-[18px] font-bold leading-none tracking-normal text-ink outline-none transition placeholder:text-ink-light focus:border-primary focus:shadow-[0_0_0_4px_rgba(124,111,205,0.12)]"
              />
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute right-5 top-1/2 size-5 -translate-y-1/2 text-primary-muted"
                strokeWidth={2.4}
              />

              {isDropdownOpen && hanjaQuery ? (
                <div className="absolute left-0 right-0 top-[76px] z-20 max-h-[320px] overflow-y-auto rounded-lg border border-divider bg-white shadow-card">
                  {searchState.status === "loading" ? (
                    <p className="flex items-center gap-2 px-5 py-4 text-[15px] font-medium leading-normal tracking-normal text-ink-muted">
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin text-primary"
                        strokeWidth={2.4}
                      />
                      한자를 찾고 있어요.
                    </p>
                  ) : null}

                  {searchState.status === "error" ? (
                    <p className="flex items-center gap-2 px-5 py-4 text-[15px] font-semibold leading-normal tracking-normal text-danger">
                      <CircleAlert
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={2.4}
                      />
                      한자 목록을 불러오지 못했어요.
                    </p>
                  ) : null}

                  {searchState.status === "success" &&
                  searchState.options.length === 0 ? (
                    <p className="px-5 py-4 text-[15px] font-medium leading-normal tracking-normal text-ink-muted">
                      일치하는 한자가 없어요.
                    </p>
                  ) : null}

                  {searchState.status === "success"
                    ? searchState.options.map((option) => {
                        const isSelected = selectedHanja.some(
                          (item) => item.id === option.id,
                        );
                        const isDisabled =
                          !isSelected &&
                          selectedHanja.length >= MAX_AVOID_ITEMS;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={isDisabled}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              toggleHanja(option);
                            }}
                            aria-pressed={isSelected}
                            className={[
                              "flex min-h-16 w-full items-center justify-between gap-4 px-5 text-left transition",
                              isSelected
                                ? "bg-surface-section text-primary"
                                : "bg-white text-ink hover:bg-surface-section",
                              isDisabled ? "opacity-45" : "",
                            ].join(" ")}
                          >
                            <span className="flex min-w-0 items-center gap-4">
                              <span className="text-[26px] font-bold leading-none tracking-normal">
                                {option.hanja}
                              </span>
                              <span className="min-w-0 text-[15px] font-semibold leading-tight tracking-normal text-[#687896]">
                                {getHanjaLabel(option)}
                              </span>
                            </span>
                            {isSelected ? (
                              <Check
                                aria-hidden="true"
                                className="size-5 shrink-0 text-primary"
                                strokeWidth={2.8}
                              />
                            ) : null}
                          </button>
                        );
                      })
                    : null}
                </div>
              ) : null}
            </div>

            {selectedHanja.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedHanja.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleHanja(option)}
                    className="flex min-h-10 items-center gap-2 rounded-full border border-primary-pale bg-[#FBFAFF] px-4 text-[15px] font-bold leading-none tracking-normal text-primary"
                  >
                    <span className="text-[19px]">{option.hanja}</span>
                    {getHanjaLabel(option)}
                    <X
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={2.6}
                    />
                  </button>
                ))}
              </div>
            ) : null}

            <p className="mt-3 text-[13px] font-semibold leading-normal tracking-normal text-[#687896]">
              예) 집 가, 家, 가
              <span className="ml-2">
                최대 {MAX_AVOID_ITEMS}개까지 선택할 수 있어요. 현재{" "}
                {selectedHanja.length}/{MAX_AVOID_ITEMS}
              </span>
            </p>

            <div className="mt-7 flex items-start gap-3 rounded-[14px] bg-[#F5EFFF] p-4 text-primary">
              <Lightbulb
                aria-hidden="true"
                className="mt-0.5 size-8 shrink-0"
                strokeWidth={2.2}
              />
              <div>
                <p className="text-[16px] font-bold leading-normal tracking-normal text-primary">
                  알려드려요
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] font-semibold leading-normal tracking-normal text-[#687896] marker:text-primary">
                  <li>설정하지 않아도 추천 결과를 받아볼 수 있어요.</li>
                  <li>입력한 내용은 추천 결과에서 자동으로 제외돼요.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </section>
    </FunnelFrame>
  );
}
