"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ChevronRight,
  Gift,
  Heart,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  StarHalf,
  Users,
} from "lucide-react";

const nameList = [
  {
    rank: 1,
    name: "하온",
    hanja: "河溫",
    stars: 5,
    label: "추천도 매우 높음",
    desc: "따뜻한 햇살처럼 밝고 온화한 아이",
    tags: ["부드러운 발음", "밝은 이미지", "사주 조화 우수", "흔하지 않음"],
  },
  {
    rank: 2,
    name: "지안",
    hanja: "知安",
    stars: 5,
    label: "추천도 매우 높음",
    desc: "지혜롭고 편안한 삶을 사는 아이",
    tags: ["지혜로운 의미", "편안한 발음", "사주 조화 우수", "긍정적인 기운"],
  },
  {
    rank: 3,
    name: "서윤",
    hanja: "書潤",
    stars: 5,
    label: "추천도 매우 높음",
    desc: "글처럼 바르고, 은택하게 자라는 아이",
    tags: ["바른 성품", "부드러운 발음", "사주 조화 우수", "고급스러운 느낌"],
  },
  {
    rank: 4,
    name: "예준",
    hanja: "禮俊",
    stars: 5,
    label: "추천도 매우 높음",
    desc: "예의 바르고 뛰어난 아이",
    tags: ["예의와 품격", "세련된 발음", "사주 조화 우수", "균형 잡힌 기운"],
  },
  {
    rank: 5,
    name: "도현",
    hanja: "道賢",
    stars: 4.5,
    label: "추천도 매우 높음",
    desc: "바른 길을 가는 현명한 아이",
    tags: ["바른 길", "현명한 의미", "사주 조화 우수", "미래지향적"],
  },
  {
    rank: 6,
    name: "유진",
    hanja: "侑珍",
    stars: 4.5,
    label: "추천도 높음",
    desc: "귀하고 빛나는 보배 같은 아이",
    tags: ["귀한 의미", "밝은 발음", "사주 조화 우수"],
  },
  {
    rank: 7,
    name: "시우",
    hanja: "時雨",
    stars: 4,
    label: "추천도 높음",
    desc: "때를 알고 자연스럽게 성장하는 아이",
    tags: ["자연스러운 의미", "청명한 발음", "독창적인 느낌"],
  },
  {
    rank: 8,
    name: "이안",
    hanja: "怡安",
    stars: 4,
    label: "추천도 높음",
    desc: "기쁨과 평안함을 가득 담은 아이",
    tags: ["기쁨의 의미", "편안한 발음", "사주 조화 우수"],
  },
  {
    rank: 9,
    name: "준서",
    hanja: "俊瑞",
    stars: 3.5,
    label: "추천도 보통",
    desc: "준수하고 상서로운 기운을 지닌 아이",
    tags: ["상서로운 의미", "힘찬 발음", "강한 기운"],
  },
  {
    rank: 10,
    name: "나율",
    hanja: "那律",
    stars: 3.5,
    label: "추천도 보통",
    desc: "리듬감 있고 아름다운 삶을 사는 아이",
    tags: ["아름다운 의미", "리드미컬한 발음", "독창적"],
  },
];

function StarRating({ stars }: { stars: number }) {
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={13} fill="#FFBA00" stroke="none" />
      ))}
      {half && <StarHalf size={13} fill="#FFBA00" stroke="none" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={13} fill="none" stroke="#FFBA00" />
      ))}
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  const isGreen = label === "사주 조화 우수";
  const isYellow = label.includes("발음") || label.includes("기운");
  if (isGreen) {
    return (
      <span className="px-2 py-[3px] text-[11px] font-medium rounded-full bg-[#E8F5E9] text-[#2E7D32]">
        {label}
      </span>
    );
  }
  if (isYellow) {
    return (
      <span className="px-2 py-[3px] text-[11px] font-medium rounded-full bg-[#FFF8E1] text-[#F57F17]">
        {label}
      </span>
    );
  }
  return (
    <span className="px-2 py-[3px] text-[11px] font-medium rounded-full bg-[var(--color-primary-pale)] text-[var(--color-primary)]">
      {label}
    </span>
  );
}

const STATS = [
  {
    icon: <Gift size={16} />,
    label: "분석 이름",
    value: "20개",
    desc: "전문가 + AI 정밀 분석",
  },
  {
    icon: <ShieldCheck size={16} />,
    label: "보관 기간",
    value: "평생",
    desc: "언제든 다시 확인 가능",
  },
  {
    icon: <Users size={16} />,
    label: "공유 가능",
    value: "부부와 공유",
    desc: "함께 선택하고 결정하세요",
  },
];

