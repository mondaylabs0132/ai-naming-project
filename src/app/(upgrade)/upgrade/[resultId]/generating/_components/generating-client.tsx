"use client";

import { CheckCircle2, RefreshCcw, Siren } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useElapsedSec } from "@/lib/loading/use-elapsed-sec";
import { createClient } from "@/lib/supabase/client";

import {
  DONE_HOLD_MS,
  PREMIUM_STEPS,
  premiumProgressAt,
  progressLabelAt,
  stepStatusAt,
} from "../_lib/premium-stages";

const POLL_INTERVAL = 2000;
const SUPPORT_EMAIL = "support@naming.app";

// 화면 진행 단계: confirming(결제 승인 확인) · generating(생성 완료 대기 폴링) · pending(결제 미확정 폴링) · failed(생성 실패)
type Phase = "confirming" | "generating" | "pending" | "failed";

export default function PremiumGeneratingClient() {
  // useSearchParams는 Suspense 경계가 필요 (Next 16 prerender 규칙)
  return (
    <Suspense fallback={<AnalyzingView pending={false} />}>
      <GeneratingInner />
    </Suspense>
  );
}

function GeneratingInner() {
  const router = useRouter();
  const params = useParams<{ resultId: string }>();
  const resultId = params.resultId;
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  // 시작 단계는 도착 경로로 갈린다.
  // - 카드 결제: Toss가 successUrl에 paymentKey·orderId·amount를 붙여 보냄 → 승인 확인(confirming)부터
  // - 0원 결제/직접 진입: 결제 쿼리 없음, 확인할 게 없으니 곧장 AI 생성 대기 폴링(generating)
  const [phase, setPhase] = useState<Phase>(
    paymentKey && orderId && amount ? "confirming" : "generating",
  );
  // 생성 완료 → 게이지를 100%까지 채운 뒤 결과 페이지로 이동하는 짧은 구간
  const [isDone, setIsDone] = useState(false);
  const confirmedRef = useRef(false);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
  }, []);

  // ── confirm - 1회만
  useEffect(() => {
    if (!paymentKey || !orderId || !amount) return;
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.ok) {
          setPhase("generating"); // 성공 → status 폴링
          return;
        }
        if (res.status === 202 && data.pending) {
          setPhase("pending"); // B(미확정) → premium_orders 폴링
          return;
        }
        // A(명확한 실패) → checkout으로 에러 안내
        router.replace(
          `/upgrade/${resultId}/checkout?error=${encodeURIComponent(
            data.code ?? "payment_failed",
          )}`,
        );
      } catch {
        setPhase("pending"); // 네트워크 오류 → 미확정 취급, 폴링으로 확인
      }
    })();
  }, [paymentKey, orderId, amount, resultId, router]);

  // ── generating: naming_requests.status 폴링 ──
  useEffect(() => {
    if (phase !== "generating") return;
    let alive = true;

    const tick = async () => {
      const { data } = await supabase
        .from("naming_requests")
        .select("status")
        .eq("id", resultId)
        .single();
      if (!alive) return;
      const status = data?.status;
      if (status === "PREMIUM_RESULT_READY") {
        // 게이지를 100%까지 채운 뒤 이동. 폴링은 아래 cleanup에서 멈춘다.
        alive = false;
        setIsDone(true);
        doneTimerRef.current = setTimeout(() => {
          router.replace(`/upgrade/${resultId}/result`);
        }, DONE_HOLD_MS);
      } else if (status === "FAILED") {
        setPhase("failed");
      }
    };

    tick();
    const id = setInterval(tick, POLL_INTERVAL);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [phase, resultId, router, supabase]);

  // ── pending(B): premium_orders.status 폴링  ──
  useEffect(() => {
    if (phase !== "pending") return;
    let alive = true;

    const tick = async () => {
      const { data } = await supabase
        .from("premium_orders")
        .select("status")
        .eq("request_id", resultId)
        .single();
      if (!alive) return;
      const status = data?.status;
      if (status === "COMPLETED") {
        setPhase("generating"); // naming_requests가 PREMIUM_GENERATING으로 넘어감
      } else if (status === "FAILED" || status === "CANCELED") {
        router.replace(
          `/upgrade/${resultId}/checkout?error=${encodeURIComponent(status)}`,
        );
      }
    };

    tick();
    const id = setInterval(tick, POLL_INTERVAL);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [phase, resultId, router, supabase]);

  async function handleRetry() {
    setPhase("generating"); // 낙관적 전환 → 폴링이 RESULT_READY/FAILED로 재판정
    try {
      await fetch(`/api/naming/${resultId}/premium`, { method: "POST" });
    } catch {
      // 폴링이 상태를 다시 잡아줌
    }
  }

  if (phase === "failed") {
    return <GenerationFailedView resultId={resultId} onRetry={handleRetry} />;
  }

  // AI 생성 대기 구간에서만 경과 시간을 계측한다.
  if (phase === "generating") {
    return <LiveAnalyzingView isDone={isDone} />;
  }

  // confirming·pending은 결제 확인 단계 — 아직 생성이 시작되지 않았으므로 0초 상태.
  return <AnalyzingView pending={phase === "pending"} />;
}

/**
 * `generating` 단계에서만 마운트되는 래퍼 — 경과 시간 계측이 여기서 시작된다.
 * 결제 확인(confirming·pending) 구간을 계측에 포함하면 진행 단계가 앞서가버린다.
 */
function LiveAnalyzingView({ isDone }: { isDone: boolean }) {
  const elapsedSec = useElapsedSec();

  return (
    <AnalyzingView pending={false} elapsedSec={elapsedSec} isDone={isDone} />
  );
}

/** 생성 실패 화면 — 결제 성공 후 AI 생성만 실패한 상태. */
function GenerationFailedView({
  resultId,
  onRetry,
}: {
  resultId: string;
  onRetry: () => void;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-pale">
        <Siren size={28} className="text-primary" />
      </div>

      <h1 className="mt-5 text-page-title font-extrabold leading-[1.35] tracking-[-0.4px] text-ink">
        결과 생성 중 문제가 발생했어요
      </h1>

      {/* 1. 결제 정상 안심 문구(필수) */}
      <div className="mt-4 rounded-lg bg-surface p-5 text-left shadow-card">
        <p className="text-[14px] leading-[1.7] text-ink">
          <span className="font-bold text-primary">
            결제는 정상 완료되었습니다.
          </span>{" "}
          결과 생성 중 문제가 발생했어요.{" "}
          <span className="font-bold">요금이 다시 청구되지 않습니다.</span>
        </p>
      </div>

      {/* 2. 다시 시도 */}
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-btn font-bold text-white shadow-btn transition hover:bg-primary-light"
      >
        <RefreshCcw size={18} />
        다시 시도
      </button>

      {/* 3. 문의 안내 */}
      <p className="mt-4 text-caption leading-[1.7] text-ink-muted break-keep">
        문제가 계속되면 문의해주세요.
        <br />
        문의: {SUPPORT_EMAIL}
        <br />
        주문번호: {resultId}
      </p>
    </div>
  );
}

/** 결제 확정 후 생성 대기(분석 중) 화면. pending이면 "결제 확인 중" 배너를 얹는다. */
function AnalyzingView({
  pending,
  elapsedSec = 0,
  isDone = false,
}: {
  pending: boolean;
  /** AI 생성 시작부터의 경과 시간(초). 결제 확인 구간에서는 0 */
  elapsedSec?: number;
  /** 생성 완료 — 게이지를 100%까지 채우고 결과 페이지로 이동하기 직전 */
  isDone?: boolean;
}) {
  const progress = premiumProgressAt(elapsedSec, isDone);
  const progressLabel = progressLabelAt(elapsedSec, isDone);

  return (
    <div className="px-5 py-4 text-center">
      <Image
        src="/assets/check.png"
        alt="check"
        width={1024}
        height={1024}
        className="w-16 h-auto object-contain mx-auto"
      />

      <p className="mt-3 text-caption font-semibold text-primary">
        {pending ? "결제 확인 중이에요..." : "결제가 완료되었어요!"}
      </p>

      <h1 className="mt-2 text-page-title font-extrabold leading-[1.35] tracking-[-0.4px]">
        <span className="text-ink">20개의 이름을</span>
        <br />
        <span className="text-primary">정성껏 분석하고 있어요</span>
      </h1>

      <p className="mt-3 text-[14px] text-ink-muted leading-[1.7]">
        AI와 전문가가 사주, 음양, 발음, 의미까지
        <br />
        꼼꼼하게 분석하여 최고의 이름을 찾아드릴게요.
      </p>

      {/* 일러스트 영역 — 배경(별 캐릭터)은 고정, 분석 카드 에셋만 부유 */}
      <div className="relative my-8">
        <Image
          src="/assets/upgrade-generating-bg.png"
          alt="AI가 노트북으로 이름을 분석하는 일러스트"
          width={1536}
          height={1024}
          sizes="100vw"
          className="block h-auto w-full object-contain"
        />
        {/* 왼쪽 위 도넛 그래프 카드 */}
        <Image
          src="/assets/upgrade-generating-asset1.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="animate-float-soft absolute h-auto"
          style={
            {
              left: "-6.71%",
              top: "6.34%",
              width: "45%",
              "--float-y": "-20px",
              "--float-r": "-2.5deg",
              animationDelay: "0s",
            } as React.CSSProperties
          }
        />
        {/* 왼쪽 아래 "한" 글자 배지 */}
        <Image
          src="/assets/upgrade-generating-asset2.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="animate-float-soft absolute h-auto"
          style={
            {
              left: "-2.49%",
              top: "39.03%",
              width: "33%",
              "--float-y": "-16px",
              "--float-r": "3.5deg",
              animationDelay: "-0.3s",
            } as React.CSSProperties
          }
        />
        {/* 오른쪽 위 선 그래프 카드 */}
        <Image
          src="/assets/upgrade-generating-asset3.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="animate-float-soft absolute h-auto"
          style={
            {
              left: "67.27%",
              top: "12.57%",
              width: "37%",
              "--float-y": "-18px",
              "--float-r": "-2.2deg",
              animationDelay: "-0.6s",
            } as React.CSSProperties
          }
        />
        {/* 오른쪽 아래 "음" 글자 배지 */}
        <Image
          src="/assets/upgrade-generating-asset4.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="animate-float-soft absolute h-auto"
          style={
            {
              left: "67.01%",
              top: "45.48%",
              width: "32%",
              "--float-y": "-14px",
              "--float-r": "2deg",
              animationDelay: "-0.9s",
            } as React.CSSProperties
          }
        />
      </div>

      <div className="min-h-6" aria-live="polite" aria-atomic="true">
        <p
          key={progressLabel}
          className="animate-stage-in text-[14px] font-semibold text-ink"
        >
          {progressLabel}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(progress)}
          aria-label="이름 분석 진행률"
          className="flex-1 h-2 overflow-hidden rounded-full bg-primary-pale"
        >
          {/* 완료 시 transition(300ms)은 DONE_HOLD_MS(400ms)보다 짧아야
              이동 전에 게이지가 실제로 100%까지 차는 게 보인다. */}
          <div
            className={`h-full rounded-full transition-[width] ${
              isDone ? "duration-300 ease-out" : "duration-200 ease-linear"
            }`}
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(to right, var(--color-ink), var(--color-primary))",
            }}
          />
        </div>

        <span className="text-body font-bold text-primary tabular-nums">
          {Math.floor(progress)}%
        </span>
      </div>

      <p className="mt-2 text-caption leading-[1.6] text-ink-muted">
        <span className="inline-block">잠시만 기다려주세요.</span>{" "}
        <span className="inline-block">
          더욱 정확한 결과를 위해 노력하고 있어요.
        </span>
      </p>

      <div className="mt-6 rounded-lg bg-surface p-5 text-left shadow-card">
        {PREMIUM_STEPS.map((step, i) => {
          const status = stepStatusAt(i, elapsedSec, isDone);

          return (
            <div key={step.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                {status === "done" && (
                  <div
                    className="flex items-center justify-center rounded-full bg-primary text-surface"
                    style={{ width: "24px", height: "24px" }}
                  >
                    <CheckCircle2 size={14} />
                  </div>
                )}

                {status === "active" && (
                  <div
                    className="flex items-center justify-center rounded-full border-2 border-primary"
                    style={{ width: "24px", height: "24px" }}
                  >
                    <div
                      className="animate-pulse rounded-full bg-primary"
                      style={{ width: "10px", height: "10px" }}
                    />
                  </div>
                )}

                {status === "pending" && (
                  <div
                    className="rounded-full border-2 border-divider"
                    style={{ width: "24px", height: "24px" }}
                  />
                )}

                {i < PREMIUM_STEPS.length - 1 && (
                  <div
                    className="flex-1 border-l-2 border-dashed border-primary-muted"
                    style={{ width: 0, marginTop: "4px", marginBottom: "4px" }}
                  />
                )}
              </div>

              <div className={i < PREMIUM_STEPS.length - 1 ? "pb-5" : ""}>
                <p
                  className={`text-[14px] font-semibold ${
                    status === "active" ? "text-primary" : "text-ink"
                  }`}
                >
                  {step.title}
                </p>

                <p className="mt-0.5 text-caption leading-normal text-ink-muted">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-primary-pale p-5 text-left">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-primary">
          <Siren size={16} />
          잠깐! 더 좋은 결과를 위한 과정이에요
        </p>

        <p className="mt-1.5 text-caption leading-[1.6] text-ink">
          정확하고 의미 있는 이름을 찾기 위해 다양한 요소를 종합적으로 분석하고
          있어요.
          <br />
          보통 1 ~ 2분 내외로 결과를 받아보실 수 있어요.
        </p>
      </div>

      {/* 아래 정보가 더 부정확하여 주석처리 */}
      {/* <div className="mt-4 rounded-lg bg-surface p-5 text-left shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <span className="text-primary bg-primary-pale p-1 rounded-xs flex items-center justify-center">
              <Activity size={16} className="text-primary" />
            </span>
            현재 분석 중인 요소
          </p>

          <span className="flex items-center gap-1 text-tag text-ink-muted">
            <RefreshCcw size={12} />
            분석 요소 업데이트 중
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-caption">
          {ANALYZING_TAGS.map((tag, i) => {
            const isActive = i === activeTagIndex;

            return (
              <span key={tag} className="flex items-center gap-2">
                {i > 0 && <span className="text-ink-light">·</span>}

                <span
                  className={`flex items-center gap-1 transition-colors ${
                    isActive
                      ? "font-semibold text-primary"
                      : "font-normal text-ink-muted"
                  }`}
                >
                  {isActive && (
                    <span
                      className="animate-pulse rounded-full bg-primary"
                      style={{ width: "6px", height: "6px" }}
                    />
                  )}

                  {tag}
                </span>
              </span>
            );
          })}
        </div>
      </div> */}

      {/* <span className="mt-6 flex items-center justify-center gap-1.5 text-[10px] min-[376px]:text-caption leading-[1.6] text-ink-muted">
        <ShieldCheck size={14} className="text-ink-muted mb-0.5" />
        분석 중 입력하신 정보는 안전하게 보호되며, 제3자에게 제공되지 않습니다.
      </span> */}
    </div>
  );
}
