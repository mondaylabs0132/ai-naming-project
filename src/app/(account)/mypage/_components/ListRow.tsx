import { ChevronRight } from "lucide-react";

export default function ListRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="border border-[var(--color-divider)] rounded-[var(--radius-sm)] px-3 py-[11px] flex items-center gap-2 mb-2 last:mb-0">
      <span className="text-[var(--color-primary)]">{icon}</span>
      <span className="flex-1 text-[var(--color-ink)]" style={{ fontSize: "14px" }}>
        {label}
      </span>
      <ChevronRight size={16} className="text-[var(--color-ink-muted)]" />
    </div>
  );
}
