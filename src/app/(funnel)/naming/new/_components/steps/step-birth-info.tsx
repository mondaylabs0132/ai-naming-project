"use client";

import { CalendarDays, ChevronDown, Info, Lightbulb } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import FunnelFrame from "../funnel-frame";
import type { FunnelStepProps } from "../funnel-footer";
import type { BirthStatus, SurveyData } from "../../_lib/schema";

type BirthTimeParts = {
  period: "" | "AM" | "PM";
  hour: string;
  minute: string;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1),
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const PERIOD_OPTIONS = ["AM", "PM"];
const BIRTH_TIME_PATTERN = /^(AM|PM):(0?[1-9]|1[0-2]):([0-5][0-9])$/;
const BIRTH_INFO_FIELDS = [
  "birthYear",
  "birthMonth",
  "birthDay",
  "birthTime",
] as const;
const ERROR_TEXT_CLASS =
  "mt-3 text-[14px] font-semibold leading-normal tracking-normal text-danger";

export default function StepBirthInfo({
  currentStep,
  onNext,
  onPrev,
}: FunnelStepProps) {
  const { control, trigger } = useFormContext<SurveyData>();
  const birthStatus = useWatch({ control, name: "birthStatus" });
  const isBeforeBirth = birthStatus === "BEFORE_BIRTH";

  const handleNext = async () => {
    const isValid = await trigger([...BIRTH_INFO_FIELDS]);

    if (!isValid) {
      return;
    }

    onNext?.();
  };

  return (
    <FunnelFrame currentStep={currentStep} onNext={handleNext} onPrev={onPrev}>
      <section className="bg-bg px-11 pt-2">
        <div className="grid min-h-[250px] grid-cols-[minmax(0,1fr)_190px] items-start gap-1 overflow-hidden">
          <div className="pt-8">
            <h1 className="text-[29px] font-bold leading-[1.35] tracking-normal text-[#15386D]">
              {isBeforeBirth ? (
                <>
                  아이의 예상 출생 시기를
                  <br />
                  <span className="text-primary">입력</span>해주세요
                </>
              ) : (
                <>
                  아이의 출생 정보를
                  <br />
                  <span className="text-primary">입력</span>해주세요
                </>
              )}
            </h1>
            <p className="mt-5 text-body font-semibold leading-[1.75] tracking-normal text-[#687896]">
              정확한 사주 분석을 위해
              <br />
              {isBeforeBirth
                ? "예상 연도와 월을 선택해주세요."
                : "출생 날짜와 시간을 입력해주세요."}
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

        {isBeforeBirth ? <BeforeBirthFields /> : <AfterBirthFields />}
      </section>
    </FunnelFrame>
  );
}

