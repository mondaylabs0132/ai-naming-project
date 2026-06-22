export default function MiniCard({
  image,
  children,
}: {
  image: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-[var(--color-surface-section)] flex flex-row items-center gap-3 p-3 basis-[40%] shrink-0"
      style={{ borderRadius: "var(--radius-md)" }}
    >
      <div className="shrink-0">{image}</div>
      <div className="flex flex-col gap-[3px]">{children}</div>
    </div>
  );
}
