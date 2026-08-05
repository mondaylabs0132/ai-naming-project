"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Heart, Info, Share2, Star, Volume2 } from "lucide-react";

import type { NameDetailData } from "@/lib/result/name-detail";
import { ohangKey, ohangLabel, scoreToLabel, scoreToStars } from "@/lib/result/score";

/* ── 오행 관계도 SVG (상생/상극 포함) ── */
const OHENG_NODES = [
  { key: "목", label: "목(木)", color: "#4CAF50", x: 100, y: 30 },
  { key: "화", label: "화(火)", color: "#EF5B5B", x: 166, y: 76 },
  { key: "토", label: "토(土)", color: "#FFC107", x: 143, y: 155 },
  { key: "금", label: "금(金)", color: "#9E9E9E", x: 57, y: 155 },
  { key: "수", label: "수(水)", color: "#5B8DEF", x: 34, y: 76 },
];

const NODE_MAP = Object.fromEntries(OHENG_NODES.map((n) => [n.key, n]));

// 오행 한자 → 관계도 노드 색상. 발음오행 뱃지에서도 같은 색을 쓴다.
const OHANG_COLOR: Record<string, string> = {
  木: "#4CAF50",
  火: "#EF5B5B",
  土: "#FFC107",
  金: "#9E9E9E",
  水: "#5B8DEF",
};

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

