import Image from "next/image";
import NameResultCard from "./_components/name-result-card";
import UpgradeCta from "./_components/upgrade-cta";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <div className="px-5 pt-2">
        <p className="flex items-center gap-1 text-ink font-medium text-body">
          우리 아이에게 어울리는 이름 <span aria-hidden="true">💜</span>
        </p>

        <div className="relative mt-2">
          <h1
            className="text-hero font-extrabold leading-tight tracking-[-0.5px]"
            style={{ maxWidth: "min(260px, 62%)" }}
          >
            <span className="text-ink">이런 이름을</span>
            <br />
            <span className="text-primary">추천드려요</span>
          </h1>

          <Image
            src="/assets/generating-result.png"
            alt=""
            aria-hidden="true"
            width={200}
            height={200}
            className="absolute -top-2 right-0 object-contain"
            style={{ width: "min(130px, 36%)", height: "auto" }}
          />
        </div>

        <p
          className="mt-3 text-ink-muted text-body leading-relaxed"
          style={{ maxWidth: "min(280px, 68%)" }}
        >
          AI와 전문가의 분석을 통해
          <br />
          우리 아이에게 어울리는 이름을 찾았어요.
        </p>
      </div>

      <NameResultCard />

      <UpgradeCta resultId={id} />
    </div>
  );
}
