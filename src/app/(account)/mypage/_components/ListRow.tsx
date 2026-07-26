import { ChevronRight } from "lucide-react";

export default function ListRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="border border-divider rounded-sm px-3 py-[11px] flex items-center gap-2 mb-2 last:mb-0">
      <span className="text-primary shrink-0">{icon}</span>
      <span className="flex-1 min-w-0 text-ink break-keep text-caption min-[376px]:text-[14px]">
        {label}
      </span>
      <ChevronRight size={16} className="text-ink-muted shrink-0" />
    </div>
  );
}