function BeforeBirthFields() {
  const { control, setValue, trigger, clearErrors } =
    useFormContext<SurveyData>();
  const { errors } = useFormState({ control });
  const [birthYear, birthMonth] = useWatch({
    control,
    name: ["birthYear", "birthMonth"],
  });

  // 출생 전은 오늘이 속한 달부터 미래 월만 선택 가능
  const today = useMemo(() => new Date(), []);
  const { yearOptions, monthOptions } = useMemo(
    () => getBirthDateOptions("BEFORE_BIRTH", birthYear, birthMonth, today),
    [birthMonth, birthYear, today],
  );

  // 저장된 값이 현재 옵션 범위 밖이면 select에는 빈 값으로 보여줌
  const selectedYear = yearOptions.includes(birthYear ?? "")
    ? birthYear
    : undefined;
  const selectedMonth = monthOptions.includes(birthMonth ?? "")
    ? birthMonth
    : undefined;

  // 날짜 필드를 바꾸면 이전 검증 메시지는 현재 입력 흐름과 맞지 않으므로 지움
  const clearBirthInfoErrors = () => clearErrors([...BIRTH_INFO_FIELDS]);

  const handleYearChange = (nextBirthYear: string) => {
    const nextYear = nextBirthYear || undefined;
    // 연도가 바뀌면 기존 월이 새 연도의 선택 가능 범위에 남아있는지 다시 확인
    const nextMonthOptions = getBirthDateOptions(
      "BEFORE_BIRTH",
      nextYear,
      undefined,
      today,
    ).monthOptions;
    const nextMonth =
      nextYear && birthMonth && nextMonthOptions.includes(birthMonth)
        ? birthMonth
        : undefined;

    // 연도 변경으로 월이 유효하지 않으면 월을 비우고, 출생 전에서 쓰지 않는 일/시도 제거함
    clearBirthInfoErrors();
    setValue("birthYear", nextYear, { shouldDirty: true });
    setValue("birthMonth", nextMonth, { shouldDirty: true });
    setValue("birthDay", undefined, { shouldDirty: true });
    setValue("birthTime", undefined, { shouldDirty: true });
  };

  const handleMonthChange = (nextBirthMonth: string) => {
    // 출생 전 월만 바꿔도 일/시는 사용하지 않는 값이라 항상 비움
    clearBirthInfoErrors();
    setValue("birthMonth", nextBirthMonth || undefined, { shouldDirty: true });
    setValue("birthDay", undefined, { shouldDirty: true });
    setValue("birthTime", undefined, { shouldDirty: true });
  };

  return (
    <>
      <div className="rounded-[22px] bg-white px-7 py-8 shadow-card">
        <div className="flex items-center gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-pale text-primary">
            <CalendarDays
              aria-hidden="true"
              className="size-5"
              strokeWidth={2.4}
            />
          </span>
          <h2 className="text-[19px] font-bold leading-tight tracking-normal text-[#15386D]">
            예상 출생 시기를 선택해주세요
          </h2>
        </div>

        <div className="mt-8 space-y-7">
          <div>
            <label
              htmlFor="birth-year"
              className="block text-[17px] font-bold leading-none tracking-normal text-[#15386D]"
            >
              예상 출생 연도
            </label>
            <div className="mt-4">
              <SelectField
                id="birth-year"
                label="예상 출생 연도"
                value={selectedYear}
                placeholder="연도"
                options={yearOptions}
                getOptionLabel={(year) => `${year}년`}
                onChange={handleYearChange}
              />
            </div>
            <p
              className={[
                ERROR_TEXT_CLASS,
                errors.birthYear?.message ? "block" : "hidden",
              ].join(" ")}
            >
              {errors.birthYear?.message}
            </p>
          </div>

          <div>
            <label
              htmlFor="birth-month"
              className="block text-[17px] font-bold leading-none tracking-normal text-[#15386D]"
            >
              예상 출생 월
            </label>
            <div className="mt-4">
              <SelectField
                id="birth-month"
                label="예상 출생 월"
                value={selectedMonth}
                placeholder="월"
                options={selectedYear ? monthOptions : []}
                getOptionLabel={(month) => `${month}월`}
                onChange={handleMonthChange}
                onOpenAttempt={() => {
                  if (!selectedYear) {
                    void trigger("birthYear");
                  }
                }}
              />
            </div>
            <p
              className={[
                ERROR_TEXT_CLASS,
                errors.birthMonth?.message ? "block" : "hidden",
              ].join(" ")}
            >
              {errors.birthMonth?.message}
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-[14px] bg-[#F5EFFF] p-4">
          <div className="flex items-start gap-2 text-primary">
            <Lightbulb
              aria-hidden="true"
              className="size-6 shrink-0"
              strokeWidth={2.4}
            />
            <div>
              <p className="mt-1 text-[16px] font-bold leading-none tracking-normal">
                알려드려요
              </p>
              <ul className="mt-3 list-disc space-y-1 text-[13px] font-semibold leading-[1.65] tracking-normal text-[#657192] marker:text-primary">
                <li>출생 전에는 정확한 사주 분석이 어려워요.</li>
                <li>
                  선택하신 예상 시기를 기반으로 임시 분석 결과를 제공해드려요.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex min-h-[54px] w-full items-center gap-1 rounded-[14px] bg-[#FFF4E6] p-2 text-left shadow-[0_2px_12px_rgba(255,179,71,0.08)]">
        <Image
          src="/coupon.png"
          alt=""
          width={34}
          height={34}
          className="size-8 shrink-0 object-contain"
        />
        <span className="text-[14px] font-bold leading-tight tracking-normal text-[#8B5E26]">
          출산 후 실제 정보 입력 시,{" "}
          <span className="text-[#F08A24]">무료 재분석 쿠폰</span>을 드려요!
        </span>
        <Image
          src="/gift-box.png"
          alt=""
          width={24}
          height={24}
          className="size-6 shrink-0 object-contain"
        />
      </div>
    </>
  );
}

function AfterBirthFields() {
  const { control, setValue, trigger, clearErrors } =
    useFormContext<SurveyData>();
  const { errors } = useFormState({ control });
  const [birthYear, birthMonth, birthDay, birthTime] = useWatch({
    control,
    name: ["birthYear", "birthMonth", "birthDay", "birthTime"],
  });

  // 출생 후는 오늘까지의 과거 날짜만 선택 가능
  const today = useMemo(() => new Date(), []);
  const { yearOptions, monthOptions, dayOptions } = useMemo(
    () => getBirthDateOptions("AFTER_BIRTH", birthYear, birthMonth, today),
    [birthMonth, birthYear, today],
  );

  // 저장된 값이 현재 옵션 범위 밖이면 select에는 빈 값으로 보여줌
  const selectedYear = yearOptions.includes(birthYear ?? "")
    ? birthYear
    : undefined;
  const selectedMonth = monthOptions.includes(birthMonth ?? "")
    ? birthMonth
    : undefined;
  const selectedDay = dayOptions.includes(birthDay ?? "")
    ? birthDay
    : undefined;

  // 저장된 birthTime을 다시 select 표시용으로 쪼갠 값
  const savedTimeParts = useMemo<BirthTimeParts>(() => {
    const birthTimeMatch = birthTime?.match(BIRTH_TIME_PATTERN);

    return birthTimeMatch
      ? {
          period: birthTimeMatch[1] as "AM" | "PM",
          hour: String(Number(birthTimeMatch[2])),
          minute: birthTimeMatch[3],
        }
      : { period: "", hour: "", minute: "" };
  }, [birthTime]);

  // period, hour, minute이 모두 채워지기 전까지 저장을 위한 중간값
  const [draftTimeParts, setDraftTimeParts] = useState<BirthTimeParts>({
    period: "",
    hour: "",
    minute: "",
  });

  // 저장된 시간이 있으면 저장값을, 아직 완성 전이면 중간 선택값을 보여줌.
  const timeParts = birthTime ? savedTimeParts : draftTimeParts;

  const birthDateError =
    errors.birthYear?.message ??
    errors.birthMonth?.message ??
    errors.birthDay?.message;

  // 날짜 필드를 바꾸면 이전 검증 메시지는 현재 입력 흐름과 맞지 않으므로 지움
  const clearBirthInfoErrors = () => clearErrors([...BIRTH_INFO_FIELDS]);

  const handleYearChange = (nextBirthYear: string) => {
    const nextYear = nextBirthYear || undefined;

    // 연도가 바뀌면 기존 월이 새 연도의 선택 가능 범위에 남아있는지 다시 확인
    const nextMonthOptions = getBirthDateOptions(
      "AFTER_BIRTH",
      nextYear,
      undefined,
      today,
    ).monthOptions;
    const nextMonth =
      nextYear && birthMonth && nextMonthOptions.includes(birthMonth)
        ? birthMonth
        : undefined;

    // 연도 변경으로 월 범위가 바뀌면 일은 더 이상 신뢰할 수 없어서 비움
    clearBirthInfoErrors();
    setValue("birthYear", nextYear, { shouldDirty: true });
    setValue("birthMonth", nextMonth, { shouldDirty: true });
    setValue("birthDay", undefined, { shouldDirty: true });
  };

  const handleMonthChange = (nextBirthMonth: string) => {
    const nextMonth = nextBirthMonth || undefined;
    // 월이 바뀌면 기존 일이 새 월의 말일/오늘 제한 안에 남아있는지 다시 확인
    const nextDayOptions = getBirthDateOptions(
      "AFTER_BIRTH",
      birthYear,
      nextMonth,
      today,
    ).dayOptions;
    const nextDay =
      birthDay && nextDayOptions.includes(birthDay) ? birthDay : undefined;

    // 월 변경으로 일이 유효하지 않으면 일만 비움
    clearBirthInfoErrors();
    setValue("birthMonth", nextMonth, { shouldDirty: true });
    setValue("birthDay", nextDay, { shouldDirty: true });
  };

  const handleDayChange = (nextBirthDay: string) => {
    clearBirthInfoErrors();
    setValue("birthDay", nextBirthDay || undefined, { shouldDirty: true });
  };

  const handleTimeChange = (patch: Partial<BirthTimeParts>) => {
    clearErrors("birthTime");

    const nextParts = { ...timeParts, ...patch };
    // 오전/오후, 시, 분이 모두 채워졌을 때만 zod 형식에 맞는 문자열로 저장
    const nextBirthTime =
      nextParts.period && nextParts.hour && nextParts.minute
        ? `${nextParts.period}:${nextParts.hour.padStart(2, "0")}:${
            nextParts.minute
          }`
        : undefined;

    setDraftTimeParts(nextParts);
    setValue("birthTime", nextBirthTime, { shouldDirty: true });
  };

  return (
    <div className="rounded-[22px] bg-white px-7 py-8 shadow-card">
      <div className="flex items-center gap-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-pale text-primary">
          <CalendarDays
            aria-hidden="true"
            className="size-5"
            strokeWidth={2.4}
          />
        </span>
        <h2 className="text-[19px] font-bold leading-tight tracking-normal text-[#15386D]">
          출생 정보를 입력해주세요
        </h2>
      </div>

      <fieldset className="mt-8">
        <legend className="text-[17px] font-bold leading-none tracking-normal text-[#15386D]">
          출생 날짜
        </legend>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <SelectField
            id="birth-year"
            label="출생 연도"
            value={selectedYear}
            placeholder="연도"
            options={yearOptions}
            getOptionLabel={(year) => `${year}년`}
            onChange={handleYearChange}
            describedBy="birth-date-error"
          />
          <SelectField
            id="birth-month"
            label="출생 월"
            value={selectedMonth}
            placeholder="월"
            options={selectedYear ? monthOptions : []}
            getOptionLabel={(month) => `${month}월`}
            onChange={handleMonthChange}
            onOpenAttempt={() => {
              if (!selectedYear) {
                void trigger("birthYear");
              }
            }}
            describedBy="birth-date-error"
          />
          <SelectField
            id="birth-day"
            label="출생 일"
            value={selectedDay}
            placeholder="일"
            options={selectedYear && selectedMonth ? dayOptions : []}
            getOptionLabel={(day) => `${day}일`}
            onChange={handleDayChange}
            onOpenAttempt={() => {
              if (!selectedYear) {
                void trigger("birthYear");
                return;
              }

              if (!selectedMonth) {
                void trigger("birthMonth");
              }
            }}
            describedBy="birth-date-error"
          />
        </div>
        <p
          id="birth-date-error"
          className={[
            ERROR_TEXT_CLASS,
            birthDateError ? "block" : "hidden",
          ].join(" ")}
        >
          {birthDateError}
        </p>
      </fieldset>

      <fieldset className="mt-9">
        <legend className="text-[17px] font-bold leading-none tracking-normal text-[#15386D]">
          출생 시간
        </legend>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <SelectField
            id="birth-period"
            label="오전 또는 오후"
            value={timeParts.period}
            placeholder="오전/오후"
            options={PERIOD_OPTIONS}
            getOptionLabel={(period) => (period === "AM" ? "오전" : "오후")}
            onChange={(period) =>
              handleTimeChange({
                period: period === "AM" || period === "PM" ? period : "",
              })
            }
            describedBy="birth-time-help birth-time-error"
          />
          <SelectField
            id="birth-hour"
            label="출생 시"
            value={timeParts.hour}
            placeholder="시"
            options={HOUR_OPTIONS}
            getOptionLabel={(hour) => `${hour}시`}
            onChange={(hour) => handleTimeChange({ hour })}
            describedBy="birth-time-help birth-time-error"
          />
          <SelectField
            id="birth-minute"
            label="출생 분"
            value={timeParts.minute}
            placeholder="분"
            options={MINUTE_OPTIONS}
            getOptionLabel={(minute) => `${minute}분`}
            onChange={(minute) => handleTimeChange({ minute })}
            describedBy="birth-time-help birth-time-error"
          />
        </div>
        <p
          id="birth-time-error"
          className={[
            ERROR_TEXT_CLASS,
            errors.birthTime?.message ? "block" : "hidden",
          ].join(" ")}
        >
          {errors.birthTime?.message}
        </p>
      </fieldset>

      <div
        id="birth-time-help"
        className="mt-7 flex items-start gap-2 text-[14px] font-semibold leading-normal tracking-normal text-[#657192]"
      >
        <Info
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-primary"
          strokeWidth={2.4}
        />
        정확한 시간을 모를 경우, 대략적인 시간을 선택해주세요.
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  onOpenAttempt,
  describedBy,
  getOptionLabel = (option) => option,
}: {
  id: string;
  label: string;
  value?: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
  onOpenAttempt?: () => void;
  describedBy?: string;
  getOptionLabel?: (option: string) => string;
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          onPointerDown={onOpenAttempt}
          onKeyDown={(event) => {
            if ([" ", "Enter", "ArrowDown", "ArrowUp"].includes(event.key)) {
              onOpenAttempt?.();
            }
          }}
          aria-describedby={describedBy}
          className={[
            "h-[58px] w-full appearance-none rounded-lg border border-divider bg-white px-4 pr-11 text-[18px] font-semibold leading-none tracking-normal outline-none transition",
            value ? "text-[#657192]" : "text-ink-light",
            "focus:border-primary focus:shadow-[0_0_0_4px_rgba(124,111,205,0.12)]",
          ].join(" ")}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-6 -translate-y-1/2 text-[#8C93B0]"
          strokeWidth={2.4}
        />
      </div>
    </div>
  );
}

function getBirthDateOptions(
  birthStatus: BirthStatus,
  year: string | undefined,
  month: string | undefined,
  today: Date,
) {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const selectedYear = Number(year);
  const selectedMonth = Number(month);
  const isBeforeBirth = birthStatus === "BEFORE_BIRTH";

  // 출생 전은 현재 연도부터 미래로, 출생 후는 현재 연도부터 과거를 보여줌
  const yearOptions = Array.from({ length: 81 }, (_, index) =>
    String(isBeforeBirth ? currentYear + index : currentYear - index),
  );
  // 선택된 연도가 현재 연도면 오늘 기준으로 과거/미래 월을 잘라낸다.
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1)
    .filter((monthNumber) => {
      if (!selectedYear) {
        return true;
      }

      if (isBeforeBirth) {
        return selectedYear === currentYear
          ? monthNumber >= currentMonth
          : selectedYear > currentYear;
      }

      return selectedYear === currentYear
        ? monthNumber <= currentMonth
        : selectedYear < currentYear;
    })
    .map(String);

  if (!selectedYear || !selectedMonth) {
    // 연/월이 아직 없을 때는 일 선택용 기본 목록만 준비
    return {
      yearOptions,
      monthOptions,
      dayOptions: Array.from({ length: 31 }, (_, index) => String(index + 1)),
    };
  }

  // 선택한 연/월의 실제 말일까지만 일 옵션을 만든다.
  const dayOptions = Array.from(
    { length: new Date(selectedYear, selectedMonth, 0).getDate() },
    (_, index) => index + 1,
  )
    // 출생 후 현재 월이면 오늘 이후의 일자는 숨김.
    .filter((day) => {
      if (
        isBeforeBirth ||
        selectedYear !== currentYear ||
        selectedMonth !== currentMonth
      ) {
        return true;
      }

      return day <= currentDay;
    })
    .map(String);

  return { yearOptions, monthOptions, dayOptions };
}
