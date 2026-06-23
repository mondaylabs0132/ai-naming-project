import { Siren } from 'lucide-react';
import Image from 'next/image';

const TIPS = [
  '분석 시간은 평균 10~20초 정도 소요돼요.',
  '더 정확한 결과를 위해 데이터를 꼼꼼히 분석하고 있어요.',
  '잠시만 기다려주시면, 아이에게 꼭 맞는 이름을 추천해드릴게요.',
];

export default function GeneratingPage() {
  return (
    <div className="px-5 py-6 text-center">
      <div className="flex items-center justify-center gap-1">
        <p className="text-caption font-semibold text-primary">
          정확하고 깊이 있는 분석을 위해
        </p>
        <Image
          src="/assets/sparkle_two.png"
          alt="sparkle_two"
          width={461}
          height={514}
          className="w-3 h-auto pb-1 object-contain"
        />
      </div>
      <h1 className="mt-2 text-page-title font-extrabold text-ink leading-[1.35] tracking-[-0.4px]">
        AI가 이름을{' '}
        <span className="relative inline-block text-primary">
          분석하고 있어요
          <svg
            className="absolute left-0 -bottom-1 w-full text-primary-muted"
            height="8"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M2 7 Q50 2 98 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </h1>
      <p className="mt-3 text-ink-muted leading-[1.7]">
        입력하신 정보를 바탕으로
        <br />
        사주, 오행, 음양, 수리, 음운, 의미까지 종합 분석 중이에요.
      </p>

      {/* 일러스트 영역 */}
      <div className="relative my-8">
        <Image
          src="/assets/funnel-generating.png"
          alt="funnel-generating"
          width={1408}
          height={1117}
          sizes="100vw"
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="flex items-center justify-center gap-1">
        <p className="font-semibold text-ink">정성껏 분석하고 있어요</p>
        <Image
          src="/assets/sparkle.png"
          alt="sparkle"
          width={1024}
          height={1024}
          className="w-8 h-auto object-contain"
        />
      </div>

      {/* 안내 카드 */}
      <div className="mt-2 bg-primary-pale rounded-lg shadow-card p-5 text-left">
        <p className="font-bold text-primary flex items-center gap-2 pl-0.5">
          <Siren className="w-5 h-5" />
          알려드려요
        </p>
        <ul className="mt-3 space-y-2">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-center gap-2">
              <Image
                src="/assets/check.png"
                alt="check"
                width={1024}
                height={1024}
                className="w-5 h-auto mt-0.5 shrink-0 object-contain"
              />
              <span className=" text-ink">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 font-semibold text-ink leading-[1.7]">
        분석 결과는 입력하신 정보 외에는 저장되지 않아요.
        <br />
        안심하고 기다려주세요 💜
      </p>
    </div>
  );
}