export default function ResultPageView() {
  const [activeSort, setActiveSort] = useState<"추천도" | "가나다">("추천도");

  return (
    <div className="pb-[90px] px-5">
      {/* ── 커스텀 상단 바 ── */}
      <div className="flex items-center justify-between py-3 mb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/logo.png"
          alt="이름담다 로고"
          style={{ width: "90px", height: "auto" }}
        />
        <button
          className="flex items-center gap-[5px] font-medium border border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-[6px]"
          style={{ fontSize: "12px", borderRadius: "var(--radius-pill)" }}
        >
          <Users size={13} />
          부부와 공유
        </button>
      </div>

      {/* ── 히어로 카드 ── */}
      <div className="relative mt-5 mb-4">
        <div
          className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          {/* 상단 콘텐츠 — 텍스트 좌, 이미지 우 */}
          <div className="p-5 flex items-center gap-3">
            <div className="flex-1">
              <span
                className="inline-block font-semibold text-[var(--color-primary)] mb-2"
                style={{ fontSize: "13px" }}
              >
                정밀 분석 완료! 🎉
              </span>
              <h1
                className="font-extrabold text-[var(--color-ink)] leading-[1.3] mb-3"
                style={{
                  fontSize: "clamp(22px, 6vw, 28px)",
                  letterSpacing: "-0.5px",
                }}
              >
                정성껏 분석한
                <br />
                <span className="text-[var(--color-primary)]">
                  20개의 이름을
                </span>
                <br />
                확인해보세요
              </h1>
              <p
                className="text-[var(--color-ink-muted)] leading-[1.6]"
                style={{ fontSize: "13px" }}
              >
                AI와 전문가가 사주, 음양, 발음, 의미까지
                <br />
                꼼꼼하게 분석하여 엄선한 이름입니다.
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/assets/premium/premium_star.png"
                alt="별"
                width={120}
                height={120}
              />
            </div>
          </div>

          {/* 하단 스탯 행 */}
          <div className="border-t border-[var(--color-divider)] flex divide-x divide-[var(--color-divider)]">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex-1 flex flex-col items-center gap-[6px] py-3 px-2"
              >
                <div
                  className="flex items-center justify-center rounded-full bg-[var(--color-primary-pale)]"
                  style={{ width: "28px", height: "28px" }}
                >
                  <span className="text-[var(--color-primary)]">{s.icon}</span>
                </div>
                <span
                  className="text-[var(--color-ink-muted)]"
                  style={{ fontSize: "10px" }}
                >
                  {s.label}
                </span>
                <span
                  className="font-bold text-[var(--color-ink)]"
                  style={{ fontSize: "13px" }}
                >
                  {s.value}
                </span>
                <span
                  className="text-[var(--color-ink-muted)] text-center leading-[1.4]"
                  style={{ fontSize: "10px" }}
                >
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 정렬 탭 + 필터 ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {(["추천도", "가나다"] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setActiveSort(sort)}
              className="px-3 py-[6px] font-medium transition-colors"
              style={{
                fontSize: "13px",
                borderRadius: "var(--radius-pill)",
                backgroundColor:
                  activeSort === sort ? "var(--color-primary)" : "transparent",
                color: activeSort === sort ? "#fff" : "var(--color-ink-muted)",
                border:
                  activeSort === sort
                    ? "none"
                    : "1px solid var(--color-divider)",
              }}
            >
              {sort === "추천도" ? "추천도 순" : "이름 가나다 순"}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-1 border border-[var(--color-divider)] px-3 py-[6px] text-[var(--color-ink-muted)]"
          style={{ fontSize: "13px", borderRadius: "var(--radius-pill)" }}
        >
          <SlidersHorizontal size={15} />
          필터
        </button>
      </div>

      {/* ── 이름 카드 리스트 ── */}
      <div className="flex flex-col gap-3">
        {nameList.map((item) => (
          <div
            key={item.rank}
            className="bg-[var(--color-surface)] border border-[var(--color-primary-pale)] p-4"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <div className="flex items-stretch gap-3">
              {/* 순위 뱃지 */}
              <div
                className="flex items-start justify-center rounded-full bg-[var(--color-primary-pale)] shrink-0 mt-[2px]"
                style={{ width: "32px", height: "32px" }}
              >
                <span
                  className="font-bold text-[var(--color-primary)] mt-[7px]"
                  style={{ fontSize: "13px" }}
                >
                  {item.rank}
                </span>
              </div>

              {/* 좌측 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-[3px]">
                  <span
                    className="font-extrabold text-[var(--color-ink)]"
                    style={{ fontSize: "20px", letterSpacing: "-0.3px" }}
                  >
                    {item.name}
                  </span>
                  <span
                    className="text-[var(--color-ink-muted)]"
                    style={{ fontSize: "13px" }}
                  >
                    {item.hanja}
                  </span>
                </div>
                <div className="flex items-center gap-[6px] mb-[6px]">
                  <StarRating stars={item.stars} />
                  <span
                    className="text-[var(--color-ink-muted)]"
                    style={{ fontSize: "11px" }}
                  >
                    {item.label}
                  </span>
                </div>
                <p
                  className="text-[var(--color-ink-muted)] mb-2 leading-[1.5]"
                  style={{ fontSize: "12px" }}
                >
                  {item.desc}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <TagPill key={tag} label={tag} />
                  ))}
                </div>
              </div>

              {/* 우측 고정 컬럼 */}
              <div className="flex flex-col items-center justify-between shrink-0 w-16 pl-2">
                <button className="flex flex-col items-center gap-1 text-[var(--color-primary)] min-h-[44px] justify-center">
                  <Heart size={22} />
                  <span className="font-medium" style={{ fontSize: "11px" }}>
                    저장
                  </span>
                </button>
                <button className="flex items-center gap-[2px] text-[var(--color-primary)] min-h-[44px] items-end justify-center pb-1">
                  <span
                    className="font-medium"
                    style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                  >
                    자세히
                  </span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
