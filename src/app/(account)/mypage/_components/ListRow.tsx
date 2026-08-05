import { ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * 마이페이지 섹션 안의 이동 행.
 *
 * href가 없으면 갈 곳이 없다는 뜻이므로 비활성 모양으로 렌더한다.
 * (예: 유료 분석이 아직 없어 "결과 보러가기"의 대상이 없는 경우)
 * 눌리지 않는 행을 눌리는 것처럼 두면 오작동으로 읽힌다.
 */
export default function ListRow({
  icon,
  label,
  href,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  hint?: string; // 비활성일 때 이유를 알려주는 짧은 문구
}) {
  const base =
    "border border-divider rounded-sm px-3 py-[11px] flex items-center gap-2 mb-2 last:mb-0";

  const content = (
    <>
      <span
        className={href ? "text-primary shrink-0" : "text-ink-light shrink-0"}
      >
        {icon}
      </span>
      <span
        className={`flex-1 min-w-0 break-keep text-caption min-[376px]:text-[14px] ${
          href ? "text-ink" : "text-ink-muted"
        }`}
      >
        {label}
      </span>
      {!href && hint && (
        <span className="text-ink-light text-[11px] shrink-0 break-keep">
          {hint}
        </span>
      )}
      {href && <ChevronRight size={16} className="text-ink-muted shrink-0" />}
    </>
  );

  if (!href) {
    return (
      <div className={`${base} bg-surface-section`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={base}>
      {content}
    </Link>
  );
}
