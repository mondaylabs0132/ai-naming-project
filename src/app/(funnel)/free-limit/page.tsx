import { Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { isUuid } from "@/lib/free-usage/visitor";
import { isPaymentWindowOpen } from "@/lib/payments/orders";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 무료 횟수 소진 안내 — 동시에 유료 전환 지점이다.
 *
 * 예전에는 "홈으로 돌아가기"뿐인 막다른 길이었다. 결제는 requestId(설문)가
 * 있어야만 가능한데 여기서 홈으로 돌려보내면 결제 경로 자체가 사라진다.
 * 이제 설문을 마친 사용자는 `?requestId=`를 달고 도착하고, 그 설문 그대로
 * 정식 분석을 결제할 수 있다.
 */
export default async function FreeLimitPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string }>;
}) {
  const { requestId } = await searchParams;
  const upgradableId = await resolveUpgradableRequestId(requestId);

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
        <span className="text-primary">무료 횟수</span>
        <span className="text-ink">를 모두 사용했어요</span>
      </h1>

      {upgradableId ? (
        <>
          <p className="mt-4 w-[260px] text-body leading-relaxed text-ink-muted">
            방금 작성하신 정보로 정식 분석을 바로 받아보실 수 있어요.
            <br />
            이름 20개와 한 자 한 자 풀이까지 담아드려요.
          </p>

          <Link
            href={`/upgrade/${upgradableId}`}
            className="mt-10 flex h-[64px] w-full max-w-xs items-center justify-center rounded-lg bg-primary text-[19px] font-semibold leading-none tracking-normal text-white shadow-btn"
          >
            정식 분석 받아보기
          </Link>

          <Link
            href="/"
            className="mt-4 flex h-12 w-full max-w-xs items-center justify-center gap-2 text-[15px] font-semibold leading-none tracking-normal text-ink-muted"
          >
            <Home className="size-4" strokeWidth={2.4} aria-hidden="true" />
            홈으로 돌아가기
          </Link>
        </>
      ) : (
        <>
          <p className="mt-4 w-[225px] text-body leading-relaxed text-ink-muted">
            이미 받은 결과가 있다면 유료 분석으로 더 자세한 풀이를 확인해주세요.
          </p>

          <Link
            href="/mypage/results"
            className="mt-10 flex h-[64px] w-full max-w-xs items-center justify-center rounded-lg bg-primary text-[19px] font-semibold leading-none tracking-normal text-white shadow-btn"
          >
            내 결과 보러가기
          </Link>

          <Link
            href="/"
            className="mt-4 flex h-12 w-full max-w-xs items-center justify-center gap-2 text-[15px] font-semibold leading-none tracking-normal text-ink-muted"
          >
            <Home className="size-4" strokeWidth={2.4} aria-hidden="true" />
            홈으로 돌아가기
          </Link>
        </>
      )}
    </main>
  );
}

/**
 * 이 requestId로 결제를 이어갈 수 있는지 확인한다.
 *
 * 결제 불가 상태에서 CTA를 보여주면 upgrade 화면이 not-found로 튕겨
 * 두 번 실망하게 된다. 여기서 미리 걸러 문구까지 바꾼다.
 */
async function resolveUpgradableRequestId(
  requestId: string | undefined,
): Promise<string | null> {
  if (!isUuid(requestId)) return null;

  const admin = createAdminClient();
  const { data: nr } = await admin
    .from("naming_requests")
    .select("id,status,deleted_at,free_expires_at")
    .eq("id", requestId)
    .maybeSingle();

  if (!nr || nr.deleted_at || nr.status === "DELETED") return null;
  if (!isPaymentWindowOpen(nr.free_expires_at as string | null)) return null;

  // 설문이 저장돼 있어야 유료 생성이 가능하다.
  const { data: survey } = await admin
    .from("naming_surveys")
    .select("request_id")
    .eq("request_id", requestId)
    .maybeSingle();

  return survey ? (nr.id as string) : null;
}
