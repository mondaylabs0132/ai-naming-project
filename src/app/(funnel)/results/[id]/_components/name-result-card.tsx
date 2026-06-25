'use client';

import { Lock, Heart } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import ClassNames from 'embla-carousel-class-names';

const NAMES = [
  {
    index: '01',
    name: '하온',
    icon: '/assets/gold_star.png',
    highlight: '따뜻한 햇살처럼 밝고 온화한 아이',
    desc: '따뜻한 마음과 밝은 에너지로\n주변을 환하게 비추는 아이예요.',
    tags: ['따뜻한', '밝은', '온화한', '친화적인'],
    locked: false,
  },
  {
    index: '02',
    name: '서우',
    icon: '/assets/purple_heart.png',
    highlight: '',
    desc: '한결같이 맑고\n바른 아이',
    tags: ['맑은', '단정한', '밝은'],
    locked: false,
  },
  {
    index: '03',
    name: '하린',
    icon: '/assets/gold_star.png',
    highlight: '',
    desc: '하늘처럼 맑고\n따뜻한 마음을 가진 아이',
    tags: ['부드러운', '따뜻한', '밝은'],
    locked: true,
  },
];

const TOTAL = 30;

export default function NameResultCard() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, align: 'center', containScroll: false, startIndex: 1 },
    [ClassNames()],
  );

  const [activeIndex, setActiveIndex] = useState(1);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
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
          style={{ width: '32px', height: '32px', boxShadow: '0px 2px 10px rgba(124,111,205,0.22)' }}
          aria-label="이전 이름"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="#7C6FCD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div
          className="w-full"
          style={{ overflowX: 'clip', paddingLeft: '44px', paddingRight: '44px' }}
          ref={emblaRef}
        >
          <div className="flex" style={{ gap: '12px' }}>
            {NAMES.map((item, i) => {
              const displayIndex = String(i + 1).padStart(2, '0');
              return (
                <div key={item.index} className="result-slide embla__slide flex-none" style={{ width: '240px' }}>
                  <div className="slide-inner relative" style={{ borderRadius: '20px', background: '#FFFFFF' }}>
                    <div className="slide-card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                      {/* 상단: 인덱스 pill (스포트라이트) / plain (비활성) + 하트 */}
                      <div className="w-full flex items-center justify-between mb-2">
                        {/* pill */}
                        <span
                          className="slide-index-pill items-center justify-center font-semibold text-white"
                          style={{ fontSize: '12px', background: '#7C6FCD', borderRadius: '9999px', padding: '3px 10px' }}
                        >
                          {displayIndex} / {TOTAL}
                        </span>
                        {/* plain */}
                        <span className="slide-index-plain" style={{ fontSize: '12px', color: '#8B849E' }}>
                          {displayIndex} / {TOTAL}
                        </span>
                        <Heart size={18} className="slide-heart text-ink-muted" />
                      </div>

                      {/* 이름 + 아이콘 */}
                      <div className="flex items-end justify-center gap-1 mt-1">
                        <span
                          className="slide-name font-bold leading-[1.15]"
                          style={{ letterSpacing: '-0.5px', color: '#2D2540' }}
                        >
                          {item.name}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.icon} alt="" aria-hidden="true" className="slide-icon mb-1" style={{ objectFit: 'contain' }} />
                      </div>

                      {/* 하이라이트 (스포트라이트만) */}
                      {item.highlight && (
                        <p className="slide-highlight mt-2 font-bold text-center" style={{ fontSize: '14px', color: '#9B7CF8' }}>
                          {item.highlight}
                        </p>
                      )}

                      {/* 설명 */}
                      <p className="slide-desc mt-2 leading-[1.6] whitespace-pre-line text-center">
                        {item.desc}
                      </p>

                      {/* 태그 */}
                      <div className="mt-3 flex gap-[6px] flex-wrap justify-center">
                        {item.tags.map((tag) => (
                          <span key={tag} className="slide-tag">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    {item.locked && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-white/20" aria-hidden="true">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white" style={{ boxShadow: '0px 2px 8px rgba(124,111,205,0.12)' }}>
                          <Lock size={16} className="text-ink-muted" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={scrollNext}
          className="absolute right-2 z-10 flex items-center justify-center bg-white rounded-full flex-shrink-0"
          style={{ width: '32px', height: '32px', boxShadow: '0px 2px 10px rgba(124,111,205,0.22)' }}
          aria-label="다음 이름"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="#7C6FCD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 하단 안내 + dot */}
      <p className="text-center mt-4" style={{ fontSize: '13px', color: '#8B849E' }}>
        <span className="mr-1" style={{ fontSize: '16px' }}>👆</span>카드를 좌우로 밀어보세요
        <br />
        마음에 드는 이름은 💜 저장할 수 있어요!
      </p>

      <div className="flex justify-center items-center gap-2 mt-3">
        {NAMES.map((_, i) => (
          <button key={i} onClick={() => emblaApi?.scrollTo(i)} aria-label={`${i + 1}번 카드`}>
            <div style={{
              width: i === activeIndex ? '8px' : '6px',
              height: i === activeIndex ? '8px' : '6px',
              borderRadius: '50%',
              background: i === activeIndex ? '#9B7CF8' : '#D1CCE8',
              transition: 'width 0.3s ease, height 0.3s ease, background 0.3s ease',
            }} />
          </button>
        ))}
      </div>
    </section>
  );
}
