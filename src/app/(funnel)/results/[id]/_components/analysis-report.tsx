"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Lightbulb } from "lucide-react";
import type { GridItem, Luck } from "../_lib/parse-grids";

const LUCK_LABEL: Record<Luck, string> = {
  good: "吉",
  bad: "凶",
  mixed: "中",
};

const LUCK_COLOR: Record<Luck, { text: string; bg: string }> = {
  good: { text: "#7C6FCD", bg: "#EAE7F8" },
  bad: { text: "#C46A6A", bg: "#F8ECEC" },
  mixed: { text: "#8B849E", bg: "#F0EEF5" },
};

// 오행별 배지 색 (파스텔 톤)
const OHANG_COLOR: Record<string, { text: string; bg: string }> = {
  木: { text: "#3E8E63", bg: "#E6F4EC" },
  火: { text: "#C25550", bg: "#FBEAE9" },
  土: { text: "#A8803A", bg: "#F7F0E2" },
  金: { text: "#6E7480", bg: "#EFF0F2" },
  水: { text: "#4A7DBF", bg: "#E7EFF8" },
};

export type AnalysisData = {
  fullHangul: string; // 성 + 이름 (섹션 타이틀용)
  // 이름 두 글자의 한자 + 오행 (오행 배지용)
  hanjaOhang: { hanja: string; ohang: string | null }[];
  sajuText: string; // 부족한 오행 보완 설명 (saju_summary[0])
  ohangText: string; // 오행 궁합 해설 (saju_summary[1])
  grids: GridItem[];
};

