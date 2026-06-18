"use client";

import { useState, useRef, useEffect } from "react";

const NAMES = [
  {
    index: "01",
    name: "서우",
    desc: "한결같이 맑고\n바른 아이",
    tags: ["맑은한", "단정한", "빛은"],
  },
  {
    index: "02",
    name: "하린",
    desc: "하늘처럼 맑고\n따뜻한 마음을 가진 아이",
    tags: ["부드러운", "따뜻한", "밝은"],
  },
  {
    index: "03",
    name: "유안",
    desc: "편안하고\n언제나 사랑받는 아이",
    tags: ["편안한", "사랑스러운", "포근한"],
  },
];

// 중앙 카드 너비 비율 (컨테이너 대비)
const CARD_RATIO = 0.62;
const GAP = 12;

export default function NameCarousel() {
  const [active, setActive] = useState(1); // 중간 카드부터 시작
  const [cardWidth, setCardWidth] = useState(240);
  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const W = containerRef.current.offsetWidth;
      const cw = Math.round(W * CARD_RATIO);
      setCardWidth(cw);
      setOffset(-active * (cw + GAP) + (W - cw) / 2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [active]);

  const goTo = (i: number) =>
    setActive(((i % NAMES.length) + NAMES.length) % NAMES.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) goTo(delta > 0 ? active + 1 : active - 1);
  };

  return (
    <section className="py-8" style={{ background: "#F9F7F9" }}>
      <h2
        className="text-center font-semibold text-[#2D2540] mb-6"
        style={{ fontSize: "16px", letterSpacing: "-0.2px" }}
      >
        어떤 이름은 어때요?{" "}
        <span className="text-[#7C6FCD]">✦</span>
      </h2>

      {/* 캐러셀 + 사이드 버튼 */}
      <div className="relative flex items-center">
        {/* 이전 버튼 — 섹션 왼쪽 끝 */}
        <button
          onClick={() => goTo(active - 1)}
          className="absolute z-10 flex items-center justify-center bg-white rounded-full"
          style={{
            left: "6px",
            width: "32px",
            height: "32px",
            boxShadow: "0px 2px 10px rgba(124,111,205,0.22)",
          }}
          aria-label="이전 이름"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8l4-4"
              stroke="#7C6FCD"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 트랙 */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex"
            style={{
              transform: `translateX(${offset}px)`,
              transition: "transform 0.3s ease",
              gap: `${GAP}px`,
            }}
          >
            {NAMES.map((item, i) => {
              const isActive = i === active;
              return (
                <div
                  key={item.index}
                  className="flex-none bg-white"
                  style={{
                    width: `${cardWidth}px`,
                    minHeight: isActive ? "230px" : "200px",
                    borderRadius: isActive ? "22px" : "18px",
                    padding: isActive ? "22px 18px 20px" : "16px 14px 16px",
                    transform: `scale(${isActive ? 1 : 0.88})`,
                    transformOrigin: "center",
                    opacity: isActive ? 1 : 0.65,
                    transition:
                      "transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease",
                    boxShadow: isActive
                      ? "0px 8px 32px rgba(124,111,205,0.18)"
                      : "0px 2px 12px rgba(124,111,205,0.08)",
                  }}
                >
                  {/* 인덱스 */}
                  <span
                    className="block font-medium text-[#8B849E]"
                    style={{ fontSize: "12px" }}
                  >
                    {item.index}
                  </span>

                  {/* 이름 + 아이콘 */}
                  <div className="mt-1 flex items-end gap-1">
                    <span
                      className="font-bold text-[#2D2540] leading-[1.15]"
                      style={{
                        fontSize: isActive ? "36px" : "26px",
                        letterSpacing: "-0.5px",
                        transition: "font-size 0.3s ease",
                      }}
                    >
                      {item.name}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/star.png"
                      alt=""
                      className="mb-1"
                      style={{
                        width: isActive ? "22px" : "16px",
                        height: isActive ? "22px" : "16px",
                        objectFit: "contain",
                        transition: "width 0.3s ease, height 0.3s ease",
                      }}
                    />
                  </div>

                  {/* 설명 */}
                  <p
                    className="mt-3 text-[#2D2540] leading-[1.6] whitespace-pre-line"
                    style={{ fontSize: isActive ? "15px" : "12px" }}
                  >
                    {item.desc}
                  </p>

                  {/* 해시태그 */}
                  <div className="mt-4 flex gap-[6px] flex-wrap">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "12px",
                          color: isActive ? "#7C6FCD" : "#8B849E",
                          fontWeight: isActive ? 600 : 400,
                          transition: "color 0.3s ease",
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 다음 버튼 — 섹션 오른쪽 끝 */}
        <button
          onClick={() => goTo(active + 1)}
          className="absolute z-10 flex items-center justify-center bg-white rounded-full"
          style={{
            right: "6px",
            width: "32px",
            height: "32px",
            boxShadow: "0px 2px 10px rgba(124,111,205,0.22)",
          }}
          aria-label="다음 이름"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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

      {/* 페이지네이션 도트 */}
      <div className="flex justify-center items-center gap-2 mt-5">
        {NAMES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="rounded-full"
            style={{
              width: i === active ? "18px" : "6px",
              height: "6px",
              backgroundColor: i === active ? "#7C6FCD" : "#C4BEDB",
              transition: "width 0.3s ease, background-color 0.3s ease",
            }}
            aria-label={`${i + 1}번 카드`}
          />
        ))}
      </div>
    </section>
  );
}
