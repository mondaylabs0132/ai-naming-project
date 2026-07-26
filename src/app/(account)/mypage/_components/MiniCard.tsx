export default function MiniCard({
  image,
  children,
}: {
  image: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // 모바일: 전체 폭 한 줄 / sm 이상: 좌측 40% 컬럼
    <div className="bg-surface-section flex flex-row items-center gap-3 p-3 w-full min-w-0 sm:w-auto sm:basis-2/5 rounded-md">
      <div className="shrink-0">{image}</div>
      <div className="flex flex-col gap-[3px] min-w-0">{children}</div>
    </div>
  );
}
