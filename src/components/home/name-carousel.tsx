"use client";

import useEmblaCarousel from "embla-carousel-react";
import ClassNames from "embla-carousel-class-names";
import { useCallback, useEffect, useState } from "react";

const NAMES = [
  {
    index: "01",
    name: "서우",
    icon: "/purple_heart.png",
    desc: "한결같이 맑고\n바른 아이",
    tags: ["맑은", "단정한", "밝은"],
  },
  {
    index: "02",
    name: "하린",
    icon: "/gold_star.png",
    desc: "하늘처럼 맑고\n따뜻한 마음을 가진 아이",
    tags: ["부드러운", "따뜻한", "밝은"],
  },
  {
    index: "03",
    name: "유안",
    icon: "/skyblue_moon.png",
    desc: "편안하고\n언제나 사랑받는 아이",
    tags: ["편안한", "사랑스러운", "포근한"],
  },
  {
    index: "04",
    name: "지온",
    icon: "/purple_heart.png",
    desc: "지혜롭고\n온화한 빛을 가진 아이",
    tags: ["지혜로운", "온화한", "빛나는"],
  },
  {
    index: "05",
    name: "나은",
    icon: "/gold_star.png",
    desc: "날마다 더\n나아가는 아이",
    tags: ["성장하는", "희망찬", "따뜻한"],
  },
];

export default function NameCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "center",
      containScroll: false,
      startIndex: 2,
    },
    [ClassNames()],
  );

  const [activeIndex, setActiveIndex] = useState(2);

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
    <section className="py-10">
      <style>{`
        .embla__slide .slide-inner {
          transform: scale(0.78);
          opacity: 0.6;
          transition: transform 0.35s ease, opacity 0.35s ease, box-shadow 0.35s ease;
          box-shadow: 0px 2px 8px rgba(124,111,205,0.06);
        }
        .embla__slide.is-snapped .slide-inner {
          transform: scale(1.05);
          opacity: 1;
          box-shadow: 0px 8px 32px rgba(124,111,205,0.18);
        }
        .embla__slide .slide-name {
          font-size: 26px;
          transition: font-size 0.35s ease;
        }
        .embla__slide.is-snapped .slide-name {
          font-size: 36px;
        }
        .embla__slide .slide-icon {
          width: 16px;
          height: 16px;
          transition: width 0.35s ease, height 0.35s ease;
        }
        .embla__slide.is-snapped .slide-icon {
          width: 22px;
          height: 22px;
        }
        .embla__slide .slide-desc {
          font-size: 12px;
          transition: font-size 0.35s ease;
        }
        .embla__slide.is-snapped .slide-desc {
          font-size: 14px;
        }
        .embla__slide .slide-tag {
          color: #8B849E;
          font-weight: 400;
          transition: color 0.35s ease, font-weight 0.35s ease;
        }
        .embla__slide.is-snapped .slide-tag {
          color: #9B7CF8;
          font-weight: 600;
        }
        .embla__slide .slide-card {
          height: 220px;
          transition: height 0.35s ease;
        }
        .embla__slide.is-snapped .slide-card {
          height: 240px;
        }
      `}</style>

      <h2
        className="text-center font-semibold text-[#2D2540] mb-6 flex items-center justify-center gap-1"
        style={{ fontSize: "16px", letterSpacing: "-0.2px" }}
      >
        이런 이름은 어때요?
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sparkle_two.png"
          alt=""
          aria-hidden="true"
          style={{ width: "26px", height: "26px" }}
        />
      </h2>

      <div className="relative flex items-center">
        <button
          onClick={scrollPrev}
          className="absolute left-2 z-10 flex items-center justify-center bg-white rounded-full flex-shrink-0"
          style={{
            width: "28px",
            height: "28px",
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
          <div className="flex" style={{ gap: "8px" }}>
            {NAMES.map((item) => (
              <div
                key={item.index}
                className="embla__slide flex-none"
                style={{ width: "180px" }}
              >
                <div
                  className="slide-inner"
                  style={{ borderRadius: "20px", background: "#FFFFFF" }}
                >
                  <div className="slide-card" style={{ padding: "20px 18px" }}>
                    <span
                      className="block"
                      style={{ fontSize: "12px", color: "#8B849E" }}
                    >
                      {item.index}
                    </span>

                    <div className="mt-1 flex items-end gap-1">
                      <span
                        className="slide-name font-bold leading-[1.15]"
                        style={{ letterSpacing: "-0.5px", color: "#2D2540" }}
                      >
                        {item.name}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.icon}
                        alt=""
                        className="slide-icon mb-1"
                        style={{ objectFit: "contain" }}
                      />
                    </div>

                    <p
                      className="slide-desc mt-3 leading-[1.6] whitespace-pre-line"
                      style={{ color: "#2D2540" }}
                    >
                      {item.desc}
                    </p>

                    <div className="mt-4 flex gap-[6px] flex-wrap">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="slide-tag"
                          style={{ fontSize: "12px" }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={scrollNext}
          className="absolute right-2 z-10 flex items-center justify-center bg-white rounded-full flex-shrink-0"
          style={{
            width: "28px",
            height: "28px",
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

      <div className="flex justify-center items-center gap-2 mt-4">
        {NAMES.map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`${i + 1}번 카드`}
            >
              <div
                style={{
                  width: isActive ? "8px" : "6px",
                  height: isActive ? "8px" : "6px",
                  borderRadius: "50%",
                  background: isActive ? "#9B7CF8" : "#D1CCE8",
                  transition:
                    "width 0.3s ease, height 0.3s ease, background 0.3s ease",
                }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
