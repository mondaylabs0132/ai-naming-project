export default function SectionCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface shadow-card overflow-hidden p-3 min-[376px]:p-4 rounded-lg">
      {children}
    </div>
  );
}
