import { notFound, redirect } from "next/navigation";

import ResultDetailView from "@/components/result/ResultDetailView";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function PremiumNameDetailPage({
  params,
}: {
  params: Promise<{ resultId: string; nameId: string }>;
}) {
  const { resultId, nameId } = await params;
  void nameId;

  // 1. 인증 — 미로그인 시 로그인 페이지로 (인증 후 이 결과로 복귀)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=/upgrade/${resultId}/result/${nameId}`);
  }

  // 2. 소유권 — 본인 결과가 아니면 존재를 숨김(404)
  const admin = createAdminClient();
  const { data: nr } = await admin
    .from("naming_requests")
    .select("user_id, status, deleted_at")
    .eq("id", resultId)
    .maybeSingle();
  if (!nr || nr.deleted_at || nr.status === "DELETED") notFound();
  if (nr.user_id !== user.id) notFound();

  // 3. 결제/생성 상태 — 준비된 유료 결과만 노출
  if (nr.status !== "PREMIUM_RESULT_READY") {
    const { data: order } = await admin
      .from("premium_orders")
      .select("status")
      .eq("request_id", resultId)
      .maybeSingle();
    if (order?.status === "COMPLETED" || nr.status === "PREMIUM_GENERATING") {
      redirect(`/upgrade/${resultId}/generating`);
    }
    redirect(`/upgrade/${resultId}/checkout`);
  }

  return <ResultDetailView />;
}
