"use client";

import { useRef, useState, useEffect } from "react";

const NAMES = [
  {
    id: "01",
    name: "서우",
    emoji: "💜",
    desc: "한결같이 맑고\n바른 아이",
    tags: ["#맑은한", "#단정한", "#빛은"],
  },
  {
    id: "02",
    name: "하린",
    emoji: "⭐",
    desc: "하늘처럼 맑고\n따뜻한 마음을 가진 아이",
    tags: ["#부드러운", "#따뜻한", "#밝은"],
  },
  {
    id: "03",
    name: "유안",
    emoji: "🌙",
    desc: "편안하고\n언제나 사랑받는 아이",
    tags: ["#편안한", "#사랑스러운", "#포근한"],
  },
];

const CARD_WIDTH = 240;
const PEEK_PADDING = 75; // px-[75px] → each side card peeks ~63px

export default function NameCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(1);
  const programmaticScroll = useRef(false);

  const scrollToCard = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-card]");
    const card = cards[index];
    if (!card) return;
    setActiveIndex(index);
    programmaticScroll.current = true;
    el.scrollTo({
      left: card.offsetLeft - (el.offsetWidth - CARD_WIDTH) / 2,
      behavior: "smooth",
    });
    setTimeout(() => {
      programmaticScroll.current = false;
    }, 400);
  };

  // Mount: start centered on card 1
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-card]");
    const card = cards[1];
    if (card) {
      el.scrollLeft = card.offsetLeft - (el.offsetWidth - CARD_WIDTH) / 2;
    }
  }, []);

  // Track active card on manual swipe
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (programmaticScroll.current) return;
      const center = el.scrollLeft + el.offsetWidth / 2;
      let closest = 0;
      let minDist = Infinity;
      el.querySelectorAll<HTMLElement>("[data-card]").forEach((card, i) => {
        const dist = Math.abs(card.offsetLeft + CARD_WIDTH / 2 - center);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="pt-8 pb-6">
      <h2 className="text-center text-[16px] font-semibold text-[#2D2540] mb-6 tracking-[-0.2px]">
        어떤 이름은 어때요?{" "}
        <span className="text-[#7C6FCD]">✦</span>
      </h2>

      {/* Carousel wrapper — buttons sit outside scroll area */}
      <div className="relative">
        {/* Left button */}
        <button
          onClick={() => scrollToCard(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center disabled:opacity-30 transition-opacity"
          style={{ boxShadow: "0px 2px 10px rgba(124,111,205,0.20)" }}
          aria-label="이전 이름"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="#7C6FCD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Scroll track */}
        <div
          ref={scrollRef}
          className="flex overflow-x-scroll"
          style={{
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch" as never,
            gap: "12px",
            paddingInline: `${PEEK_PADDING}px`,
            scrollPaddingInline: `${PEEK_PADDING}px`,
          }}
        >
          {NAMES.map((item, i) => {
            const active = i === activeIndex;
            return (
              <div
                key={item.id}
                data-card
                className="flex-none bg-white transition-all duration-300"
                style={{
                  width: `${CARD_WIDTH}px`,
                  minHeight: "210px",
                  scrollSnapAlign: "center",
                  borderRadius: active ? "22px" : "18px",
                  padding: active ? "22px 18px 20px" : "18px 14px 16px",
                  transform: active ? "scale(1)" : "scale(0.88)",
                  opacity: active ? 1 : 0.7,
                  boxShadow: active
                    ? "0px 8px 32px rgba(124,111,205,0.18)"
                    : "0px 2px 12px rgba(124,111,205,0.08)",
                }}
              >
                {/* Index */}
                <span className="block text-[12px] font-medium text-[#8B849E] tracking-[0px]">
                  {item.id}
                </span>

                {/* Name + emoji */}
                <div className="mt-2 flex items-end gap-1">
                  <span
                    className="font-bold text-[#2D2540] leading-[1.2] transition-all duration-300"
                    style={{
                      fontSize: active ? "36px" : "26px",
                      letterSpacing: active ? "-0.5px" : "-0.3px",
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    className="mb-1 transition-all duration-300"
                    style={{ fontSize: active ? "22px" : "16px" }}
                  >
                    {item.emoji}
                  </span>
                </div>

                {/* Description */}
                <p
                  className="mt-3 text-[#8B849E] leading-[1.6] whitespace-pre-line"
                  style={{ fontSize: active ? "14px" : "12px" }}
                >
                  {item.desc}
                </p>

                {/* Hashtags */}
                <div className="mt-4 flex gap-[6px] flex-wrap">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[12px] transition-all duration-300"
                      style={{
                        color: active ? "#7C6FCD" : "#8B849E",
                        fontWeight: active ? 600 : 500,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right button */}
        <button
          onClick={() => scrollToCard(Math.min(NAMES.length - 1, activeIndex + 1))}
          disabled={activeIndex === NAMES.length - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white flex items-center justify-center disabled:opacity-30 transition-opacity"
          style={{ boxShadow: "0px 2px 10px rgba(124,111,205,0.20)" }}
          aria-label="다음 이름"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#7C6FCD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center items-center gap-2 mt-5">
        {NAMES.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? "18px" : "6px",
              height: "6px",
              backgroundColor: i === activeIndex ? "#7C6FCD" : "#C4BEDB",
            }}
            aria-label={`${i + 1}번 카드`}
          />
        ))}
      </div>
    </section>
  );
}
