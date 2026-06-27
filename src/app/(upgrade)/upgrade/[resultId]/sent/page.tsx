"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function UpgradeSentPage({
  params,
  searchParams,
}: {
  params: Promise<{ resultId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { resultId } = use(params);
  const { email: emailParam } = use(searchParams);
  const email = Array.isArray(emailParam)
    ? emailParam[0]
    : emailParam || "example@email.com";
  const [digits, setDigits] = useState(() =>
    Array<string>(CODE_LENGTH).fill(""),
  );
  const [resendRemaining, setResendRemaining] = useState(RESEND_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join("");
  const isCodeComplete = code.length === CODE_LENGTH;

  useEffect(() => {
    if (resendRemaining <= 0) return;

    const timer = window.setTimeout(() => {
      setResendRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendRemaining]);

  // 숫자만 남긴 뒤 현재 칸부터 순서대로 채움.
  function updateDigits(startIndex: number, value: string) {
    const nextDigits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);

    // 입력 칸에 숫자가 없으면 비움
    if (!nextDigits) {
      setDigits((current) => {
        const next = [...current];
        next[startIndex] = "";
        return next;
      });
      return;
    }

    setDigits((current) => {
      const next = [...current];
      nextDigits.split("").forEach((digit, offset) => {
        const targetIndex = startIndex + offset;
        if (targetIndex < CODE_LENGTH) next[targetIndex] = digit;
      });
      return next;
    });

    // 입력된 길이만큼 다음 칸으로 이동하되 마지막 칸을 넘지 않음
    const nextFocusIndex = Math.min(
      startIndex + nextDigits.length,
      CODE_LENGTH - 1,
    );
    inputRefs.current[nextFocusIndex]?.focus();
    inputRefs.current[nextFocusIndex]?.select();
  }

  function handleResend() {
    if (resendRemaining > 0 || isResending) return;

    setIsResending(true);
    // TODO: api 연결
    setDigits(Array<string>(CODE_LENGTH).fill(""));
    setResendRemaining(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
    inputRefs.current[0]?.select();
    setIsResending(false);
  }

  return (
    <main className="flex min-h-dvh flex-col bg-[#FEFCFF] px-5 py-11 text-center text-ink">
      <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col">
        <Link href="/">
          <Image
            src="/assets/logo.png"
            alt="첫지음"
            width={1106}
            height={620}
            priority
            className="mx-auto h-auto w-[90px] object-contain"
          />
        </Link>

        <section className="mt-[78px]" aria-labelledby="upgrade-sent-title">
          <h1
            id="upgrade-sent-title"
            className="text-[30px] font-extrabold leading-[1.45] tracking-[-0.4px] text-ink"
          >
            이메일로 전송된
            <br />
            <span className="text-primary-light">인증번호를</span> 입력해주세요
          </h1>

          <div className="mt-8 inline-flex max-w-full items-center justify-center rounded-[22px] bg-surface-section px-5 py-4 text-[16px] font-semibold leading-none tracking-[-0.2px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <span className="truncate">{email}</span>
          </div>

          <form
            className="mt-10"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isCodeComplete) return;

              // TODO: 인증 api 연결
            }}
          >
            <input type="hidden" name="code" value={code} />

            <fieldset className="grid grid-cols-6 gap-2">
              <legend className="sr-only">인증번호 6자리</legend>
              {digits.map((digit, index) => (
                <label key={index} className="block min-w-0">
                  <span className="sr-only">인증번호 {index + 1}번째 숫자</span>
                  <input
                    ref={(node) => {
                      inputRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    pattern="[0-9]*"
                    maxLength={CODE_LENGTH}
                    value={digit}
                    onChange={(event) =>
                      updateDigits(index, event.target.value)
                    }
                    onFocus={(event) => event.target.select()}
                    onPaste={(event) => {
                      // 6자리 전체를 붙여넣어도 각 input에 한 자리씩 분배
                      event.preventDefault();
                      updateDigits(index, event.clipboardData.getData("text"));
                    }}
                    onKeyDown={(event) => {
                      // BackSpace만 직접 처리
                      if (event.key !== "Backspace") return;

                      // 현재 칸에 값이 있으면
                      if (digits[index]) {
                        setDigits((current) => {
                          const next = [...current];
                          next[index] = "";
                          return next;
                        });
                        return;
                      }

                      // 현재 칸에 값이 비어있으면, 이전 칸을 지우고 포커스를 이전 칸으로 옮김
                      if (index > 0) {
                        event.preventDefault();
                        setDigits((current) => {
                          const next = [...current];
                          next[index - 1] = "";
                          return next;
                        });
                        inputRefs.current[index - 1]?.focus();
                        inputRefs.current[index - 1]?.select();
                      }
                    }}
                    className="h-[68px] w-full min-w-0 rounded-[18px] border border-divider bg-white text-center text-[22px] font-bold leading-none tracking-[-0.2px] text-ink shadow-[0_2px_10px_rgba(45,37,64,0.03)] outline-none transition placeholder:text-ink-light focus:border-primary-light focus:ring-1 focus:ring-primary-light min-[430px]:h-[82px]"
                  />
                </label>
              ))}
            </fieldset>

            <button
              type="submit"
              disabled={!isCodeComplete}
              className="mt-8 h-[62px] w-full rounded-[20px] bg-primary-light text-[19px] font-bold leading-none tracking-[-0.2px] text-white shadow-[0_8px_22px_rgba(124,111,205,0.24)] transition hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-primary-pale disabled:text-primary-muted disabled:shadow-none disabled:hover:bg-primary-pale"
            >
              이메일 인증
            </button>

            <div className="mt-12 flex min-h-[72px] items-center justify-between gap-3 rounded-[22px] border border-divider bg-white px-5 text-left shadow-[0_2px_12px_rgba(124,111,205,0.05)]">
              <p className="text-[15px] font-semibold leading-none tracking-[-0.2px] text-ink">
                인증번호가 오지 않았나요?
              </p>
              <button
                type="button"
                disabled={resendRemaining > 0 || isResending}
                onClick={handleResend}
                className="shrink-0 rounded-[18px] bg-primary-pale p-4 text-[15px] font-bold leading-none tracking-[-0.2px] text-primary transition hover:bg-primary-light hover:text-white disabled:cursor-not-allowed disabled:bg-primary-pale/40 disabled:text-primary-muted/70 disabled:hover:bg-primary-pale/40 disabled:hover:text-primary-muted/70"
              >
                {resendRemaining > 0
                  ? `재발송 (00:${String(resendRemaining).padStart(2, "0")})`
                  : isResending
                    ? "재발송 중"
                    : "재발송"}
              </button>
            </div>
          </form>

          <Link
            href={`/upgrade/${resultId}`}
            className="mt-7 mb-12 block w-fit text-[16px] font-bold leading-none tracking-[-0.2px] text-primary underline decoration-primary underline-offset-4"
          >
            이메일 변경
          </Link>
        </section>

        <footer className="mt-auto flex items-center justify-center gap-5 border-t border-divider pt-6 text-[14px] font-semibold leading-none text-ink-muted">
          <Link href="/terms">이용약관</Link>
          <span aria-hidden="true" className="h-3 w-px bg-ink-light" />
          <Link href="/privacy">개인정보처리방침</Link>
        </footer>
      </div>
    </main>
  );
}
