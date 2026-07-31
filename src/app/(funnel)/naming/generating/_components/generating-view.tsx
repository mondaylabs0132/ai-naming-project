"use client";

import { Siren } from "lucide-react";
import Image from "next/image";

import { DONE_LABEL, progressAt, stageStateAt } from "../_lib/stages";

const TIPS = [
  "분석 시간은 평균 40~60초 정도 소요돼요.",
  "더 정확한 결과를 위해 데이터를 꼼꼼히 분석하고 있어요.",
  "잠시만 기다려주시면, 아이에게 꼭 맞는 이름을 추천해드릴게요.",
];

/**
 * 무료 생성 로딩 화면의 프레젠테이션 컴포넌트.
 *
 * 경과 시간만 주입받아 화면을 그리므로, 실제 생성 화면과 미리보기 화면이
 * 같은 UI를 공유할 수 있다. (fetch·라우팅은 generating-client가 담당)
 */
export default function GeneratingView({
  elapsedSec,
  isDone = false,
}: {
  elapsedSec: number;
  /** 생성이 끝나 결과 페이지로 이동하기 직전 상태 — 게이지를 100%까지 채운다 */
  isDone?: boolean;
}) {
  const stage = stageStateAt(elapsedSec);
  const { step, total, isOverrun } = stage;
  const label = isDone ? DONE_LABEL : stage.label;
  const progress = isDone ? 100 : progressAt(elapsedSec);

  return (
    <div className="px-5 py-6 text-center">
      <div className="flex items-center justify-center gap-1">
        <p className="text-caption font-semibold text-primary">
          정확하고 깊이 있는 분석을 위해
        </p>
        <Image
          src="/assets/sparkle_two.png"
          alt=""
          aria-hidden="true"
          width={461}
          height={514}
          className="w-3 h-auto pb-1 object-contain"
        />
      </div>
      <h1 className="mt-2 text-page-title font-extrabold text-ink leading-[1.35] tracking-[-0.4px]">
        AI가 이름을{" "}
        <span className="relative inline-block text-primary">
          분석하고 있어요
          <svg
            className="absolute left-0 -bottom-1 w-full text-primary-muted"
            height="8"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M2 7 Q50 2 98 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h1>
      <p className="mt-3 text-ink-muted leading-[1.7]">
        입력하신 정보를 바탕으로
        <br />
        사주, 오행, 음양, 수리, 음운, 의미까지 종합 분석 중이에요.
      </p>

      {/* 일러스트 영역 — 배경(별 캐릭터)은 고정, 카드 에셋만 부유 */}
      <div className="relative my-8">
        <Image
          src="/assets/funnel-generating-bg.png"
          alt="AI가 노트북으로 이름을 분석하는 일러스트"
          width={1409}
          height={1117}
          sizes="100vw"
          className="block h-auto w-full object-contain"
        />
        {/* 이미지 하단 경계를 페이지 배경색으로 부드럽게 연결 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[10px] bg-linear-to-b from-transparent to-bg" />
        {/* 왼쪽 도넛 그래프 카드 */}
        <Image
          src="/assets/funnel-generating-asset1.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="animate-float-soft absolute h-auto"
          style={
            {
              left: "-3.76%",
              top: "9.25%",
              width: "47.89%",
              "--float-y": "-20px",
              "--float-r": "-1.5deg",
              animationDelay: "0s",
            } as React.CSSProperties
          }
        />
        {/* 오른쪽 위 AI 배지 */}
        <Image
          src="/assets/funnel-generating-asset2.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="animate-float-soft absolute h-auto"
          style={
            {
              left: "60.73%",
              top: "4.28%",
              width: "29.38%",
              "--float-y": "-12px",
              "--float-r": "1.5deg",
              animationDelay: "-0.3s",
            } as React.CSSProperties
          }
        />
        {/* 오른쪽 막대 그래프 카드 */}
        <Image
          src="/assets/funnel-generating-asset3.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="animate-float-soft absolute h-auto"
          style={
            {
              left: "61.66%",
              top: "32.55%",
              width: "47.4%",
              "--float-y": "-18px",
              "--float-r": "-2.2deg",
              animationDelay: "-0.6s",
            } as React.CSSProperties
          }
        />
      </div>

      {/* 진행 단계 — 문구는 단방향으로만 바뀌고, 게이지는 92%에 점근 */}
      <div
        className="flex min-h-8 items-center justify-center gap-1"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* key를 문구로 두어 단계가 넘어갈 때마다 등장 애니메이션이 다시 실행됨 */}
        <p key={label} className="animate-stage-in font-semibold text-ink">
          {label}
        </p>
        <Image
          src="/assets/sparkle.png"
          alt=""
          aria-hidden="true"
          width={1024}
          height={1024}
          className="w-8 h-auto object-contain"
        />
      </div>

      <div className="mt-2">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(progress)}
          aria-label="이름 분석 진행률"
          className="h-1.5 w-full overflow-hidden rounded-pill bg-primary-pale"
        >
          {/* 완료 시 transition(300ms)은 DONE_HOLD_MS(400ms)보다 짧아야 한다.
              그래야 이동 전에 게이지가 실제로 100%까지 차는 게 보인다. */}
          <div
            className={`h-full rounded-pill bg-primary transition-[width] ${
              isDone ? "duration-300 ease-out" : "duration-200 ease-linear"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-caption text-ink-muted">
          <span>
            {isDone
              ? "결과를 보여드릴게요"
              : isOverrun
                ? "거의 다 됐어요"
                : `${step}단계 / ${total}단계`}
          </span>
          <span className="tabular-nums">{Math.floor(progress)}%</span>
        </div>
      </div>

      {/* 안내 카드 */}
      <div className="mt-6 bg-primary-pale rounded-lg shadow-card p-5 text-left">
        <p className="font-bold text-primary flex items-center gap-2 pl-0.5">
          <Siren className="w-5 h-5" />
          알려드려요
        </p>
        <ul className="mt-3 space-y-2">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-center gap-1">
              <Image
                src="/assets/check.png"
                alt=""
                aria-hidden="true"
                width={1024}
                height={1024}
                className="w-5 h-auto mt-0.5 shrink-0 object-contain self-start"
              />
              <span className="text-[clamp(12px,4vw,15px)] text-ink">
                {tip}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-[clamp(14px,3.6vw,15px)] font-semibold text-ink leading-[1.7]">
        분석 결과는 입력하신 정보 외에는 저장되지 않아요.
        <br />
        안심하고 기다려주세요 💜
      </p>
    </div>
  );
}
