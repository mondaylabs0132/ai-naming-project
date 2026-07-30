import { Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function FreeLimitPage() {
  return (
    <main className="flex min-h-[80dvh] flex-col items-center justify-center px-5 py-16 text-center">
      <Image
        src="/assets/funnel-result.png"
        alt=""
        aria-hidden="true"
        width={200}
        height={200}
        className="h-auto w-40 object-contain"
      />

      <p className="mt-8 font-chalkboard text-ink">무료 추천 제한 안내</p>

      <h1 className="mt-3 text-[25px] font-extrabold leading-tight tracking-normal">
        <span className="text-primary">무료 횟수</span>{" "}
        <span className="text-ink">제한을 초과했어요</span>
      </h1>

      <p className="w-[225px] mt-4 text-body leading-relaxed text-ink-muted">
        이미 받은 결과가 있다면 유료 분석으로 더 자세한 풀이를 확인해주세요.
      </p>

      <Link
        href="/"
        className="mt-10 flex h-[64px] w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-primary text-[19px] font-semibold leading-none tracking-normal text-white shadow-btn"
      >
        <Home className="size-5" strokeWidth={2.4} aria-hidden="true" />
        홈으로 돌아가기
      </Link>
    </main>
  );
}
