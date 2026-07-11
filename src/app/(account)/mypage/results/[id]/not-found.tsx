import Image from "next/image";

export default function MyPageResultNotFound() {
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
        요청하신 결과가 없거나
        <br />
        접근 권한이 없는 결과예요.
      </p>
    </div>
  );
}
