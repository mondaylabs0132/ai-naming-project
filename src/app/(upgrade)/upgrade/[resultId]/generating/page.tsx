import {
  CheckCircle2,
  ShieldCheck,
  LoaderCircle,
  Siren,
  RefreshCcw,
} from 'lucide-react';
import Image from 'next/image';

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
    desc: '20개의 이름 결과를 정리하여 보여드릴게요',
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

export default function PremiumGeneratingPage() {
  return (
    <div className="px-5 py-4 text-center">
      {/* 결제 완료 */}
      <Image
        src="/assets/check.png"
        alt="check"
        width={1024}
        height={1024}
        className="w-16 h-auto object-contain mx-auto"
      />

      <p className="mt-3 text-caption font-semibold text-primary">
        결제가 완료되었어요!
      </p>

      <h1 className="mt-2 text-page-title font-extrabold leading-[1.35] tracking-[-0.4px]">
        <span className="text-ink">20개의 이름을</span>
        <br />
        <span className="text-primary">정성껏 분석하고 있어요</span>
      </h1>

      <p className="mt-3 text-[14px] text-ink-muted leading-[1.7]">
        AI와 전문가가 사주, 음양, 발음, 의미까지
        <br />
        꼼꼼하게 분석하여 최고의 이름을 찾아드릴게요.
      </p>

      <div className="relative my-8 flex justify-center">
        <Image
          src="/assets/upgrade-generating.png"
          alt="upgrade-generating"
          width={1408}
          height={1117}
          sizes="100vw"
          className="w-full h-auto object-contain"
        />
      </div>

      <p className="text-[14px] font-semibold text-ink">분석 진행 중...</p>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-2 overflow-hidden rounded-full bg-primary-pale">
          <div
            className="h-full rounded-full"
            style={{
              width: `${PROGRESS_PERCENT}%`,
              background:
                'linear-gradient(to right, var(--color-ink), var(--color-primary))',
            }}
          />
        </div>

        <span className="text-body font-bold text-primary">
          {PROGRESS_PERCENT}%
        </span>
      </div>

      <p className="mt-2 text-caption leading-[1.6] text-ink-muted">
        잠시만 기다려주세요. 더욱 정확한 결과를 위해 노력하고 있어요.
      </p>

      <div className="mt-6 rounded-lg bg-surface p-5 text-left shadow-card">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              {step.status === 'done' && (
                <div
                  className="flex items-center justify-center rounded-full bg-primary text-surface"
                  style={{ width: '24px', height: '24px' }}
                >
                  <CheckCircle2 size={14} />
                </div>
              )}

              {step.status === 'active' && (
                <div
                  className="flex items-center justify-center rounded-full border-2 border-primary"
                  style={{ width: '24px', height: '24px' }}
                >
                  <div
                    className="rounded-full bg-primary"
                    style={{ width: '10px', height: '10px' }}
                  />
                </div>
              )}

              {step.status === 'pending' && (
                <div
                  className="rounded-full border-2 border-divider"
                  style={{ width: '24px', height: '24px' }}
                />
              )}

              {i < STEPS.length - 1 && (
                <div
                  className="flex-1 border-l-2 border-dashed border-primary-muted"
                  style={{ width: 0, marginTop: '4px', marginBottom: '4px' }}
                />
              )}
            </div>

            <div className={i < STEPS.length - 1 ? 'pb-5' : ''}>
              <p
                className={`text-[14px] font-semibold ${
                  step.status === 'active' ? 'text-primary' : 'text-ink'
                }`}
              >
                {step.title}
              </p>

              <p className="mt-0.5 text-caption leading-normal text-ink-muted">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-primary-pale p-5 text-left">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-primary">
          <Siren size={16} />
          잠깐! 더 좋은 결과를 위한 과정이에요
        </p>

        <p className="mt-1.5 text-caption leading-[1.6] text-ink">
          정확하고 의미 있는 이름을 찾기 위해 다양한 요소를 종합적으로 분석하고
          있어요.
          <br />
          보통 1분 내외로 결과를 받아보실 수 있어요.
        </p>
      </div>

      <div className="mt-4 rounded-lg bg-surface p-5 text-left shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <LoaderCircle size={16} />
            현재 분석 중인 요소
          </p>

          <span className="flex items-center gap-1 text-tag text-ink-muted">
            <RefreshCcw size={12} />
            분석 요소 업데이트 중
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-caption">
          {ANALYZING_TAGS.map((tag, i) => (
            <span key={tag.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-ink-light">·</span>}

              <span
                className={`flex items-center gap-1 ${
                  tag.active
                    ? 'font-semibold text-primary'
                    : 'font-normal text-ink-muted'
                }`}
              >
                {tag.active && (
                  <span
                    className="rounded-full bg-primary"
                    style={{ width: '6px', height: '6px' }}
                  />
                )}

                {tag.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-caption leading-[1.6] text-ink-muted">
        <ShieldCheck size={14} />
        분석 중 입력하신 정보는 안전하게 보호되며, 제3자에게 제공되지 않습니다.
      </p>
    </div>
  );
}
