import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import NameResultCard from './_components/name-result-card';
import UpgradeCta from './_components/upgrade-cta';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      {/* 상단 X 버튼 */}
      <div className="flex justify-end px-5 pt-4">
        <Link href="/" aria-label="홈으로 나가기">
          <X size={24} className="text-ink-muted" />
        </Link>
      </div>

      <div className="px-5 pt-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="flex items-center gap-1 font-chalkboard text-ink">
              우리 아이에게 어울리는 이름{' '}
              <span className="text-[10px] pt-1" aria-hidden="true">
                💜
              </span>
            </p>
            <h1 className="text-hero font-extrabold leading-tight tracking-[-0.5px]">
              <span className="text-ink">이런 이름을</span>
              <br />
              <span className="text-primary">추천드려요</span>
            </h1>
            <p className="text-xs min-[376px]:text-body mt-3 text-ink-muted leading-relaxed whitespace-nowrap">
              AI와 전문가의 분석을 통해
              <br />
              우리 아이에게 어울리는 이름을 찾았어요.
            </p>
          </div>

          <Image
            src="/assets/funnel-result.png"
            alt="generating-result"
            aria-hidden="true"
            width={200}
            height={200}
            className="w-1/2 h-auto shrink-0 object-contain"
          />
        </div>
      </div>

      <NameResultCard />
      <UpgradeCta resultId={id} />
    </div>
  );
}
