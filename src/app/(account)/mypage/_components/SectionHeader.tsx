export default function SectionHeader({ badge, label }: { badge: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div
        className="flex items-center justify-center rounded-full bg-[var(--color-primary-pale)]"
        style={{ width: "22px", height: "22px" }}
      >
        <span
          className="font-semibold text-[var(--color-primary)]"
          style={{ fontSize: "11px" }}
        >
          {badge}
        </span>
      </div>
      <span
        className="font-semibold text-[var(--color-ink)]"
        style={{ fontSize: "15px" }}
      >
        {label}
      </span>
    </div>
  );
}
