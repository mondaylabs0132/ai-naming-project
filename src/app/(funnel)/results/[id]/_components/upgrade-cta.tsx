"use client";

import Link from "next/link";
import { Check, Crown, Heart, Mail, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { shareOrCopy } from "@/lib/share/share-link";

/** 복사 완료/실패 표시를 유지하는 시간 */
const COPY_FEEDBACK_MS = 1000;

type CopyState = "idle" | "copied" | "error";

// title의 줄바꿈(\n)은 3분할 카드에서 줄이 갈리는 위치를 고정하기 위한 것.
// 렌더링 쪽에서 whitespace-pre-line으로 살린다.
const STATS = [
  {
    badge: "+19",
    title: "상위 점수\n이름 공개",
    desc: "점수가 더 높은 이름까지 최대 20개를 확인할 수 있어요.",
  },
  {
    icon: <Mail size={22} className="text-primary" />,
    title: "전체 결과\n메일 발송",
    desc: "무료 결과는 24시간 뒤 사라지지만 메일은 남아요.",
  },
  {
    icon: <Heart size={22} className="text-primary" />,
    title: "하트로 골라\n모으기",
    desc: "마음이 가는 이름만 추려 따로 볼 수 있어요.",
  },
];

export default function UpgradeCta({ resultId }: { resultId: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  // 잠깐 보여주고 원래 버튼으로 되돌리기 위한 타이머.
  const resetTimerRef = useRef<number | null>(null);

  // 피드백이 떠 있는 동안 화면을 벗어나면 타이머가 남지 않도록 정리한다.
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const showCopyFeedback = (nextState: Exclude<CopyState, "idle">) => {
    setCopyState(nextState);

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopyState("idle");
    }, COPY_FEEDBACK_MS);
  };

  // 공유 동작(네이티브 시트 ↔ 링크 복사)은 유료 결과 공유와 같은 규칙이라
  // @/lib/share/share-link 한 곳에 모여 있다.
  const handleShare = async () => {
    const outcome = await shareOrCopy({
      title: "첫지음",
      text: "우리 아이에게 어울리는 이름을 찾았어요!",
      url: window.location.href,
    });

    // 네이티브 시트로 넘어간 경우엔 시트가 결과를 알려주므로 여기선 조용히 끝낸다.
    if (outcome === "shared") return;

    showCopyFeedback(outcome === "copied" ? "copied" : "error");
  };

  const isCopied = copyState === "copied";

  return (
    <div className="mx-5 mt-2 bg-primary-pale rounded-xl p-5">
      <p className="flex items-center gap-1.5 font-bold text-ink text-section-title">
        <Crown size={18} className="text-primary" />더 높은 평가를 받은 이름들이
        기다리고 있어요
      </p>
      <p className="mt-1 text-ink-muted text-caption">
        지금 이름은 추천 후보 중 하나일 뿐이에요. 오행과 수리까지 더 좋은
        이름을 확인해보세요.
      </p>

      <div className="mt-4 bg-surface rounded-lg p-4 flex items-stretch">
        {STATS.map((stat, i) => (
          <div
            key={stat.title}
            className={`flex-1 flex flex-col items-center text-center gap-2 px-2 ${
              i !== 0 ? "border-l border-divider" : ""
            }`}
          >
            {stat.badge ? (
              <span className="flex items-center justify-center rounded-full bg-primary text-white font-bold text-caption w-9 h-9">
                {stat.badge}
              </span>
            ) : (
              <span className="flex items-center justify-center rounded-full bg-primary-pale w-9 h-9">
                {stat.icon}
              </span>
            )}
            <span className="font-semibold text-ink text-caption leading-tight break-keep whitespace-pre-line">
              {stat.title}
            </span>
            <span
              className="text-ink-muted leading-relaxed break-keep"
              style={{ fontSize: "11px" }}
            >
              {stat.desc}
            </span>
          </div>
        ))}
      </div>

      <Link
        href={`/upgrade/${resultId}`}
        className="mt-5 flex items-center justify-center gap-1.5 min-[376px]:gap-2 bg-primary text-white font-bold text-caption min-[376px]:text-btn rounded-pill py-3.5 shadow-btn"
      >
        <Crown className="size-4 min-[376px]:size-4.5" />
        프리미엄 열고 모든 이름 확인하기
      </Link>

      <button
        type="button"
        onClick={handleShare}
        className={[
          "mt-2 w-full flex items-center justify-center gap-1.5 min-[376px]:gap-2 border font-semibold text-caption min-[376px]:text-btn rounded-pill py-3.5 transition-colors",
          isCopied
            ? "bg-primary-pale border-primary text-primary"
            : "bg-surface border-primary text-primary",
        ].join(" ")}
      >
        {isCopied ? (
          <Check className="size-4 min-[376px]:size-4.5" strokeWidth={3} />
        ) : (
          <Share2 className="size-4 min-[376px]:size-4.5" />
        )}
        {isCopied ? "링크를 복사했어요" : "결과 공유하기 (무료)"}
      </button>

      {/* 버튼 안의 문구가 바뀌는 건 스크린리더가 놓치기 쉬워 따로 알린다. */}
      <p aria-live="polite" className="sr-only">
        {copyState === "copied" ? "링크를 복사했어요." : ""}
        {copyState === "error" ? "링크를 복사하지 못했어요." : ""}
      </p>

      <p
        className={[
          "mt-3 text-center text-nav min-[376px]:text-caption",
          copyState === "error"
            ? "text-danger font-semibold"
            : "text-ink-muted",
        ].join(" ")}
      >
        {copyState === "error"
          ? "링크를 복사하지 못했어요. 주소창의 주소를 복사해주세요."
          : "공유 후에도 결제 전에 이름 확인은 제한될 수 있어요."}
      </p>
    </div>
  );
}
