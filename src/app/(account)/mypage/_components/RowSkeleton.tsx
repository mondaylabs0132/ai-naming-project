// 마이페이지 하위 목록(분석 이력·쿠폰·결제·문의)이 공유하는 로딩 자리표시자.
export default function RowSkeleton() {
  return (
    <div
      className="bg-surface border border-primary-pale p-4 flex items-center gap-3 animate-pulse"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="rounded-full bg-divider shrink-0 size-9" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="h-4 w-32 rounded bg-divider" />
        <div className="h-3 w-20 rounded bg-divider" />
      </div>
    </div>
  );
}
