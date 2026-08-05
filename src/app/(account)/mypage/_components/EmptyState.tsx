import Link from "next/link";

// 마이페이지 하위 목록의 빈 상태. desc는 줄바꿈(\n)을 그대로 반영한다.
export default function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
      <h2 className="font-bold text-ink text-section-title">{title}</h2>
      <p className="mt-3 text-ink-muted text-caption leading-relaxed whitespace-pre-line break-keep">
        {desc}
      </p>
      {action && (
        <Link
          href={action.href}
          className="mt-8 flex h-[52px] w-full max-w-xs items-center justify-center rounded-lg bg-primary font-semibold text-white shadow-btn"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
