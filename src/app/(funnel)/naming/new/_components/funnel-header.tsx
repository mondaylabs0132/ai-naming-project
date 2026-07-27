import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export default function FunnelHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-bg/80 px-5 backdrop-blur-md">
      <Image
        src="/assets/logo.png"
        alt="첫지음 로고"
        width={80}
        height={32}
        priority
        className="h-auto w-[80px] py-3 object-contain"
      />

      <Link
        href="/"
        aria-label="홈으로 이동"
        className="-mr-1 flex size-[clamp(36px,10vw,40px)] items-center justify-center text-ink"
      >
        <X
          aria-hidden="true"
          className="size-[clamp(26px,7vw,32px)]"
          strokeWidth={2.25}
        />
      </Link>
    </header>
  );
}
