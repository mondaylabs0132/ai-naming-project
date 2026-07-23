import { notFound, redirect } from "next/navigation";

import ResultPageView from "@/components/result/ResultPageView";
import { createClient } from "@/lib/supabase/server";

export default async function PremiumResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;

  // 1. 인증 — 미로그인 시 로그인 페이지로 (인증 후 이 결과로 복귀)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=/upgrade/${resultId}/result`);
  }

  // 2. 소유권 — RLS(auth.uid() = user_id, deleted_at IS NULL)본인 결과가 아니면 존재를 숨김(404)
  const { data: nr } = await supabase
    .from("naming_requests")
    .select("status")
    .eq("id", resultId)
    .maybeSingle();
  if (!nr || nr.status === "DELETED") notFound();

  // 3. 결제/생성 상태 — 준비된 유료 결과만 노출
  if (nr.status !== "PREMIUM_RESULT_READY") {
    const { data: order } = await supabase
      .from("premium_orders")
      .select("status")
      .eq("request_id", resultId)
      .maybeSingle();
    // 결제는 됐지만 아직 생성 중 → 로딩 페이지로, 미결제 → 결제 페이지로
    if (order?.status === "COMPLETED" || nr.status === "PREMIUM_GENERATING") {
      redirect(`/upgrade/${resultId}/generating`);
    }
    redirect(`/upgrade/${resultId}/checkout`);
  }

  return <ResultPageView requestId={resultId} userId={user.id} />;
}
