import { notFound, redirect } from "next/navigation";

import { checkFreeUsage } from "@/lib/free-usage/server";
import { hasCompletedOrder } from "@/lib/payments/orders";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import GeneratingClient from "./_components/generating-client";

export default async function GeneratingPage({
  searchParams,
}: {
  searchParams: Promise<{ requestId?: string }>;
}) {
  const { requestId } = await searchParams;

  // requestId 없이 진입하면 잘못된 접근이므로 not-found 페이지로 이동
  if (!requestId) {
    notFound();
  }

  // 무료 횟수가 소진된 사용자는 로딩 화면을 보여줬다 튕기는 대신
  // 곧바로 유료 안내로 보낸다. 설문은 이미 저장돼 있으므로(requestId 발급 완료)
  // 그대로 결제로 이어갈 수 있다.
  if (await shouldRedirectToPaywall(requestId)) {
    redirect(`/free-limit?requestId=${requestId}`);
  }

  return <GeneratingClient requestId={requestId} />;
}

/**
 * 무료 생성을 시작할 수 없는 상태인지 판정한다.
 *
 * 판정에 실패하면 통과시킨다. 여기서 막아봤자 비용이 줄지 않고(AI 호출은
 * 생성 라우트에서 일어난다), 실제 차감은 `consumeFreeUsage`가 한 번 더 막는다.
 */
async function shouldRedirectToPaywall(requestId: string): Promise<boolean> {
  const admin = createAdminClient();

  try {
    // 이미 생성이 끝난 요청이면(새로고침·재진입) 생성 라우트가 캐시를 돌려준다.
    // 무료 횟수와 무관하게 통과시켜야 자기 결과를 다시 볼 수 있다.
    const { data: cached } = await admin
      .from("name_candidates")
      .select("id")
      .eq("request_id", requestId)
      .limit(1)
      .maybeSingle();

    if (cached) return false;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const usage = await checkFreeUsage(admin, {
      ipLimitBypass: user ? await hasCompletedOrder(admin, user.id) : false,
    });

    return !usage.ok;
  } catch (error) {
    console.error("[generating] 무료 사용 제한 확인 실패:", error);
    return false;
  }
}
