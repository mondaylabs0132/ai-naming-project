import { notFound, redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import UpgradeEmailClient from "./_components/upgrade-email-client";

export default async function UpgradeEmailPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;

  // 존재하지 않거나 삭제된 결과면 인증을 시작할 대상이 없음
  const admin = createAdminClient();
  const { data: nr } = await admin
    .from("naming_requests")
    .select("user_id, status, deleted_at")
    .eq("id", resultId)
    .maybeSingle();
  if (!nr || nr.deleted_at || nr.status === "DELETED") notFound();

  // 이미 로그인 상태면 OTP 재인증은 불필요 — 결제/결과로 바로 보낸다.
  // (익명 결과는 결제 준비 시 prepare가 본인에게 귀속)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    // 타인 소유 결과는 접근 차단
    if (nr.user_id && nr.user_id !== user.id) notFound();

    if (nr.status === "PREMIUM_RESULT_READY") {
      redirect(`/upgrade/${resultId}/result`);
    }
    if (nr.status === "PREMIUM_GENERATING") {
      redirect(`/upgrade/${resultId}/generating`);
    }
    const { data: order } = await admin
      .from("premium_orders")
      .select("status")
      .eq("request_id", resultId)
      .maybeSingle();
    if (order?.status === "COMPLETED") {
      redirect(`/upgrade/${resultId}/generating`);
    }
    redirect(`/upgrade/${resultId}/checkout`);
  }

  // 세션 없는 익명 방문자만 이메일(OTP) 인증
  return <UpgradeEmailClient resultId={resultId} />;
}
