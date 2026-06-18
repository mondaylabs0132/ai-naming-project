const PROGRESS_PERCENT = 68;

const STEPS = [
  {
    title: '기본 정보 분석',
    desc: '사주, 오행, 음양오행, 수리격 분석 완료',
    status: 'done' as const,
  },
  {
    title: '이름 후보 분석 중',
    desc: '의미, 발음, 한자, 활용도, 선호도 분석 중',
    status: 'active' as const,
  },
  {
    title: '전문가 최종 검토',
    desc: '전문가가 최종적으로 검토하고 순위를 매기는 중',
    status: 'pending' as const,
  },
  {
    title: '결과 정리 및 제공',
    desc: '30개의 이름 결과를 정리하여 보여드릴게요',
    status: 'pending' as const,
  },
];

const ANALYZING_TAGS = [
  { label: '이름 의미 해석', active: true },
  { label: '음양 조화 분석', active: false },
  { label: '발음 조화 분석', active: false },
  { label: '한자 후보 탐색', active: false },
  { label: '선호도 데이터 반영', active: false },
];

const cardShadow = { boxShadow: '0px 2px 12px rgba(124, 111, 205, 0.08)' };

export default function PremiumGeneratingPage() {
  return (
    <div className="px-5 py-4 text-center">
      {/* 결제 완료 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/check.png"
        alt=""
        className="mx-auto"
        style={{ width: '56px', height: '56px', objectFit: 'contain' }}
      />
      <p className="mt-3 text-[13px] font-semibold text-[#7C6FCD]">
        결제가 완료되었어요!
      </p>
      <h1 className="mt-2 text-[24px] font-extrabold leading-[1.35] tracking-[-0.4px]">
        <span className="text-[#2D2540]">30개의 이름을</span>
        <br />
        <span className="text-[#7C6FCD]">정성껏 분석하고 있어요</span>
      </h1>
      <p className="mt-3 text-[14px] text-[#8B849E] leading-[1.7]">
        AI와 전문가가 사주, 음양, 발음, 의미까지
        <br />
        꼼꼼하게 분석하여 최고의 이름을 찾아드릴게요.
      </p>

      {/* 일러스트 영역 */}
      <div className="relative my-8 flex justify-center">
        <div
          className="absolute left-0 top-2 bg-white rounded-[14px] flex items-center gap-1 px-3 py-2"
          style={cardShadow}
        >
          <span className="text-[18px]">📊</span>
        </div>
        <div
          className="absolute right-0 top-2 bg-white rounded-[14px] flex items-center gap-1 px-3 py-2"
          style={cardShadow}
        >
          <span className="text-[18px]">📈</span>
        </div>
        <div
          className="absolute left-2 bottom-8 rounded-[14px] flex items-center justify-center font-bold text-[#7C6FCD]"
          style={{ width: '44px', height: '44px', backgroundColor: '#EAE7F8' }}
        >
          한
        </div>
        <div
          className="absolute right-2 bottom-8 rounded-[14px] flex items-center justify-center font-bold text-[#7C6FCD]"
          style={{ width: '44px', height: '44px', backgroundColor: '#EAE7F8' }}
        >
          음
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
          className="absolute right-10 top-0 animate-pulse"
          style={{ width: '18px', height: '18px', objectFit: 'contain' }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sparkle_two.png"
          alt=""
          className="absolute left-10 bottom-4 animate-pulse"
          style={{ width: '14px', height: '14px', objectFit: 'contain' }}
        />
      </div>

      <p className="text-[14px] font-semibold text-[#2D2540]">
        분석 진행 중...
      </p>

      {/* 진행률 */}
      <div className="mt-3 flex items-center gap-3">
        <div
          className="flex-1 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: '#EAE7F8' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${PROGRESS_PERCENT}%`,
              backgroundColor: '#7C6FCD',
            }}
          />
        </div>
        <span className="text-[15px] font-bold text-[#7C6FCD]">
          {PROGRESS_PERCENT}%
        </span>
      </div>
      <p className="mt-2 text-[13px] text-[#8B849E] leading-[1.6]">
        잠시만 기다려주세요. 더욱 정확한 결과를 위해 노력하고 있어요.
      </p>

      {/* 진행 단계 */}
      <div
        className="mt-6 bg-white rounded-[18px] p-5 text-left"
        style={cardShadow}
      >
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              {step.status === 'done' && (
                <div
                  className="rounded-full bg-[#7C6FCD] flex items-center justify-center text-white"
                  style={{ width: '24px', height: '24px', fontSize: '12px' }}
                >
                  ✓
                </div>
              )}
              {step.status === 'active' && (
                <div
                  className="rounded-full border-2 border-[#7C6FCD] flex items-center justify-center"
                  style={{ width: '24px', height: '24px' }}
                >
                  <div
                    className="rounded-full bg-[#7C6FCD]"
                    style={{ width: '10px', height: '10px' }}
                  />
                </div>
              )}
              {step.status === 'pending' && (
                <div
                  className="rounded-full border-2 border-[#EEEBF8]"
                  style={{ width: '24px', height: '24px' }}
                />
              )}
              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 border-l-2 border-dashed border-[#C4BEDB]"
                  style={{ width: 0, marginTop: '4px', marginBottom: '4px' }}
                />
              )}
            </div>
            <div className={i < STEPS.length - 1 ? 'pb-5' : ''}>
              <p
                className="text-[14px] font-semibold"
                style={{
                  color: step.status === 'active' ? '#7C6FCD' : '#2D2540',
                }}
              >
                {step.title}
              </p>
              <p className="mt-0.5 text-[13px] text-[#8B849E] leading-[1.5]">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 안내 카드 */}
      <div
        className="mt-4 rounded-[18px] p-5 text-left"
        style={{ backgroundColor: '#EAE7F8' }}
      >
        <p className="text-[14px] font-semibold text-[#7C6FCD] flex items-center gap-1.5">
          💡 잠깐! 더 좋은 결과를 위한 과정이에요
        </p>
        <p className="mt-1.5 text-[13px] text-[#2D2540] leading-[1.6]">
          정확하고 의미 있는 이름을 찾기 위해 다양한 요소를 종합적으로 분석하고
          있어요.
          <br />
          보통 1분 내외로 결과를 받아보실 수 있어요. 💜
        </p>
      </div>

      {/* 분석 요소 */}
      <div
        className="mt-4 bg-white rounded-[18px] p-5 text-left"
        style={cardShadow}
      >
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <p className="text-[14px] font-semibold text-[#2D2540] flex items-center gap-1.5">
            📶 현재 분석 중인 요소
          </p>
          <span className="text-[12px] text-[#8B849E]">
            🔄 분석 요소 업데이트 중
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px]">
          {ANALYZING_TAGS.map((tag, i) => (
            <span key={tag.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#C4BEDB]">·</span>}
              <span
                className="flex items-center gap-1"
                style={{
                  color: tag.active ? '#7C6FCD' : '#8B849E',
                  fontWeight: tag.active ? 600 : 400,
                }}
              >
                {tag.active && (
                  <span
                    className="rounded-full bg-[#7C6FCD]"
                    style={{ width: '6px', height: '6px' }}
                  />
                )}
                {tag.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      <p className="mt-6 text-[13px] text-[#8B849E] leading-[1.6]">
        🔒 분석 중 입력하신 정보는 안전하게 보호되며, 제3자에게 제공되지
        않습니다.
      </p>
    </div>
  );
}
