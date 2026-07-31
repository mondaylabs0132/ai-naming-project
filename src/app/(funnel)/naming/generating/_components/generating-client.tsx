"use client";

import { notFound, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { DONE_HOLD_MS } from "../_lib/stages";
import { useElapsedSec } from "../_lib/use-elapsed-sec";
import GeneratingError from "./generating-error";
import GeneratingView from "./generating-view";

export default function GeneratingClient({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [error, setError] = useState<{
    message: string;
    status: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const startedRef = useRef(false);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedSec = useElapsedSec();

  // 언마운트 시 이동 타이머 정리
  useEffect(() => {
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, []);

  const generate = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/naming/${requestId}/free`, {
        method: "POST",
      });
      const result = (await response.json()) as { error?: unknown };

      if (!response.ok) {
        if (response.status === 429) {
          router.replace("/free-limit");
          return;
        }

        setError({
          message:
            typeof result.error === "string"
              ? result.error
              : "이름을 생성하지 못했어요. 잠시 후 다시 시도해주세요.",
          status: response.status,
        });
        return;
      }

      // 무료 결과 생성 완료 → 게이지를 100%까지 채운 뒤 무료 결과 페이지로 이동.
      // (finally의 setIsSubmitting보다 먼저 실행되지만, isDone 화면에서는 무관)
      setIsDone(true);
      doneTimerRef.current = setTimeout(() => {
        router.replace(`/results/${requestId}`);
      }, DONE_HOLD_MS);
    } catch {
      // 네트워크 오류 등 응답 없음 → status 0
      setError({
        message: "이름을 생성하지 못했어요. 잠시 후 다시 시도해주세요.",
        status: 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, requestId, router]);

  // requestId당 한 번만 생성 요청
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void generate();
  }, [generate]);

  if (error) {
    // 404(요청/설문 없음)는 잘못된·만료된 접근이므로 not-found 페이지로 이동
    if (error.status === 404) {
      notFound();
    }
    // 500·네트워크 등 일시적 실패는 재시도 가능한 에러 화면으로 전환
    return (
      <GeneratingError
        message={error.message}
        isSubmitting={isSubmitting}
        onRetry={() => void generate()}
      />
    );
  }

  return <GeneratingView elapsedSec={elapsedSec} isDone={isDone} />;
}
