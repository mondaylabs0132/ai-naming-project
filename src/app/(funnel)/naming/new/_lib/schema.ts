import { z } from "zod";

export const BIRTH_STATUSES = ["BEFORE_BIRTH", "AFTER_BIRTH"] as const;
export const GENDERS = ["남자", "여자", "모름"] as const;
export const MOOD_KEYWORDS = [
  "부드러운",
  "따뜻한",
  "단아한",
  "세련된",
  "지혜로운",
  "모던한",
  "자연스러운",
  "특별한",
] as const;

export type BirthStatus = (typeof BIRTH_STATUSES)[number];
export type Gender = (typeof GENDERS)[number];
export type MoodKeyword = (typeof MOOD_KEYWORDS)[number];

const numberString = (min: number, max: number) =>
  z.string().refine((value) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max;
  });

const surnameSchema = z.object({
  id: z.number(),
  hangul: z.string(),
  hanja: z.string(),
});

const hanjaSchema = z.object({
  id: z.number(),
  hanja: z.string(),
  hangulMain: z.string(),
  meanings: z.array(z.string()),
});

const surveyFormSchema = z.object({
  surname: surnameSchema.optional(),
  birthStatus: z.enum(BIRTH_STATUSES).optional(),
  birthYear: numberString(1900, 2100).optional(),
  birthMonth: numberString(1, 12).optional(),
  birthDay: numberString(1, 31).optional(),
  birthTime: z
    .string()
    .regex(/^(AM|PM):(0?[1-9]|1[0-2]):([0-5][0-9])$/)
    .optional(),
  gender: z.enum(GENDERS).optional(),
  moodKeywords: z.array(z.enum(MOOD_KEYWORDS)).max(3).optional(),
  generationName: z.string().optional(),
  siblingNames: z.array(z.string()).optional(),
  checkEnglishPronunciation: z.boolean().optional(),
  avoidHangul: z.array(z.string()).max(5).optional(),
  avoidHanja: z.array(hanjaSchema).max(5).optional(),
});

export const storedSurveySchema = surveyFormSchema;
export type SurveyData = z.infer<typeof surveyFormSchema>;

export const surveySchema = surveyFormSchema.superRefine((data, ctx) => {
  const addIssue = (path: keyof SurveyData, message: string) => {
    ctx.addIssue({ code: "custom", path: [path], message });
  };

  if (!data.surname) {
    addIssue("surname", "성씨를 선택해주세요.");
  }

  if (!data.birthStatus) {
    addIssue("birthStatus", "아이의 출생 여부를 선택해주세요.");
  }

  const isBeforeBirth = data.birthStatus === "BEFORE_BIRTH";
  const isAfterBirth = data.birthStatus === "AFTER_BIRTH";

  if (!data.birthYear) {
    addIssue(
      "birthYear",
      isBeforeBirth
        ? "예상 출생 연도를 선택해주세요."
        : "출생 연도를 선택해주세요.",
    );
  }

  if (!data.birthMonth) {
    addIssue(
      "birthMonth",
      isBeforeBirth
        ? "예상 출생 월을 선택해주세요."
        : "출생 월을 선택해주세요.",
    );
  }

  if (isAfterBirth && !data.birthDay) {
    addIssue("birthDay", "출생 일을 선택해주세요.");
  }

  if (isAfterBirth && !data.birthTime) {
    addIssue("birthTime", "출생 시간을 선택해주세요.");
  }

  const today = getDateOnly(new Date());

  if (isBeforeBirth && data.birthYear && data.birthMonth) {
    const year = Number(data.birthYear);
    const month = Number(data.birthMonth);
    const isPastMonth =
      year < today.getFullYear() ||
      (year === today.getFullYear() && month < today.getMonth() + 1);

    if (isPastMonth) {
      addIssue("birthMonth", "오늘 이후의 예상 출생 시기를 선택해주세요.");
    }
  }

  if (isAfterBirth && data.birthYear && data.birthMonth && data.birthDay) {
    const birthDate = getBirthDate(
      data.birthYear,
      data.birthMonth,
      data.birthDay,
    );

    if (!birthDate) {
      addIssue("birthDay", "올바른 출생 날짜를 선택해주세요.");
    } else if (birthDate > today) {
      addIssue("birthDay", "오늘 이전의 출생 날짜를 선택해주세요.");
    }
  }

  if (!data.gender) {
    addIssue("gender", "아이의 성별을 선택해주세요.");
  }

  if (!data.moodKeywords?.length) {
    addIssue("moodKeywords", "선호하는 분위기를 1개 이상 선택해주세요.");
  }
});

function getDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getBirthDate(year: string, month: string, day: string) {
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const date = new Date(yearNumber, monthNumber - 1, dayNumber);

  if (
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return undefined;
  }

  return date;
}
