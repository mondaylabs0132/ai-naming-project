"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Heart,
  Info,
  Share2,
  Star,
  Volume2,
} from "lucide-react";

const nameDetail = {
  rank: 1,
  name: "하온",
  hanja: "河溫",
  badge: "추천도 매우 높음",
  desc: "따뜻한 햇살처럼 밝고 온화한 아이",
  strokes: "10획",
  elements: "수(水) + 화(火)",
  hashtags: ["따뜻한", "온화한", "밝은에너지", "조화로운성장"],
  score: 98,
  rank_percent: "상위 2%",
  hanja_details: [
    {
      char: "河",
      title: "강 이름, 넓고 깊은",
      tags: ["물", "흐름", "포용"],
      desc: "넓고 깊은 강처럼 포용력이 크고 끊임없이 성장하는 의미를 담고 있어요.",
    },
    {
      char: "溫",
      title: "따뜻할 온, 온화할 온",
      tags: ["따뜻함", "온화함", "사랑"],
      desc: "따뜻한 마음과 온화한 성품으로 주변을 편안하게 만드는 의미를 담고 있어요.",
    },
  ],
  oheng: [
    { name: "수(水)", color: "#5B8DEF", barColor: "#7C6FCD", traits: "지혜, 용통성, 감성", pct: 80 },
    { name: "화(火)", color: "#EF5B5B", barColor: "#EF5B5B", traits: "열정, 밝음, 따뜻함", pct: 80 },
    { name: "목(木)", color: "#4CAF50", barColor: "#4CAF50", traits: "성장, 발전, 생명력", pct: 40 },
    { name: "금(金)", color: "#9E9E9E", barColor: "#9E9E9E", traits: "결단력, 집중력, 완성", pct: 30 },
    { name: "토(土)", color: "#FFC107", barColor: "#FFC107", traits: "안정, 신뢰, 중심", pct: 40 },
  ],
  fortune_periods: [
    { age: "24세 ~ 28세", desc: "학업운·성장운·귀인운 상승", level: "최고" },
    { age: "33세 ~ 37세", desc: "커리어·재물운 상승", level: "좋음" },
    { age: "42세 ~ 46세", desc: "명예운·안정운 상승", level: "좋음" },
    { age: "51세 ~ 55세", desc: "가정운·건강운 상승", level: "좋음" },
  ],
};

/* ── 오행 관계도 SVG (상생/상극 포함) ── */
const OHENG_NODES = [
  { key: "목", label: "목(木)", color: "#4CAF50", x: 100, y: 30 },
  { key: "화", label: "화(火)", color: "#EF5B5B", x: 166, y: 76 },
  { key: "토", label: "토(土)", color: "#FFC107", x: 143, y: 155 },
  { key: "금", label: "금(金)", color: "#9E9E9E", x: 57, y: 155 },
  { key: "수", label: "수(水)", color: "#5B8DEF", x: 34, y: 76 },
];

const NODE_MAP = Object.fromEntries(OHENG_NODES.map((n) => [n.key, n]));

// 상생: 목→화→토→금→수→목
const SANGSAENG: [string, string][] = [
  ["목", "화"],
  ["화", "토"],
  ["토", "금"],
  ["금", "수"],
  ["수", "목"],
];

// 상극: 목→토, 화→금, 토→수, 금→목, 수→화
const SANGGEUK: [string, string][] = [
  ["목", "토"],
  ["화", "금"],
  ["토", "수"],
  ["금", "목"],
  ["수", "화"],
];

