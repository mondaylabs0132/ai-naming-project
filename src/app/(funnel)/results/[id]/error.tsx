"use client";

import { RotateCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function ResultError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-5 py-16 text-center">
      <Image
        src="/assets/funnel-result.png"
        alt=""
        aria-hidden="true"
        width={200}
        height={200}
        className="h-auto w-40 object-contain"
      />

      <p className="mt-8 flex items-center gap-1 font-chalkboard text-ink">
        결과를 불러오지 못했어요
        <span className="text-[10px] pt-1" aria-hidden="true">
          💜
        </span>
      </p>

      <h1 className="mt-3 text-hero font-extrabold leading-tight tracking-[-0.5px]">
        <span className="text-primary">앗,</span>{" "}
        <span className="text-ink">문제가 생겼어요</span>
      </h1>

      <p className="mt-4 text-body leading-relaxed text-ink-muted">
        결과를 불러오는 중 오류가 발생했어요.
        <br />
        잠시 후 다시 시도해주세요.
      </p>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-[64px] w-full items-center justify-center gap-2 rounded-lg bg-primary text-[19px] font-semibold leading-none tracking-normal text-white shadow-btn"
        >
          <RotateCw className="size-5" strokeWidth={2.4} aria-hidden="true" />
          다시 시도하기
        </button>
        <Link
          href="/"
          className="flex h-[64px] w-full items-center justify-center rounded-lg bg-white text-[19px] font-semibold leading-none tracking-normal text-primary shadow-card"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
