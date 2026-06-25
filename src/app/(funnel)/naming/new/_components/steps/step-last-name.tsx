"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import type { FunnelStepProps } from "../funnel-footer";
import FunnelFrame from "../funnel-frame";
import type { SurveyData } from "../../_lib/schema";
import {
  searchSurnameOptions,
  type SurnameOption,
} from "../../_lib/search-options";

const EXAMPLE_LAST_NAMES = ["김", "이", "박", "최", "정", "강"] as const;
const SEARCH_DEBOUNCE_MS = 200;
const HANGUL_JAMO_ONLY_REGEX = /^[ㄱ-ㅎㅏ-ㅣ]+$/;

type StepLastNameProps = FunnelStepProps;
type SearchState = {
  status: "idle" | "loading" | "success" | "error";
  options: SurnameOption[];
};
type SurnameDropdownProps = SearchState & {
  selectedSurnameId?: number;
  onSelect: (surname: SurnameOption) => void;
};

const EMPTY_SEARCH_STATE: SearchState = { status: "idle", options: [] };

export default function StepLastName({
  currentStep,
  onNext,
  onPrev,
}: StepLastNameProps) {
  const { control, setValue, trigger, clearErrors } =
    useFormContext<SurveyData>();
  const { errors } = useFormState({ control });
  const value = useWatch({ control, name: "surname" });
  const surnameError = errors.surname?.message;

  const [query, setQuery] = useState(value?.hangul ?? "");
  const [searchState, setSearchState] =
    useState<SearchState>(EMPTY_SEARCH_STATE);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const debounceTimerRef = useRef<number | null>(null);
  const activeSearchRef = useRef("");

  const setSurname = (surname: SurnameOption | undefined) => {
    setValue("surname", surname, { shouldDirty: true });
    clearErrors("surname");
  };

  // 입력 글자는 바로 보여주고, 성씨 후보 조회만 잠깐 기다렸다가 실행한다.
  // ㄱ/ㅣ 같은 한글 조합 중간값만 검색하지 않는다.
  const handleQueryChange = (nextQuery: string) => {
    const isSelectedQuery = nextQuery === value?.hangul;
    const isComposingHangul = HANGUL_JAMO_ONLY_REGEX.test(nextQuery);

    setQuery(nextQuery);
    setIsDropdownOpen(
      Boolean(nextQuery) && !isComposingHangul && !isSelectedQuery,
    );
    clearErrors("surname");

    // 성씨가 선택된 상황에서, input을 다시 바꾸면 다시 선택해야 하므로 기존 선택을 지운다.
    if (value && nextQuery !== value.hangul) {
      setSurname(undefined);
    }

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 입력값이 비었거나, 한글 조합 중이거나, 이미 선택된 성씨와 같은 값이면 검색하지 않는다.
    if (!nextQuery || isComposingHangul || isSelectedQuery) {
      activeSearchRef.current = "";
      setSearchState(EMPTY_SEARCH_STATE);
      return;
    }

    activeSearchRef.current = nextQuery;
    setSearchState((currentState) => ({
      status: currentState.status === "loading" ? "loading" : "idle",
      options: [],
    }));

    debounceTimerRef.current = window.setTimeout(async () => {
      setSearchState({ status: "loading", options: [] });

      try {
        const nextOptions = await searchSurnameOptions(nextQuery);

        if (activeSearchRef.current === nextQuery) {
          setSearchState({ status: "success", options: nextOptions });
        }
      } catch {
        if (activeSearchRef.current === nextQuery) {
          setSearchState({ status: "error", options: [] });
        }
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  // 선택된 성씨만 surveyData에 저장한다. 사용자가 타이핑만 한 값은 확정값이 아님.
  const selectSurname = (surname: SurnameOption) => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    activeSearchRef.current = "";
    setSearchState(EMPTY_SEARCH_STATE);
    setQuery(surname.hangul);
    setIsDropdownOpen(false);
    setSurname(surname);
  };

  const handleNext = async () => {
    if (await trigger("surname")) {
      onNext?.();
      return;
    }

    setIsDropdownOpen(Boolean(query));
  };

  const shouldShowDropdown =
    isDropdownOpen && Boolean(query) && value?.hangul !== query;

  const inputValue = query || value?.hangul || "";

  return (
    <FunnelFrame currentStep={currentStep} onNext={handleNext} onPrev={onPrev}>
      <section className="bg-bg px-11 pb-4 pt-2">
        <div className="grid min-h-[230px] grid-cols-[minmax(0,1fr)_170px] items-start gap-2 overflow-hidden">
          <div className="pt-8">
            <h1 className="text-[29px] font-bold leading-[1.28] tracking-normal text-ink">
              아이의 성씨를
              <br />
              입력해주세요
            </h1>
            <p className="mt-4 text-body font-semibold leading-[1.7] tracking-normal text-ink-muted">
              정확한 성씨는
              <br />더 어울리는 이름을 찾는 데 도움이 돼요.
            </p>
          </div>

          <Image
            src="/funnel-star1.png"
            alt=""
            width={260}
            height={260}
            priority
            className="h-[208px] w-[208px] max-w-none -translate-x-5 object-cover object-center"
          />
        </div>

        <div className="rounded-[22px] bg-white px-6 py-7 shadow-card">
          <label
            htmlFor="last-name"
            className="block text-[18px] font-bold leading-none tracking-normal text-ink"
          >
            성씨 입력
          </label>

          <div className="relative mt-7">
            <input
              id="last-name"
              type="text"
              inputMode="text"
              autoComplete="family-name"
              value={inputValue}
              onChange={(event) => handleQueryChange(event.target.value)}
              onFocus={() => {
                if (query && value?.hangul !== query) {
                  setIsDropdownOpen(true);
                }
              }}
              placeholder="예) 김, 이, 박"
              aria-describedby="last-name-help last-name-error"
              aria-invalid={Boolean(surnameError)}
              className="h-[68px] w-full rounded-lg border-2 border-primary bg-white px-5 pr-24 text-[24px] font-semibold leading-none tracking-normal text-ink shadow-[0_0_0_4px_rgba(124,111,205,0.04)] outline-none placeholder:text-ink-light focus:border-primary focus:shadow-[0_0_0_4px_rgba(124,111,205,0.12)]"
            />

            {value && (
              <div className="pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2 text-primary">
                <span className="max-w-10 truncate text-[22px] font-semibold leading-none tracking-normal">
                  {value.hanja}
                </span>
                <Check
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={2.8}
                />
              </div>
            )}

            {shouldShowDropdown && (
              <SurnameDropdown
                status={searchState.status}
                options={searchState.options}
                selectedSurnameId={value?.id}
                onSelect={selectSurname}
              />
            )}
          </div>

          <div
            id="last-name-help"
            className="mt-5 flex items-center gap-2 text-[15px] font-medium leading-normal tracking-normal text-ink-muted"
          >
            <span
              aria-hidden="true"
              className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold leading-none text-white"
            >
              i
            </span>
            한 글자 또는 두 글자 성씨를 입력할 수 있어요.
          </div>

          <div className="mt-8 rounded-[18px] bg-[#F5F3FA] px-5 py-6">
            <p className="text-[17px] font-bold leading-none tracking-normal text-ink">
              예시 성씨
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {EXAMPLE_LAST_NAMES.map((name) => {
                const isSelected = query === name;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleQueryChange(name)}
                    aria-pressed={isSelected}
                    className={[
                      "flex h-14 items-center justify-center rounded-md bg-white text-[24px] font-semibold leading-none tracking-normal text-ink shadow-card transition",
                      isSelected
                        ? "ring-2 ring-primary"
                        : "ring-1 ring-divider hover:ring-primary-light",
                    ].join(" ")}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <p
            id="last-name-error"
            className={[
              "mt-3 text-[14px] font-semibold leading-normal tracking-normal text-danger",
              surnameError ? "block" : "hidden",
            ].join(" ")}
          >
            성씨를 선택해주세요.
          </p>
        </div>
      </section>
    </FunnelFrame>
  );
}

function SurnameDropdown({
  status,
  options,
  selectedSurnameId,
  onSelect,
}: SurnameDropdownProps) {
  const renderContent = () => {
    if (status === "loading") {
      return (
        <p className="flex items-center gap-2 px-5 py-4 text-[15px] font-medium leading-normal tracking-normal text-ink-muted">
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin text-primary"
            strokeWidth={2.4}
          />
          성씨를 찾고 있어요.
        </p>
      );
    }

    if (status === "error") {
      return (
        <p className="flex items-center gap-2 px-5 py-4 text-[15px] font-semibold leading-normal tracking-normal text-danger">
          <CircleAlert
            aria-hidden="true"
            className="size-4"
            strokeWidth={2.4}
          />
          성씨 목록을 불러오지 못했어요.
        </p>
      );
    }

    if (status !== "success") {
      return null;
    }

    if (options.length === 0) {
      return (
        <p className="px-5 py-4 text-[15px] font-medium leading-normal tracking-normal text-ink-muted">
          일치하는 성씨가 없어요.
        </p>
      );
    }

    return options.map((option) => {
      const isSelected = selectedSurnameId === option.id;

      return (
        <button
          key={`${option.id}-${option.hangul}-${option.hanja}`}
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            onSelect(option);
          }}
          aria-pressed={isSelected}
          className={[
            "flex min-h-14 w-full items-center justify-between px-5 text-left transition",
            isSelected
              ? "bg-surface-section text-primary"
              : "bg-white text-ink hover:bg-surface-section",
          ].join(" ")}
        >
          <span className="flex items-center gap-3">
            <span className="text-[22px] font-semibold leading-none tracking-normal">
              {option.hangul}
            </span>
            {isSelected && (
              <Check
                aria-hidden="true"
                className="size-5 text-primary"
                strokeWidth={2.8}
              />
            )}
          </span>
          <span className="text-[18px] font-medium leading-none tracking-normal text-ink-muted">
            {option.hanja}
          </span>
        </button>
      );
    });
  };

  return (
    <div className="absolute left-0 right-0 top-[76px] z-20 overflow-hidden rounded-lg border border-divider bg-white shadow-card">
      {renderContent()}
    </div>
  );
}
