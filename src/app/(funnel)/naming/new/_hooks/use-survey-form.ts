"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  storedSurveySchema,
  surveySchema,
  type SurveyData,
} from "../_lib/schema";

const STORAGE_KEY = "naming:new:surveyData";

const EMPTY_SURVEY: SurveyData = {
  surname: undefined,
  birthStatus: undefined,
  birthYear: undefined,
  birthMonth: undefined,
  birthDay: undefined,
  birthTime: undefined,
  gender: undefined,
  moodKeywords: undefined,
  generationName: undefined,
  siblingNames: undefined,
  checkEnglishPronunciation: undefined,
  avoidHangul: undefined,
  avoidHanja: undefined,
};

function loadStoredSurvey(): SurveyData | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = storedSurveySchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// 작명 설문 폼 설정과 sessionStorage 복원 관리
export function useSurveyForm() {
  const methods = useForm<SurveyData>({
    resolver: zodResolver(surveySchema),
    defaultValues: EMPTY_SURVEY,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  const { reset, watch } = methods;

  // sessionStorage의 설문 값을 초기 폼 값으로 복원
  useEffect(() => {
    const storedSurvey = loadStoredSurvey();

    if (storedSurvey) {
      reset({ ...EMPTY_SURVEY, ...storedSurvey });
    }
  }, [reset]);

  // 값이 바뀔 때마다 sessionStorage에 저장.
  useEffect(() => {
    // React Hook Form의 subscription API를 저장 side effect 용도로만 사용한다.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((values) => {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  return methods;
}
