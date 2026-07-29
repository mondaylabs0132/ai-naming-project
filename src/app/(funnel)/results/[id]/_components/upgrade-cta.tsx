"use client";

import Link from "next/link";
import { Crown, Heart, Mail, Share2 } from "lucide-react";

// title의 줄바꿈(\n)은 3분할 카드에서 줄이 갈리는 위치를 고정하기 위한 것.
// 렌더링 쪽에서 whitespace-pre-line으로 살린다.
const STATS = [
  {
    badge: "+19",
    title: "19개 이름\n추가 확인",
    desc: "현재 1개를 포함해 총 20개의 이름을 확인할 수 있어요.",
  },
  {
    icon: <Mail size={22} className="text-primary" />,
    title: "이름 20개\n메일 발송",
    desc: "무료 결과는 24시간 뒤 사라지지만 메일은 남아요.",
  },
  {
    icon: <Heart size={22} className="text-primary" />,
    title: "하트로 골라\n모으기",
    desc: "마음이 가는 이름만 추려 따로 볼 수 있어요.",
  },
];

export default function UpgradeCta({ resultId }: { resultId: string }) {
  const handleShare = async () => {
    const shareData = {
      title: "이름담다",
      text: "우리 아이에게 어울리는 이름을 찾았어요!",
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // 사용자가 공유를 취소한 경우 무시
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  return (
    <div className="mx-5 mt-2 bg-primary-pale rounded-xl p-5">
      <p className="flex items-center gap-1.5 font-bold text-ink text-section-title">
        <Crown size={18} className="text-primary" />더 많은 이름을 보고 싶다면?
      </p>
      <p className="mt-1 text-ink-muted text-caption">
        프리미엄으로 더 많은 혜택을 누려보세요!
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
        className="mt-2 w-full flex items-center justify-center gap-1.5 min-[376px]:gap-2 bg-surface border border-primary text-primary font-semibold text-caption min-[376px]:text-btn rounded-pill py-3.5"
      >
        <Share2 className="size-4 min-[376px]:size-4.5" />
        결과 공유하기 (무료)
      </button>

      <p className="mt-3 text-center text-ink-muted text-nav min-[376px]:text-caption">
        공유 후에도 결제 전에 이름 확인은 제한될 수 있어요.
      </p>
    </div>
  );
}
