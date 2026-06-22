import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export default function FunnelHeader() {
  return (
    <header className="bg-bg flex h-[72px] items-center justify-between px-7">
      <div className="flex items-center gap-3">
        <Image
          src="/star.png"
          alt=""
          width={26}
          height={26}
          priority
          className="h-[26px] w-[26px] object-contain"
        />
        <span className="text-stat font-bold leading-none tracking-normal text-ink">
          첫지음
        </span>
      </div>

      <Link
        href="/"
        aria-label="홈으로 이동"
        className="-mr-1 flex h-10 w-10 items-center justify-center text-ink"
      >
        <X aria-hidden="true" size={32} strokeWidth={2.25} />
      </Link>
    </header>
  );
}
