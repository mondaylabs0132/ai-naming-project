"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitEvent, useEffect, useRef, useState } from "react";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
]);

type AuthErrorResponse = {
  code?: string;
  retryAfterSeconds?: string;
};

function getSafeRedirectTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function getSendOtpMessage(error: AuthErrorResponse) {
  if (error.code === "validation_failed") {
    return "이메일을 다시 확인해주세요.";
  }

  if (error.code && RATE_LIMIT_CODES.has(error.code)) {
    return error.retryAfterSeconds
      ? `요청이 너무 많아요. ${error.retryAfterSeconds}초 후 다시 시도해주세요.`
      : "요청이 너무 많아요. 1분 후 다시 시도해주세요.";
  }

  return "인증번호를 보내지 못했어요. 잠시 후 다시 시도해주세요.";
}

function getVerifyOtpMessage(error: AuthErrorResponse) {
  if (error.code === "validation_failed") {
    return "인증번호를 다시 확인해주세요.";
  }

  if (error.code === "otp_expired") {
    return "인증번호가 올바르지 않거나 만료되었습니다.";
  }

  if (error.code && RATE_LIMIT_CODES.has(error.code)) {
    return error.retryAfterSeconds
      ? `요청이 너무 많아요. ${error.retryAfterSeconds}초 후 다시 시도해주세요.`
      : "인증 요청이 너무 많아요. 1분 후 다시 시도해주세요.";
  }

  return "인증번호를 확인해주세요.";
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirectTo(searchParams.get("redirectTo"));
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");

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

        {step === "email" ? (
          <EmailStep
            onSent={(sentEmail) => {
              setEmail(sentEmail);
              setStep("otp");
            }}
          />
        ) : (
          <OtpStep
            email={email}
            onChangeEmail={() => setStep("email")}
            onVerified={() => router.push(redirectTo)}
          />
        )}

        <footer className="mt-auto flex items-center justify-center gap-5 border-t border-divider pt-6 text-[14px] font-semibold leading-none text-ink-muted">
          <Link href="/terms">이용약관</Link>
          <span aria-hidden="true" className="h-3 w-px bg-ink-light" />
          <Link href="/privacy">개인정보처리방침</Link>
        </footer>
      </div>
    </main>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString().trim() ?? "";

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response
          .json()
          .catch(() => ({}))) as AuthErrorResponse;
        setMessage(getSendOtpMessage(data));
        return;
      }

      onSent(email);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-[78px] mb-12" aria-labelledby="login-email-title">
      <h1
        id="login-email-title"
        className="text-[30px] font-extrabold leading-[1.45] tracking-[-0.4px] text-ink"
      >
        이메일로
        <br />
        <span className="text-primary-light">간편하게</span> 로그인하세요
      </h1>

      <p className="mt-8 text-[16px] font-semibold leading-[1.65] tracking-[-0.2px] text-ink-muted">
        비밀번호 없이 이메일만으로
        <br />
        로그인해요
      </p>

      <form onSubmit={handleSubmit} className="mt-[50px] space-y-5">
        <label htmlFor="login-email" className="sr-only">
          이메일
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="이메일을 입력해주세요"
          className="h-[70px] w-full rounded-xl border border-divider bg-white px-6 text-[18px] font-semibold tracking-[-0.2px] text-ink shadow-[0_2px_10px_rgba(45,37,64,0.03)] outline-none transition placeholder:text-ink-light focus:border-primary focus:ring-4 focus:ring-primary-pale"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-[62px] w-full rounded-[20px] bg-primary-light text-[19px] font-bold leading-none tracking-[-0.2px] text-white shadow-[0_8px_22px_rgba(124,111,205,0.24)] transition hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-primary-pale disabled:text-primary-muted disabled:shadow-none disabled:hover:bg-primary-pale"
        >
          {isSubmitting ? "발송 중" : "인증번호 받기"}
        </button>

        <div className="min-h-[20px]">
          {message && (
            <p
              aria-live="polite"
              className="text-left text-[14px] font-semibold leading-[1.45] tracking-[-0.1px] text-primary"
            >
              {message}
            </p>
          )}
        </div>
      </form>

      <aside className="mt-5 flex items-center rounded-xl border border-divider bg-white px-4 py-3 text-left shadow-[0_2px_12px_rgba(124,111,205,0.05)]">
        <Image
          src="/assets/auth/lock.png"
          alt=""
          width={1024}
          height={1024}
          className="h-[55px] w-[55px] shrink-0 object-contain"
        />
        <div>
          <p className="text-[15px] font-bold leading-[1.45] tracking-[-0.2px] text-primary">
            입력하신 정보는 안전하게 보호돼요
          </p>
          <p className="mt-1 text-[14px] font-semibold leading-[1.45] tracking-[-0.1px] text-ink-muted">
            외부에 공개되지 않아요
          </p>
        </div>
      </aside>
    </section>
  );
}

