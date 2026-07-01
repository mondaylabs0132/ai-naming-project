import Image from "next/image";
import Link from "next/link";

export default function ResultNotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-5 py-16 text-center">
      <Image
        src="/assets/funnel-result.png"
        alt=""
        aria-hidden="true"
        width={200}
        height={200}
        className="h-auto w-40 object-contain"
      />

      <p className="mt-8 flex items-center gap-1 font-chalkboard text-ink">
        결과를 찾을 수 없어요
        <span className="text-[10px] pt-1" aria-hidden="true">
          💜
        </span>
      </p>

      <h1 className="mt-3 text-hero font-extrabold leading-tight tracking-[-0.5px]">
        <span className="text-primary">404</span>{" "}
        <span className="text-ink">NOT FOUND</span>
      </h1>

      <p className="mt-4 text-body leading-relaxed text-ink-muted">
        무료 결과가 만료되었거나
        <br />
        주소가 잘못되었을 수 있어요.
      </p>

      <div className="mt-10 w-full max-w-xs">
        <Link
          href="/"
          className="flex h-[64px] w-full items-center justify-center rounded-lg bg-primary text-[19px] font-semibold leading-none tracking-normal text-white shadow-btn"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
