import { notFound, redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import PremiumGeneratingClient from "./_components/generating-client";

export default async function PremiumGeneratingPage({
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
    redirect(`/login?redirectTo=/upgrade/${resultId}/generating`);
  }

  // 2. 소유권 — 타인 소유 결과 차단(미귀속 결과는 결제 확정 시 귀속되므로 허용)
  const admin = createAdminClient();
  const { data: nr } = await admin
    .from("naming_requests")
    .select("user_id, status, deleted_at")
    .eq("id", resultId)
    .maybeSingle();
  if (!nr || nr.deleted_at || nr.status === "DELETED") notFound();
  if (nr.user_id && nr.user_id !== user.id) notFound();

  // 3. 이미 생성 완료 → 결과 페이지로
  if (nr.status === "PREMIUM_RESULT_READY") {
    redirect(`/upgrade/${resultId}/result`);
  }

  // 결제 승인/생성 폴링은 클라이언트가 담당 (confirming·pending·generating·failed)
  return <PremiumGeneratingClient />;
}
