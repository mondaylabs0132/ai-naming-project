export default function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden p-4"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      {children}
    </div>
  );
}
