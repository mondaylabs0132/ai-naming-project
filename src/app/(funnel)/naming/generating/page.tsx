const TIPS = [
  '분석 시간은 평균 10~20초 정도 소요돼요.',
  '더 정확한 결과를 위해 데이터를 꼼꼼히 분석하고 있어요.',
  '잠시만 기다려주시면, 아이에게 꼭 맞는 이름을 추천해드릴게요.',
];

export default function GeneratingPage() {
  return (
    <div className="px-5 py-6 text-center">
      <p className="text-caption font-semibold text-primary">
        정확하고 깊이 있는 분석을 위해 ✨
      </p>
      <h1 className="mt-2 text-page-title font-extrabold text-ink leading-[1.35] tracking-[-0.4px]">
        AI가 이름을{' '}
        <span className="text-primary underline decoration-2 decoration-primary-muted">
          분석하고 있어요
        </span>
      </h1>
      <p className="mt-3 text-[14px] text-ink-muted leading-[1.7]">
        입력하신 정보를 바탕으로
        <br />
        사주, 오행, 음양, 수리, 음운, 의미까지 종합 분석 중이에요.
      </p>

      {/* 일러스트 영역 */}
      <div className="relative my-8 flex justify-center">
        <div className="absolute left-2 top-4 bg-surface rounded-md shadow-card flex items-center gap-1 px-3 py-2">
          <span className="text-[18px]">📊</span>
        </div>
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-surface rounded-full shadow-card flex items-center justify-center text-caption font-bold text-primary animate-pulse"
          style={{ width: '44px', height: '44px' }}
        >
          AI
        </div>
        <div className="absolute right-1 bottom-2 bg-surface rounded-md shadow-card flex items-center gap-1 px-3 py-2">
          <span className="text-[18px]">📈</span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-star.png"
          alt=""
          style={{ width: '200px', height: 'auto', objectFit: 'contain' }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sparkle_two.png"
          alt=""
          className="absolute left-6 bottom-0 animate-pulse"
          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
        />
      </div>

      <p className="text-[14px] font-semibold text-ink">
        정성껏 분석하고 있어요 ✨
      </p>

      {/* 안내 카드 */}
      <div className="mt-6 bg-surface rounded-lg shadow-card p-5 text-left">
        <p className="text-body font-semibold text-ink flex items-center gap-1.5">
          💡 알려드려요
        </p>
        <ul className="mt-3 space-y-2.5">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/check.png"
                alt=""
                className="mt-0.5 shrink-0"
                style={{ width: '16px', height: '16px', objectFit: 'contain' }}
              />
              <span className="text-[14px] text-ink leading-[1.6]">
                {tip}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 text-caption text-ink-muted leading-[1.7]">
        분석 결과는 입력하신 정보 외에는 저장되지 않아요.
        <br />
        안심하고 기다려주세요 💜
      </p>
    </div>
  );
}
