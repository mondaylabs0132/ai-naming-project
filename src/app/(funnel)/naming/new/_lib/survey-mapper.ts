import type { ValidSurveyData } from "./schema";

export type NamingSurveyInsert = {
  request_id: string;
  surname_id: number;
  birth_status: "BEFORE_BIRTH" | "AFTER_BIRTH";
  birth_year: number;
  birth_month: number;
  birth_day: number | null;
  birth_time: string | null;
  gender: "남자" | "여자" | "모름";
  mood_keywords: string[];
  avoid_hangul: string[];
  avoid_hanja_id: number[];
  generation_name: string | null;
  sibling_names: string[];
  check_english_pronunciation: boolean;
};

export function mapSurveyToRow(
  surveyData: ValidSurveyData,
  requestId: string,
): NamingSurveyInsert {
  const {
    surname,
    birthStatus,
    birthYear,
    birthMonth,
    birthDay,
    birthTime,
    gender,
    moodKeywords,
    avoidHangul,
    avoidHanja,
    generationName,
    siblingNames,
    checkEnglishPronunciation,
  } = surveyData;

  return {
    request_id: requestId,
    surname_id: surname.id,
    birth_status: birthStatus,
    birth_year: Number(birthYear),
    birth_month: Number(birthMonth),
    birth_day: birthDay ? Number(birthDay) : null,
    birth_time:
      birthStatus === "AFTER_BIRTH" && birthTime
        ? toPostgresTime(birthTime)
        : null,
    gender,
    mood_keywords: moodKeywords,
    avoid_hangul: avoidHangul ?? [],
    avoid_hanja_id: (avoidHanja ?? []).map((hanja) => hanja.id),
    generation_name: generationName?.trim() || null,
    sibling_names: siblingNames ?? [],
    check_english_pronunciation: checkEnglishPronunciation ?? false,
  };
}

function toPostgresTime(birthTime: string) {
  const match = birthTime.match(/^(AM|PM):(0?[1-9]|1[0-2]):([0-5][0-9])$/);

  if (!match) {
    throw new Error("Invalid birthTime format");
  }

  const [, period, hour, minute] = match;
  const hourNumber = Number(hour);
  const hour24 =
    period === "AM" ? hourNumber % 12 : hourNumber === 12 ? 12 : hourNumber + 12;

  return `${String(hour24).padStart(2, "0")}:${minute}:00`;
}