// 수리 결과에 따라 업셀 배너 문구를 고른다.
// DB 전수 확인 기준 luck은 good/bad/mixed 3종뿐이라 분기는 아래 4가지로 닫힌다:
// ① 凶 있음 ② 凶 없고 中 있음 ③ 모두 吉 ④ grids 자체가 비어 있음(방어) → 배너 생략
function buildUpsellBanner(grids: GridItem[]) {
  const format = (items: GridItem[], mark: string) =>
    items
      .slice(0, 2)
      .map((g) => `${g.label} ${g.stroke}획(${mark})`)
      .join("·");

  const bads = grids.filter((g) => g.luck === "bad");
  if (bads.length > 0) {
    return {
      title: `${format(bads, "凶")}이 마음에 걸리시나요?`,
      body: "프리미엄에는 다른 수리 구성의 이름 19개가 더 준비되어 있어요.",
    };
  }

  const mixeds = grids.filter((g) => g.luck === "mixed");
  if (mixeds.length > 0) {
    return {
      title: `${format(mixeds, "中")}이 조금 아쉬우신가요?`,
      body: "프리미엄에는 다른 수리 구성의 이름 19개가 더 준비되어 있어요.",
    };
  }

  if (grids.length > 0) {
    return {
      title: "수리 사격이 모두 吉인 좋은 이름이에요!",
      body: "이런 좋은 구성의 이름 19개가 더 기다리고 있어요.",
    };
  }

  return null;
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[20px] bg-white px-4 py-5"
      style={{ boxShadow: "0px 4px 16px rgba(124,111,205,0.10)" }}
    >
      <h3
        className="font-bold"
        style={{ fontSize: "15px", color: "#2D2540" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function AnalysisReport({
  data,
  resultId,
}: {
  data: AnalysisData;
  resultId: string;
}) {
  const [ohangOpen, setOhangOpen] = useState(false);
  const [gridsOpen, setGridsOpen] = useState(false);
  const banner = buildUpsellBanner(data.grids);

  const badges = data.hanjaOhang.filter((b) => b.hanja && b.ohang);
  const hasOhangCard = Boolean(data.sajuText || data.ohangText);
  const hasGridsCard = data.grids.length > 0;

  if (!hasOhangCard && !hasGridsCard) return null;

  return (
    <section className="px-5 pb-2">
      <h2
        className="font-extrabold mb-3"
        style={{ fontSize: "18px", color: "#2D2540" }}
      >
        <span style={{ color: "#7C6FCD" }}>&lsquo;{data.fullHangul}&rsquo;</span>
        는 이렇게 분석했어요
        <span className="ml-1" aria-hidden="true">
          🔍
        </span>
      </h2>

      <div className="space-y-3">
        {/* ① 사주 오행 보완 */}
        {hasOhangCard && (
          <Card title="사주 오행 보완">
            {badges.length > 0 && (
              <div className="mt-3 flex gap-2">
                {badges.map((b, i) => {
                  const color = OHANG_COLOR[b.ohang as string] ?? {
                    text: "#6B6480",
                    bg: "#F0EEF5",
                  };
                  return (
                    <span
                      key={`${b.hanja}-${i}`}
                      className="inline-flex items-center gap-[6px] rounded-full"
                      style={{
                        background: color.bg,
                        padding: "5px 12px",
                      }}
                    >
                      <span
                        className="font-bold"
                        style={{ fontSize: "15px", color: "#2D2540" }}
                      >
                        {b.hanja}
                      </span>
                      <span
                        className="font-bold"
                        style={{ fontSize: "13px", color: color.text }}
                      >
                        {b.ohang}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}

            {data.sajuText && (
              <p
                className="mt-3 leading-[1.65]"
                style={{ fontSize: "13px", color: "#2D2540" }}
              >
                {data.sajuText}
              </p>
            )}

            {data.ohangText && (
              <>
                <div
                  className="my-3"
                  style={{ borderTop: "1px solid #F0EEF5" }}
                />
                <p
                  className="leading-[1.65]"
                  style={{
                    fontSize: "13px",
                    color: "#6B6480",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: ohangOpen ? "unset" : 2,
                    overflow: "hidden",
                  }}
                >
                  {data.ohangText}
                </p>
                <button
                  type="button"
                  onClick={() => setOhangOpen((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 font-semibold"
                  style={{ fontSize: "12px", color: "#7C6FCD" }}
                >
                  {ohangOpen ? "접기" : "더보기"}
                  <ChevronDown
                    size={14}
                    style={{
                      transform: ohangOpen ? "rotate(180deg)" : undefined,
                      transition: "transform 0.2s ease",
                    }}
                  />
                </button>
              </>
            )}
          </Card>
        )}

        {/* ② 수리 사격 분석 */}
        {hasGridsCard && (
          <Card title="수리 사격 분석">
            <div className="mt-3 grid grid-cols-5 gap-1">
              {data.grids.map((g) => {
                const color = LUCK_COLOR[g.luck];
                return (
                  <div
                    key={g.label}
                    className="flex flex-col items-center rounded-[12px] py-2"
                    style={{ background: "#FAF9FD" }}
                  >
                    <span style={{ fontSize: "11px", color: "#8B849E" }}>
                      {g.label}
                    </span>
                    <span
                      className="mt-1 font-bold"
                      style={{ fontSize: "14px", color: "#2D2540" }}
                    >
                      {g.stroke}획
                    </span>
                    <span
                      className="mt-1 rounded-full font-bold"
                      style={{
                        fontSize: "11px",
                        color: color.text,
                        background: color.bg,
                        padding: "1px 8px",
                      }}
                    >
                      {LUCK_LABEL[g.luck]}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setGridsOpen((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-[12px] py-2 font-semibold"
              style={{
                fontSize: "12px",
                color: "#7C6FCD",
                background: "#F5F3FC",
              }}
            >
              {gridsOpen ? "상세 풀이 접기" : "상세 풀이 보기"}
              <ChevronDown
                size={14}
                style={{
                  transform: gridsOpen ? "rotate(180deg)" : undefined,
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {gridsOpen && (
              <ul className="mt-3 space-y-3">
                {data.grids
                  .filter((g) => g.description)
                  .map((g) => {
                    const color = LUCK_COLOR[g.luck];
                    return (
                      <li key={g.label} className="flex gap-2">
                        <span
                          className="mt-[1px] inline-flex h-fit shrink-0 items-center rounded-full font-bold"
                          style={{
                            fontSize: "11px",
                            color: color.text,
                            background: color.bg,
                            padding: "2px 8px",
                          }}
                        >
                          {g.label} {g.stroke}획 · {LUCK_LABEL[g.luck]}
                        </span>
                        <p
                          className="leading-[1.6]"
                          style={{ fontSize: "12px", color: "#6B6480" }}
                        >
                          {g.description}
                        </p>
                      </li>
                    );
                  })}
              </ul>
            )}
          </Card>
        )}

        {/* ③ 수리 결과 맞춤 업셀 배너 */}
        {banner && (
          <Link
            href={`/upgrade/${resultId}`}
            className="block rounded-[20px] px-4 py-4"
            style={{
              background:
                "linear-gradient(135deg, #EAE7F8 0%, #F5F3FC 100%)",
              border: "1.5px solid #D6D0EE",
            }}
          >
            <div className="flex items-start gap-2">
              <Lightbulb
                size={18}
                className="mt-[1px] shrink-0"
                style={{ color: "#7C6FCD" }}
              />
              <div className="min-w-0">
                <p
                  className="font-bold leading-[1.5]"
                  style={{ fontSize: "13.5px", color: "#2D2540" }}
                >
                  {banner.title}
                </p>
                <p
                  className="mt-1 leading-[1.6]"
                  style={{ fontSize: "12.5px", color: "#6B6480" }}
                >
                  {banner.body}
                </p>
                <span
                  className="mt-2 inline-flex items-center font-semibold"
                  style={{ fontSize: "12.5px", color: "#7C6FCD" }}
                >
                  이름 더 보기 →
                </span>
              </div>
            </div>
          </Link>
        )}
      </div>
    </section>
  );
}
