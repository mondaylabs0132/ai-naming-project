import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export default function FunnelHeader() {
  return (
    <header className="bg-bg flex h-[72px] items-center justify-between px-7">
      <Image
        src="/assets/logo.png"
        alt="이름담다 로고"
        width={100}
        height={32}
        priority
        className="h-auto w-[100px] object-contain"
      />

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
