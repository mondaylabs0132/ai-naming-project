'use client';

import Image from 'next/image';
import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

const NAME = {
  index: 1,
  name: '하온',
  icon: '/assets/gold_star.png',
  highlight: '따뜻한',
  descRest: '햇살처럼 밝고 온화한 아이',
  secondaryDesc: '따뜻한 마음과 밝은 에너지로\n주변을 환하게 비추는 아이예요.',
  tags: ['따뜻한', '밝은', '온화한', '친화적인'],
};

const LOCKED_NAMES = [
  {
    index: 2,
    name: '서우',
    icon: '/assets/purple_heart.png',
    desc: '한결같이 맑고\n바른 아이',
    tags: ['맑은', '단정한', '밝은'],
  },
  {
    index: 3,
    name: '하린',
    icon: '/assets/gold_star.png',
    desc: '하늘처럼 맑고\n따뜻한 마음을 가진 아이',
    tags: ['부드러운', '따뜻한', '밝은'],
  },
];

function NameCard({
  index,
  name,
  icon,
  tags,
  active,
  children,
}: {
  index: number;
  name: string;
  icon: string;
  tags: string[];
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: '20px',
        background: '#FFFFFF',
        minHeight: active ? '240px' : '220px',
        padding: '20px 18px',
        boxShadow: active
          ? '0px 8px 32px rgba(124,111,205,0.18)'
          : '0px 2px 8px rgba(124,111,205,0.06)',
      }}
    >
      <span className="block" style={{ fontSize: '12px', color: '#8B849E' }}>
        {String(index).padStart(2, '0')}
      </span>

      <div className="mt-1 flex items-end gap-1">
        <span
          className="font-bold leading-[1.15]"
          style={{
            fontSize: active ? '36px' : '26px',
            letterSpacing: '-0.5px',
            color: '#2D2540',
          }}
        >
          {name}
        </span>
        <Image
          src={icon}
          alt=""
          aria-hidden="true"
          width={active ? 22 : 16}
          height={active ? 22 : 16}
          className="mb-1 object-contain"
        />
      </div>

      <p className="mt-3 text-xs min-[376px]:text-body leading-[1.6] whitespace-pre-line">
        {children}
      </p>

      <div className="mt-4 flex flex-wrap" style={{ gap: '6px' }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '12px',
              color: active ? '#9B7CF8' : '#8B849E',
              fontWeight: active ? 600 : 400,
            }}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function LockedCard({ item }: { item: (typeof LOCKED_NAMES)[number] }) {
  return (
    <div className="relative" aria-hidden="true">
      <div className="blur-[2px] select-none">
        <NameCard
          index={item.index}
          name={item.name}
          icon={item.icon}
          tags={item.tags}
        >
          {item.desc}
        </NameCard>
      </div>

      <div className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-card">
          <Lock size={16} className="text-ink-muted" />
        </div>
      </div>
    </div>
  );
}

export default function NameResultCard() {
  return (
    <section className="relative overflow-hidden py-6">
      <div className="flex items-center justify-center" style={{ gap: '8px' }}>
        <div
          className="shrink-0"
          style={{ width: '180px', transform: 'scale(0.78)', opacity: 0.6 }}
        >
          <LockedCard item={LOCKED_NAMES[0]} />
        </div>

        <div
          className="shrink-0"
          style={{ width: '200px', transform: 'scale(1.05)' }}
        >
          <NameCard
            index={NAME.index}
            name={NAME.name}
            icon={NAME.icon}
            tags={NAME.tags}
            active
          >
            <span className="font-bold text-primary-light">
              {NAME.highlight}
            </span>{' '}
            {NAME.descRest}
            {'\n'}
            {NAME.secondaryDesc}
          </NameCard>
        </div>

        <div
          className="shrink-0"
          style={{ width: '180px', transform: 'scale(0.78)', opacity: 0.6 }}
        >
          <LockedCard item={LOCKED_NAMES[1]} />
        </div>
      </div>
    </section>
  );
}