function OhengDiagram({ active }: { active: string[] }) {
  return (
    <svg viewBox="0 0 200 200" width={170} height={170}>
      <defs>
        {OHENG_NODES.map((n) => (
          <marker
            key={n.key}
            id={`arrow-${n.key}`}
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill={n.color} />
          </marker>
        ))}
      </defs>

      {/* 상극 점선 */}
      {SANGGEUK.map(([fromKey, toKey]) => {
        const f = NODE_MAP[fromKey];
        const t = NODE_MAP[toKey];
        const dx = t.x - f.x;
        const dy = t.y - f.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const r = 22;
        const sx = f.x + (dx / len) * r;
        const sy = f.y + (dy / len) * r;
        const ex = t.x - (dx / len) * r;
        const ey = t.y - (dy / len) * r;
        return (
          <line
            key={`sk-${fromKey}-${toKey}`}
            x1={sx} y1={sy} x2={ex} y2={ey}
            stroke="#ccc"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        );
      })}

      {/* 상생 실선 화살표 */}
      {SANGSAENG.map(([fromKey, toKey]) => {
        const f = NODE_MAP[fromKey];
        const t = NODE_MAP[toKey];
        const dx = t.x - f.x;
        const dy = t.y - f.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const r = 22;
        const sx = f.x + (dx / len) * r;
        const sy = f.y + (dy / len) * r;
        const ex = t.x - (dx / len) * (r + 4);
        const ey = t.y - (dy / len) * (r + 4);
        return (
          <line
            key={`ss-${fromKey}-${toKey}`}
            x1={sx} y1={sy} x2={ex} y2={ey}
            stroke={f.color}
            strokeWidth={1.5}
            markerEnd={`url(#arrow-${fromKey})`}
          />
        );
      })}

      {/* 꼭짓점 원 */}
      {OHENG_NODES.map((n) => {
        const isActive = active.includes(n.key);
        return (
          <g key={n.key}>
            <circle
              cx={n.x} cy={n.y} r={22}
              fill={n.color}
              fillOpacity={isActive ? 0.3 : 0.15}
              stroke={n.color}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            <text
              x={n.x} y={n.y + 4}
              textAnchor="middle"
              fontSize={8}
              fontWeight={isActive ? "700" : "500"}
              fill={isActive ? n.color : "#666"}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 대운 흐름 SVG ── */
function FortuneChart() {
  const pts: [number, number][] = [
    [20, 100],
    [80, 88],
    [140, 70],
    [200, 45],
    [260, 20],
  ];
  const polyline = pts.map((p) => p.join(",")).join(" ");

  return (
    <svg viewBox="0 0 280 120" width="100%" height={120}>
      {[20, 45, 70, 95].map((y) => (
        <line key={y} x1={10} y1={y} x2={270} y2={y} stroke="#F0EEF8" strokeWidth={1} />
      ))}
      <polyline points={polyline} fill="none" stroke="#7C6FCD" strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={4} fill="#7C6FCD" />
      ))}
      {["10대", "20대", "30대", "40대", "50대+"].map((label, i) => (
        <text key={label} x={pts[i][0]} y={118} textAnchor="middle" fontSize={8} fill="#9E9E9E">
          {label}
        </text>
      ))}
    </svg>
  );
}

export default function ResultDetailView() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const d = nameDetail;

  return (
    <div className="flex flex-col">
      {/* ── 커스텀 헤더 ── */}
      <header
        className="sticky top-0 z-10 flex items-center px-4 h-14 bg-white"
        style={{ borderBottom: "1px solid #f0eeff" }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 -ml-1 shrink-0"
        >
          <ArrowLeft size={22} className="text-[var(--color-ink)]" />
        </button>
        <span
          className="flex-1 text-center font-semibold text-[var(--color-ink)]"
          style={{ fontSize: "16px" }}
        >
          이름 상세 분석
        </span>
        <button
          className="flex items-center gap-[5px] font-medium border border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-[6px]"
          style={{ fontSize: "12px", borderRadius: "var(--radius-pill)" }}
          onClick={() => setSaved((v) => !v)}
        >
          <Heart size={13} fill={saved ? "var(--color-primary)" : "none"} />
          보관함
        </button>
      </header>

      {/* ── 페이지 콘텐츠 ── */}
      <div className="pb-36 px-4 pt-4 flex flex-col gap-4">

        {/* ── 섹션 1. 히어로 카드 ── */}
        <div
          className="relative bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5"
          style={{ borderRadius: "var(--radius-xl)" }}
        >
          <div className="flex gap-2 items-stretch">
            {/* 열 1: 텍스트 콘텐츠 (좌측) */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {/* 순위 뱃지 */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center mb-1"
                style={{ background: "var(--color-primary-pale)" }}
              >
                <span
                  className="font-bold text-[var(--color-primary)]"
                  style={{ fontSize: "11px" }}
                >
                  {d.rank}
                </span>
              </div>

              {/* 이름 + 한자 + 발음 */}
              <div className="flex items-baseline gap-1 mb-1 flex-wrap">
                <span
                  className="font-extrabold text-[var(--color-ink)]"
                  style={{ fontSize: "28px", lineHeight: 1.1 }}
                >
                  {d.name}
                </span>
                <span className="text-[var(--color-ink-muted)]" style={{ fontSize: "12px" }}>
                  ({d.hanja})
                </span>
                <Volume2 size={13} className="text-[var(--color-primary)] shrink-0" />
              </div>

              {/* 추천도 뱃지 */}
              <span
                className="self-start font-semibold text-[var(--color-primary)] px-2 py-[2px] mb-1"
                style={{
                  fontSize: "10px",
                  background: "var(--color-primary-pale)",
                  borderRadius: "var(--radius-pill)",
                }}
              >
                {d.badge}
              </span>

              {/* 설명 */}
              <p className="text-[var(--color-ink-muted)] mb-1 leading-[1.4]" style={{ fontSize: "11px" }}>
                {d.desc}
              </p>

              {/* 획수/오행 */}
              <p className="text-[var(--color-ink-muted)] mb-1" style={{ fontSize: "10px" }}>
                {d.strokes} | {d.elements}
              </p>

              {/* 해시태그 */}
              <div className="flex flex-wrap gap-1">
                {d.hashtags.map((tag) => (
                  <span key={tag} className="text-[var(--color-ink-muted)]" style={{ fontSize: "10px" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 열 2: 이미지 (가운데) */}
            <div className="flex items-center justify-center shrink-0">
              <Image
                src="/assets/premium/glass_star.png"
                alt="별"
                width={110}
                height={110}
              />
            </div>

            {/* 열 3: 종합 점수 박스 (우측 끝) */}
            <div
              className="flex flex-col items-center justify-center gap-[5px] px-2 py-3 shrink-0"
              style={{
                background: "var(--color-primary-pale)",
                borderRadius: "var(--radius-md)",
                width: "90px",
              }}
            >
              <span className="text-[var(--color-ink-muted)]" style={{ fontSize: "10px" }}>
                종합 점수
              </span>
              <span
                className="font-extrabold text-[var(--color-primary)]"
                style={{ fontSize: "22px", lineHeight: 1 }}
              >
                {d.score}점
              </span>
              <div className="flex gap-[2px]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={11} fill="#FFBA00" color="#FFBA00" />
                ))}
              </div>
              <span className="font-bold text-[var(--color-primary)]" style={{ fontSize: "12px" }}>
                {d.rank_percent}
              </span>
              <span
                className="text-[var(--color-ink-muted)] text-center leading-[1.3]"
                style={{ fontSize: "9px" }}
              >
                매우 좋은 이름이에요!
              </span>
            </div>
          </div>
        </div>

        {/* ── 섹션 2. 이름 의미와 유래 ── */}
        <div
          className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5"
          style={{ borderRadius: "var(--radius-xl)" }}
        >
          <h2
            className="font-bold text-[var(--color-ink)] mb-4"
            style={{ fontSize: "16px" }}
          >
            이름 의미와 유래
          </h2>

          <div className="flex flex-col divide-y divide-[var(--color-divider)]">
            {d.hanja_details.map((h) => (
              <div key={h.char} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <div
                  className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "var(--color-primary-pale)" }}
                >
                  <span
                    className="font-bold text-[var(--color-primary)]"
                    style={{ fontSize: "22px" }}
                  >
                    {h.char}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-ink)] mb-1" style={{ fontSize: "14px" }}>
                    {h.title}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {h.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[var(--color-ink-muted)] px-2 py-[2px]"
                        style={{
                          fontSize: "11px",
                          background: "var(--color-surface-section)",
                          borderRadius: "var(--radius-pill)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-[var(--color-ink-muted)] leading-[1.6]" style={{ fontSize: "13px" }}>
                    {h.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 섹션 3. 오행 분석 ── */}
        <div
          className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5"
          style={{ borderRadius: "var(--radius-xl)" }}
        >
          <h2
            className="font-bold text-[var(--color-ink)] mb-4"
            style={{ fontSize: "16px" }}
          >
            이름 오행 분석
          </h2>

          <div className="flex gap-3 items-start">
            <div className="shrink-0">
              <OhengDiagram active={["수", "화"]} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-bold text-[var(--color-primary)] mb-1"
                style={{ fontSize: "14px" }}
              >
                {d.elements}
              </p>
              <p
                className="text-[var(--color-ink-muted)] leading-[1.5] mb-3"
                style={{ fontSize: "12px" }}
              >
                지혜로운 물이 따뜻한 불을 만나 조화를 이루는 좋은 오행 구성이에요.
              </p>
              <div className="flex flex-col gap-2">
                {d.oheng.map((o) => (
                  <div key={o.name}>
                    <div className="flex items-center gap-1 mb-[3px]">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: o.color }}
                      />
                      <span className="text-[var(--color-ink-muted)]" style={{ fontSize: "11px" }}>
                        {o.name}
                      </span>
                      <span className="text-[var(--color-ink-muted)] ml-auto" style={{ fontSize: "10px" }}>
                        {o.pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface-section)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${o.pct}%`, background: o.barColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 섹션 4. 대운·길운 분석 ── */}
        <div
          className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5"
          style={{ borderRadius: "var(--radius-xl)" }}
        >
          <h2
            className="font-bold text-[var(--color-ink)] mb-[2px]"
            style={{ fontSize: "16px" }}
          >
            대운·길운 분석
          </h2>
          <p className="text-[var(--color-ink-muted)] mb-4" style={{ fontSize: "12px" }}>
            평생 운세의 흐름과 좋은 영향을 주는 시기
          </p>

          <div className="mb-4">
            <p className="font-semibold text-[var(--color-ink)] mb-2" style={{ fontSize: "13px" }}>
              대운 흐름
            </p>
            <FortuneChart />
            <p className="text-[var(--color-ink-muted)] mt-1" style={{ fontSize: "11px" }}>
              30대 후반부터 안정과 성장이 크게 상승하는 운세에요.
            </p>
          </div>

          <div className="mb-4">
            <p className="font-semibold text-[var(--color-ink)] mb-2" style={{ fontSize: "13px" }}>
              길운 시기
            </p>
            <div className="flex flex-col gap-2">
              {d.fortune_periods.map((fp) => (
                <div
                  key={fp.age}
                  className="flex items-center gap-2 px-3 py-[10px]"
                  style={{
                    background: "var(--color-surface-section)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <span
                    className="font-semibold text-[var(--color-ink)] shrink-0"
                    style={{ fontSize: "13px", minWidth: "88px" }}
                  >
                    {fp.age}
                  </span>
                  <span className="flex-1 text-[var(--color-ink-muted)]" style={{ fontSize: "12px" }}>
                    {fp.desc}
                  </span>
                  <span
                    className="shrink-0 font-semibold px-2 py-[2px]"
                    style={{
                      fontSize: "11px",
                      borderRadius: "var(--radius-pill)",
                      background: fp.level === "최고" ? "var(--color-primary-pale)" : "#E8F5E9",
                      color: fp.level === "최고" ? "var(--color-primary)" : "#388E3C",
                    }}
                  >
                    {fp.level}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex gap-2 items-start px-3 py-3"
            style={{ background: "var(--color-primary-pale)", borderRadius: "var(--radius-md)" }}
          >
            <Info size={14} className="text-[var(--color-primary)] shrink-0 mt-[1px]" />
            <p className="text-[var(--color-ink-muted)] leading-[1.6]" style={{ fontSize: "12px" }}>
              전반적으로 안정적인 흐름 속에서 중반 이후 큰 성취와 풍요가 기대되는 운세입니다.
            </p>
          </div>
        </div>
      </div>

      {/* ── 하단 고정 버튼 ── */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] flex gap-3 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
        style={{ background: "white", borderTop: "1px solid #f0eeff" }}
      >
        <button
          className="flex-1 h-[52px] flex items-center justify-center gap-2 font-semibold"
          style={{
            border: "1.5px solid #7C6FCD",
            color: "#7C6FCD",
            background: "white",
            borderRadius: "var(--radius-xl)",
            fontSize: "15px",
          }}
        >
          <Share2 size={16} />
          공유하기
        </button>
        <button
          className="flex-1 h-[52px] flex items-center justify-center gap-2 text-white font-semibold"
          style={{
            background: "#7C6FCD",
            borderRadius: "var(--radius-xl)",
            fontSize: "15px",
          }}
          onClick={() => setSaved((v) => !v)}
        >
          <Heart size={16} fill={saved ? "white" : "none"} />
          보관함에 담기
        </button>
      </div>
    </div>
  );
}
