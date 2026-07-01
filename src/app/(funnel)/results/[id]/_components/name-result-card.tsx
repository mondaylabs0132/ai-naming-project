"use client";

import { Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import ClassNames from "embla-carousel-class-names";

// 시각적 배치 순서(왼 → 가운데 → 오). 가운데(startIndex 1)가 무료 카드 "01".
const RESULT_SLOTS = ["02", "01", "03"];
const FREE_SLOT = "01";

const TOTAL = 20;

export type FreeName = {
  hangul: string;
  summary: string;
  tags: string[];
};

export default function NameResultCard({ freeName }: { freeName: FreeName }) {
  const NAME = {
    index: FREE_SLOT,
    name: freeName.hangul,
    icon: "/assets/purple_heart.png",
    highlight: "",
    desc: freeName.summary,
    // DB 태그는 "#태그" 형태 → 렌더에서 다시 # 붙이므로 접두어 제거
    tags: freeName.tags.map((tag) => tag.replace(/^#/, "")).slice(0, 5),
  };

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, align: "center", containScroll: false, startIndex: 1 },
    [ClassNames()],
  );

  const [activeIndex, setActiveIndex] = useState(1);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="py-6">
      <style>{`
        .result-slide .slide-inner {
          transform: scale(0.72);
          opacity: 0.45;
          transition: transform 0.35s ease, opacity 0.35s ease, box-shadow 0.35s ease;
          box-shadow: 0px 2px 8px rgba(124,111,205,0.06);
        }
        .result-slide.is-snapped .slide-inner {
          transform: scale(1);
          opacity: 1;
          box-shadow: 0px 8px 32px rgba(124,111,205,0.22);
        }
        .result-slide .slide-name {
          font-size: 28px;
          transition: font-size 0.35s ease;
        }
        .result-slide.is-snapped .slide-name {
          font-size: 44px;
        }
        .result-slide .slide-icon {
          width: 16px; height: 16px;
          transition: width 0.35s ease, height 0.35s ease;
        }
        .result-slide.is-snapped .slide-icon {
          width: 28px; height: 28px;
        }
        .result-slide .slide-card {
          height: 200px;
          transition: height 0.35s ease;
        }
        .result-slide.is-snapped .slide-card {
          height: 300px;
        }
        .result-slide .slide-highlight {
          display: none;
        }
        .result-slide.is-snapped .slide-highlight {
          display: block;
        }
        .result-slide .slide-desc {
          font-size: 12px;
          color: #8B849E;
          transition: font-size 0.35s ease;
        }
        .result-slide.is-snapped .slide-desc {
          font-size: 13px;
          color: #2D2540;
        }
        .result-slide .slide-index-pill {
          display: none;
        }
        .result-slide.is-snapped .slide-index-pill {
          display: inline-flex;
        }
        .result-slide .slide-index-plain {
          display: block;
        }
        .result-slide.is-snapped .slide-index-plain {
          display: none;
        }
        .result-slide .slide-heart {
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .result-slide.is-snapped .slide-heart {
          opacity: 1;
        }
        /* 태그 */
        .result-slide .slide-tag {
          color: #8B849E;
          font-weight: 400;
          font-size: 12px;
          transition: color 0.2s ease, font-weight 0.2s ease,
                      border 0.2s ease, padding 0.2s ease,
                      background 0.2s ease, border-radius 0.2s ease;
        }
        .result-slide.is-snapped .slide-tag {
          color: #7C6FCD;
          font-weight: 600;
          border: 1.5px solid #C4BEDB;
          padding: 3px 10px;
          border-radius: 9999px;
          background: #EAE7F8;
        }
      `}</style>

      <div className="relative flex items-center">
        <button
          onClick={scrollPrev}
          className="absolute left-2 z-10 flex items-center justify-center bg-white rounded-full flex-shrink-0"
          style={{
            width: "32px",
            height: "32px",
            boxShadow: "0px 2px 10px rgba(124,111,205,0.22)",
          }}
          aria-label="이전 이름"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="#7C6FCD"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          className="w-full"
          style={{
            overflowX: "clip",
            paddingLeft: "44px",
            paddingRight: "44px",
          }}
          ref={emblaRef}
        >
          <div className="flex" style={{ gap: "12px" }}>
            {RESULT_SLOTS.map((slot) => {
              const displayIndex = slot;
              const isLocked = slot !== NAME.index;
              return (
                <div
                  key={slot}
                  className="result-slide embla__slide flex-none"
                  style={{ width: "240px" }}
                >
                  <div
                    className="slide-inner relative overflow-hidden"
                    style={{
                      borderRadius: "20px",
                      background: isLocked
                        ? "linear-gradient(145deg, #7B7688 0%, #686273 48%, #514B5E 100%)"
                        : "#FFFFFF",
                      boxShadow: isLocked
                        ? "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -24px 44px rgba(31,27,39,0.26)"
                        : undefined,
                    }}
                  >
                    <div
                      className="slide-card"
                      style={{
                        padding: "20px 16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* 상단: 인덱스 pill (스포트라이트) / plain (비활성) + 하트 */}
                      <div className="w-full flex items-center justify-between mb-2">
                        {/* pill */}
                        <span
                          className="slide-index-pill items-center justify-center font-semibold text-white"
                          style={{
                            fontSize: "12px",
                            background: isLocked
                              ? "rgba(38,35,47,0.62)"
                              : "#7C6FCD",
                            borderRadius: "9999px",
                            padding: "3px 10px",
                          }}
                        >
                          {displayIndex} / {TOTAL}
                        </span>
                        {/* plain */}
                        <span
                          className="slide-index-plain"
                          style={{
                            fontSize: "12px",
                            color: isLocked ? "#E3E0EA" : "#8B849E",
                          }}
                        >
                          {displayIndex} / {TOTAL}
                        </span>
                      </div>

                      {isLocked ? (
                        <div className="flex flex-1 items-center justify-center">
                          <div
                            className="absolute left-7 right-7 top-20 h-16 rounded-full blur-md"
                            style={{ background: "rgba(255,255,255,0.22)" }}
                            aria-hidden="true"
                          />
                          <div
                            className="absolute left-9 right-9 bottom-16 h-24 rounded-[22px] blur-lg"
                            style={{ background: "rgba(255,255,255,0.13)" }}
                            aria-hidden="true"
                          />
                          <div
                            className="relative z-[1] flex h-16 w-16 items-center justify-center rounded-full"
                            style={{
                              background: "rgba(255,255,255,0.48)",
                              border: "1px solid rgba(255,255,255,0.58)",
                              boxShadow:
                                "0px 14px 32px rgba(26,23,34,0.28), inset 0 1px 0 rgba(255,255,255,0.68)",
                            }}
                            aria-label="잠긴 이름"
                            role="img"
                          >
                            <Lock size={30} color="#FFFFFF" strokeWidth={2.2} />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 이름 + 아이콘 */}
                          <div className="flex items-end justify-center gap-1 mt-1">
                            <span
                              className="slide-name font-bold leading-[1.15]"
                              style={{ letterSpacing: "0", color: "#2D2540" }}
                            >
                              {NAME.name}
                            </span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={NAME.icon}
                              alt=""
                              aria-hidden="true"
                              className="slide-icon mb-1"
                              style={{ objectFit: "contain" }}
                            />
                          </div>

                          {/* 하이라이트 (스포트라이트만) */}
                          {NAME.highlight && (
                            <p
                              className="slide-highlight mt-2 font-bold text-center"
                              style={{ fontSize: "14px", color: "#9B7CF8" }}
                            >
                              {NAME.highlight}
                            </p>
                          )}

                          {/* 설명 */}
                          <p className="slide-desc mt-2 leading-[1.6] whitespace-pre-line text-center">
                            {NAME.desc}
                          </p>

                          {/* 태그 */}
                          <div className="mt-3 flex gap-[6px] flex-wrap justify-center">
                            {NAME.tags.map((tag) => (
                              <span key={tag} className="slide-tag">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={scrollNext}
          className="absolute right-2 z-10 flex items-center justify-center bg-white rounded-full flex-shrink-0"
          style={{
            width: "32px",
            height: "32px",
            boxShadow: "0px 2px 10px rgba(124,111,205,0.22)",
          }}
          aria-label="다음 이름"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="#7C6FCD"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* 하단 안내 + dot */}
      <p
        className="text-center mt-4"
        style={{ fontSize: "13px", color: "#8B849E" }}
      >
        <span className="mr-1" style={{ fontSize: "16px" }}>
          👆
        </span>
        카드를 좌우로 밀어보세요
      </p>

      <div className="flex justify-center items-center gap-2 mt-3">
        {RESULT_SLOTS.map((slot, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`${slot}번 카드`}
          >
            <div
              style={{
                width: i === activeIndex ? "8px" : "6px",
                height: i === activeIndex ? "8px" : "6px",
                borderRadius: "50%",
                background: i === activeIndex ? "#9B7CF8" : "#D1CCE8",
                transition:
                  "width 0.3s ease, height 0.3s ease, background 0.3s ease",
              }}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
