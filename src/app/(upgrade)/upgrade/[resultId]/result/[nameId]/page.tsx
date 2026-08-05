import { notFound, redirect } from "next/navigation";

import ResultDetailView from "@/components/result/ResultDetailView";
import { fetchNameDetail } from "@/lib/result/name-detail";
import { createClient } from "@/lib/supabase/server";
import { loginRedirect } from "@/lib/auth/redirect";

export default async function PremiumNameDetailPage({
  params,
}: {
  params: Promise<{ resultId: string; nameId: string }>;
}) {
  const { resultId, nameId } = await params;

  // 1. 인증 — 미로그인 시 로그인 페이지로 (인증 후 이 결과로 복귀)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(loginRedirect(`/upgrade/${resultId}/result/${nameId}`));
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
    if (order?.status === "COMPLETED" || nr.status === "PREMIUM_GENERATING") {
      redirect(`/upgrade/${resultId}/generating`);
    }
    redirect(`/upgrade/${resultId}/checkout`);
  }

  // 4. 이름 상세 — 이 결과에 속한 이름이 아니면 존재를 숨김(404)
  const detail = await fetchNameDetail(supabase, resultId, nameId);
  if (!detail) notFound();

  return <ResultDetailView detail={detail} userId={user.id} />;
}
