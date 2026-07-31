"use client";

import { useEffect, useState } from "react";

const TICK_MS = 200;

/**
 * 마운트 시점부터의 경과 시간(초).
 *
 * `speed`는 미리보기 화면에서 배속 재생용으로만 쓴다 (기본 1배).
 * 매 tick마다 시작 시각과의 차이를 다시 계산하므로 탭 비활성화 등으로
 * tick이 밀려도 값이 어긋나지 않는다.
 */
export function useElapsedSec(speed = 1): number {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const id = setInterval(() => {
      setElapsedSec(((performance.now() - startedAt) / 1000) * speed);
    }, TICK_MS);

    return () => clearInterval(id);
  }, [speed]);

  return elapsedSec;
}
