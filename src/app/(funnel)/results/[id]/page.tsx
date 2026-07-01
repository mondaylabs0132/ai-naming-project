import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NameResultCard from "./_components/name-result-card";
import UpgradeCta from "./_components/upgrade-cta";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // id가 uuid 형식이 아니면 존재할 수 없는 결과이므로 not-found로.
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    notFound();
  }

  // 무료 결과 후보 1개만 조회.
  const supabase = await createClient();
  const { data: freeRow, error } = await supabase
    .from("name_candidates")
    .select("given_name_hangul, meaning_summary, tags")
    .eq("request_id", id)
    .eq("sort_order", 0)
    .maybeSingle();

  // 조회 오류 → 에러 페이지로.
  if (error) {
    throw new Error(`무료 결과를 불러오지 못했습니다: ${error.message}`);
  }

  // 결과 없음 → not-found 페이지로.
  if (!freeRow) {
    notFound();
  }

  const freeName = {
    hangul: freeRow.given_name_hangul as string,
    summary: freeRow.meaning_summary as string,
    tags: (freeRow.tags as string[]) ?? [],
  };

  return (
    <div>
      {/* 상단 X 버튼 */}
      <div className="flex justify-end px-5 pt-4">
        <Link href="/" aria-label="홈으로 나가기">
          <X size={24} className="text-ink-muted" />
        </Link>
      </div>

      <div className="px-5 pt-2">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="flex items-center gap-1 font-chalkboard text-ink">
              우리 아이에게 어울리는 이름{" "}
              <span className="text-[10px] pt-1" aria-hidden="true">
                💜
              </span>
            </p>
            <h1 className="text-hero font-extrabold leading-tight tracking-[-0.5px]">
              <span className="text-ink">이런 이름을</span>
              <br />
              <span className="text-primary">추천드려요</span>
            </h1>
            <p className="text-xs min-[376px]:text-body mt-3 text-ink-muted leading-relaxed whitespace-nowrap">
              AI와 전문가의 분석을 통해
              <br />
              우리 아이에게 어울리는 이름을 찾았어요.
            </p>
          </div>

          <Image
            src="/assets/funnel-result.png"
            alt="generating-result"
            aria-hidden="true"
            width={200}
            height={200}
            className="w-1/2 h-auto shrink-0 object-contain"
          />
        </div>
      </div>

      <NameResultCard freeName={freeName} />
      <UpgradeCta resultId={id} />
    </div>
  );
}