function OtpStep({
  email,
  onChangeEmail,
  onVerified,
}: {
  email: string;
  onChangeEmail: () => void;
  onVerified: () => void;
}) {
  const [digits, setDigits] = useState(() =>
    Array<string>(CODE_LENGTH).fill(""),
  );
  const [resendRemaining, setResendRemaining] = useState(RESEND_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [resendMessage, setResendMessage] = useState("");
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

  // 붙여넣기까지 고려해서 숫자만 남기고 최대 6자리까지만 반영한다.
  function updateDigits(startIndex: number, value: string) {
    const nextDigits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);

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

    // 여러 자리가 한 번에 들어오면 마지막으로 채운 칸 다음에 포커스를 둠
    const nextFocusIndex = Math.min(
      startIndex + nextDigits.length,
      CODE_LENGTH - 1,
    );
    inputRefs.current[nextFocusIndex]?.focus();
    inputRefs.current[nextFocusIndex]?.select();
  }

  async function handleResend() {
    // 타이머가 남아있거나 이미 요청 중이면 중복 재발송을 막는다.
    if (resendRemaining > 0 || isResending) return;

    setIsResending(true);
    setVerifyMessage("");
    setResendMessage("");

    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response
          .json()
          .catch(() => ({}))) as AuthErrorResponse;
        setResendMessage(getSendOtpMessage(data));
        return;
      }

      // 재발송에 성공하면 이전 입력값을 비우고 첫 번째 칸부터 다시 입력하게 함
      setDigits(Array<string>(CODE_LENGTH).fill(""));
      setResendRemaining(RESEND_SECONDS);
      setResendMessage("");
      inputRefs.current[0]?.focus();
      inputRefs.current[0]?.select();
    } finally {
      setIsResending(false);
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isCodeComplete || isVerifying) return;

    setIsVerifying(true);
    setVerifyMessage("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token: code }),
      });

      if (!response.ok) {
        const data = (await response
          .json()
          .catch(() => ({}))) as AuthErrorResponse;
        setVerifyMessage(getVerifyOtpMessage(data));
        return;
      }

      onVerified();
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <section className="mt-[78px]" aria-labelledby="login-sent-title">
      <h1
        id="login-sent-title"
        className="text-[30px] font-extrabold leading-[1.45] tracking-[-0.4px] text-ink"
      >
        이메일로 전송된
        <br />
        <span className="text-primary-light">인증번호를</span> 입력해주세요
      </h1>

      <div className="mt-8 inline-flex max-w-full items-center justify-center rounded-xl bg-surface-section px-5 py-4 text-[16px] font-semibold leading-none tracking-[-0.2px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <span className="truncate">{email}</span>
      </div>

      <form className="mt-10" onSubmit={handleSubmit}>
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
                onChange={(event) => updateDigits(index, event.target.value)}
                onFocus={(event) => event.target.select()}
                onPaste={(event) => {
                  event.preventDefault();
                  updateDigits(index, event.clipboardData.getData("text"));
                }}
                onKeyDown={(event) => {
                  // Backspace만 처리함.
                  if (event.key !== "Backspace") return;

                  // 현재 칸에 값이 있으면 그 칸만 비움
                  if (digits[index]) {
                    setDigits((current) => {
                      const next = [...current];
                      next[index] = "";
                      return next;
                    });
                    return;
                  }

                  // 빈 칸에서 Backspace를 누르면 이전 칸을 비우고 포커스를 옮김
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
                className="h-[68px] w-full min-w-0 rounded-lg border border-divider bg-white text-center text-[22px] font-bold leading-none tracking-[-0.2px] text-ink shadow-[0_2px_10px_rgba(45,37,64,0.03)] outline-none transition placeholder:text-ink-light focus:border-primary-light focus:ring-1 focus:ring-primary-light min-[430px]:h-[82px]"
              />
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={!isCodeComplete || isVerifying}
          className="mt-8 h-[62px] w-full rounded-[20px] bg-primary-light text-[19px] font-bold leading-none tracking-[-0.2px] text-white shadow-[0_8px_22px_rgba(124,111,205,0.24)] transition hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-primary-pale disabled:text-primary-muted disabled:shadow-none disabled:hover:bg-primary-pale"
        >
          {isVerifying ? "인증 중" : "이메일 인증"}
        </button>

        <div className="mt-4 min-h-[20px]">
          {verifyMessage && (
            <p
              aria-live="polite"
              className="mt-4 text-left text-[14px] font-semibold leading-[1.45] tracking-[-0.1px] text-primary"
            >
              {verifyMessage}
            </p>
          )}
        </div>

        <div className="mt-4 flex min-h-[72px] items-center justify-between gap-3 rounded-xl border border-divider bg-white px-5 text-left shadow-[0_2px_12px_rgba(124,111,205,0.05)]">
          <p className="text-[15px] font-semibold leading-none tracking-[-0.2px] text-ink">
            인증번호가 오지 않았나요?
          </p>
          <button
            type="button"
            disabled={resendRemaining > 0 || isResending}
            onClick={handleResend}
            className="shrink-0 rounded-lg bg-primary-pale p-4 text-[15px] font-bold leading-none tracking-[-0.2px] text-primary transition hover:bg-primary-light hover:text-white disabled:cursor-not-allowed disabled:bg-primary-pale/40 disabled:text-primary-muted/70 disabled:hover:bg-primary-pale/40 disabled:hover:text-primary-muted/70"
          >
            {resendRemaining > 0
              ? `재발송 (00:${String(resendRemaining).padStart(2, "0")})`
              : isResending
                ? "재발송 중"
                : "재발송"}
          </button>
        </div>

        <div className="mt-4 min-h-[20px]">
          {resendMessage && (
            <p
              aria-live="polite"
              className="text-left text-[14px] font-semibold leading-[1.45] tracking-[-0.1px] text-primary"
            >
              {resendMessage}
            </p>
          )}
        </div>
      </form>

      <button
        type="button"
        onClick={onChangeEmail}
        className="mt-4 mb-12 block w-fit text-[16px] font-bold leading-none tracking-[-0.2px] text-primary underline decoration-primary underline-offset-4"
      >
        이메일 변경
      </button>
    </section>
  );
}
