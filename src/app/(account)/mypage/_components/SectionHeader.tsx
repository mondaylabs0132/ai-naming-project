export default function SectionHeader({
  badge,
  label,
}: {
  badge: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex items-center justify-center rounded-full bg-primary-pale shrink-0 size-[22px]">
        <span className="font-semibold text-primary text-nav">{badge}</span>
      </div>
      <span className="font-semibold text-ink break-keep text-body">
        {label}
      </span>
    </div>
  );
}