/* ── 별점 (0.5 단위) ── */
function StarRating({ stars }: { stars: number }) {
  const row = (fill: string) => (
    <div className="flex gap-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={11} fill={fill} color={fill} className="shrink-0" />
      ))}
    </div>
  );

  return (
    <div className="relative inline-flex" aria-label={`5점 만점에 ${stars}점`}>
      {row("#E4E1F0")}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${(stars / 5) * 100}%` }}
        aria-hidden="true"
      >
        {row("#FFBA00")}
      </div>
    </div>
  );
}

/* ── 카드 껍데기 ── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5"
      style={{ borderRadius: "var(--radius-xl)" }}
    >
      {children}
    </div>
  );
}

function CardTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <>
      <h2
        className="font-bold text-[var(--color-ink)]"
        style={{ fontSize: "16px", marginBottom: desc ? "2px" : "16px" }}
      >
        {title}
      </h2>
      {desc && (
        <p className="text-[var(--color-ink-muted)] mb-4" style={{ fontSize: "12px" }}>
          {desc}
        </p>
      )}
    </>
  );
}

// 사격 길흉 표기
const LUCK_STYLE = {
  good: { text: "吉", color: "#388E3C", bg: "#E8F5E9" },
  mixed: { text: "中", color: "#B08900", bg: "#FFF8E1" },
  bad: { text: "凶", color: "#C62828", bg: "#FFEBEE" },
} as const;

export default function ResultDetailView({ detail }: { detail: NameDetailData }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const stars = scoreToStars(detail.score);
  const label = scoreToLabel(detail.score);

  // 이름의 두 글자 오행 — 관계도에서 강조할 노드
  const activeOhang = [ohangKey(detail.ohang1), ohangKey(detail.ohang2)].filter(Boolean);
  const elementsText = [ohangLabel(detail.ohang1), ohangLabel(detail.ohang2)]
    .filter(Boolean)
    .join(" + ");

  // 발음오행: 성을 포함한 전체 이름 글자와 오행 목록이 같은 순서로 대응한다.
  const soundChars = [...detail.fullHangul];

  const hanjaItems = [
    {
      char: detail.hanja1,
      reading: detail.hangul1,
      meanings: detail.meanings1,
      ohang: detail.ohang1,
    },
    {
      char: detail.hanja2,
      reading: detail.hangul2,
      meanings: detail.meanings2,
      ohang: detail.ohang2,
    },
  ].filter((h) => h.char);

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
          aria-label="뒤로 가기"
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
        {/* ── A. 히어로 카드 ── */}
        <div
          className="relative bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5"
          style={{ borderRadius: "var(--radius-xl)" }}
        >
          <div className="flex gap-2 items-stretch">
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
                  {detail.rank}
                </span>
              </div>

              {/* 이름 + 한자 */}
              <div className="flex items-baseline gap-1 mb-1 flex-wrap">
                <span
                  className="font-extrabold text-[var(--color-ink)]"
                  style={{ fontSize: "28px", lineHeight: 1.1 }}
                >
                  {detail.fullHangul}
                </span>
                <span className="text-[var(--color-ink-muted)]" style={{ fontSize: "12px" }}>
                  ({detail.fullHanja})
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
                {label}
              </span>

              {/* 한줄 요약 */}
              <p
                className="text-[var(--color-ink-muted)] mb-1 leading-[1.4]"
                style={{ fontSize: "11px" }}
              >
                {detail.summary}
              </p>

              {/* 획수/오행 */}
              <p className="text-[var(--color-ink-muted)] mb-1" style={{ fontSize: "10px" }}>
                {detail.totalStrokes}획{elementsText && ` | ${elementsText}`}
              </p>

              {/* 해시태그 */}
              <div className="flex flex-wrap gap-1">
                {detail.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[var(--color-ink-muted)]"
                    style={{ fontSize: "10px" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center shrink-0">
              <Image src="/assets/premium/glass_star.png" alt="" width={110} height={110} />
            </div>

            {/* 종합 점수 */}
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
                {detail.score}점
              </span>
              <StarRating stars={stars} />
              <span
                className="font-bold text-[var(--color-primary)]"
                style={{ fontSize: "12px" }}
              >
                {detail.totalCount}개 중 {detail.rank}위
              </span>
            </div>
          </div>
        </div>

        {/* ── B. 이 이름에 담긴 뜻 (AI 카테고리 3장) ── */}
        {detail.categories.length > 0 && (
          <Card>
            <CardTitle title="이 이름에 담긴 뜻" />
            <div className="flex flex-col gap-2">
              {detail.categories.map((c) => (
                <div
                  key={c.title}
                  className="px-3 py-3"
                  style={{
                    background: "var(--color-surface-section)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <p
                    className="font-semibold text-[var(--color-ink)] mb-1"
                    style={{ fontSize: "13px" }}
                  >
                    {c.title}
                  </p>
                  <p
                    className="text-[var(--color-ink-muted)] leading-[1.6]"
                    style={{ fontSize: "12px" }}
                  >
                    {c.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── C. 한자 풀이 ── */}
        {hanjaItems.length > 0 && (
          <Card>
            <CardTitle title="이름 의미와 유래" />
            <div className="flex flex-col divide-y divide-[var(--color-divider)]">
              {hanjaItems.map((h) => (
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
                    <p
                      className="font-semibold text-[var(--color-ink)] mb-1"
                      style={{ fontSize: "14px" }}
                    >
                      {h.meanings[0] ?? h.reading}
                    </p>
                    {/* 한자 사전에 등재된 나머지 훈(訓)까지 모두 보여준다 */}
                    <div className="flex flex-wrap gap-1">
                      {h.meanings.slice(1).map((m) => (
                        <span
                          key={m}
                          className="text-[var(--color-ink-muted)] px-2 py-[2px]"
                          style={{
                            fontSize: "11px",
                            background: "var(--color-surface-section)",
                            borderRadius: "var(--radius-pill)",
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                    {h.ohang && (
                      <p
                        className="text-[var(--color-ink-muted)] mt-2"
                        style={{ fontSize: "11px" }}
                      >
                        오행 {ohangLabel(h.ohang)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── D+E. 사주 궁합 & 오행 조합 ── */}
        {(detail.sajuSummary || detail.ohangSummary) && (
          <Card>
            <CardTitle title="사주와 오행 분석" desc="타고난 기운과 이름이 어떻게 어울리는지" />
            <div className="flex gap-3 items-start">
              <div className="shrink-0">
                <OhengDiagram active={activeOhang} />
              </div>
              <div className="flex-1 min-w-0">
                {elementsText && (
                  <p
                    className="font-bold text-[var(--color-primary)] mb-1"
                    style={{ fontSize: "14px" }}
                  >
                    {elementsText}
                  </p>
                )}
                {detail.ohangSummary && (
                  <p
                    className="text-[var(--color-ink-muted)] leading-[1.6] mb-3"
                    style={{ fontSize: "12px" }}
                  >
                    {detail.ohangSummary}
                  </p>
                )}
                {detail.sajuSummary && (
                  <div
                    className="flex gap-2 items-start px-3 py-3"
                    style={{
                      background: "var(--color-primary-pale)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <Info
                      size={14}
                      className="text-[var(--color-primary)] shrink-0 mt-[1px]"
                    />
                    <p
                      className="text-[var(--color-ink-muted)] leading-[1.6]"
                      style={{ fontSize: "12px" }}
                    >
                      {detail.sajuSummary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* ── F. 발음 오행 ── */}
        {detail.soundOhangList.length > 0 && (
          <Card>
            <CardTitle
              title="발음 오행"
              desc="이름을 소리 내어 불렀을 때 기운의 흐름"
            />
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {soundChars.map((char, i) => {
                const ohang = detail.soundOhangList[i];
                const color = OHANG_COLOR[ohang] ?? "#9E9E9E";
                return (
                  <div key={`${char}-${i}`} className="flex items-center gap-1">
                    {i > 0 && (
                      <span
                        className="text-[var(--color-ink-muted)]"
                        style={{ fontSize: "12px" }}
                      >
                        →
                      </span>
                    )}
                    <div
                      className="flex flex-col items-center justify-center w-11 h-11 rounded-full"
                      style={{ background: `${color}26`, border: `1.5px solid ${color}` }}
                    >
                      <span
                        className="font-bold text-[var(--color-ink)]"
                        style={{ fontSize: "15px", lineHeight: 1.1 }}
                      >
                        {char}
                      </span>
                      <span style={{ fontSize: "9px", color }}>{ohang ?? "?"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-1">
              {detail.soundDetails.map((line, i) => (
                <p
                  key={`${line}-${i}`}
                  className="text-[var(--color-ink-muted)]"
                  style={{ fontSize: "12px" }}
                >
                  {line}
                </p>
              ))}
            </div>
          </Card>
        )}

        {/* ── G. 수리(획수) 분석 ── */}
        {detail.grids.length > 0 && (
          <Card>
            <CardTitle title="수리 분석" desc="이름의 획수가 만드는 다섯 가지 격" />
            <div className="flex flex-col gap-2">
              {detail.grids.map((g) => {
                const style = LUCK_STYLE[g.luck] ?? LUCK_STYLE.mixed;
                return (
                  <div
                    key={g.label}
                    className="flex items-center gap-2 px-3 py-[10px]"
                    style={{
                      background: "var(--color-surface-section)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <span
                      className="font-semibold text-[var(--color-ink)] shrink-0"
                      style={{ fontSize: "13px", minWidth: "58px" }}
                    >
                      {g.label}
                    </span>
                    <span
                      className="text-[var(--color-ink-muted)] shrink-0"
                      style={{ fontSize: "12px", minWidth: "38px" }}
                    >
                      {g.stroke}획
                    </span>
                    <span
                      className="flex-1 text-[var(--color-ink-muted)]"
                      style={{ fontSize: "12px" }}
                    >
                      {g.description}
                    </span>
                    <span
                      className="shrink-0 font-semibold px-2 py-[2px]"
                      style={{
                        fontSize: "11px",
                        borderRadius: "var(--radius-pill)",
                        background: style.bg,
                        color: style.color,
                      }}
                    >
                      {style.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ── H. 상세 해설 ── */}
        {detail.detailBody && (
          <Card>
            <CardTitle title="이름 이야기" />
            <p
              className="text-[var(--color-ink-muted)] leading-[1.8] whitespace-pre-line"
              style={{
                fontSize: "13px",
                display: expanded ? undefined : "-webkit-box",
                WebkitLineClamp: expanded ? undefined : 8,
                WebkitBoxOrient: expanded ? undefined : "vertical",
                overflow: expanded ? undefined : "hidden",
              }}
            >
              {detail.detailBody}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 font-semibold text-[var(--color-primary)]"
              style={{ fontSize: "13px" }}
            >
              {expanded ? "접기" : "더 보기"}
            </button>
          </Card>
        )}
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
