import { notFound, redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "./_components/checkout-client";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ resultId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { resultId } = await params;

  // 1. 인증 — 미로그인 시 이메일 인증(진입점)으로
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/upgrade/${resultId}`);
  }

  // 2. 소유권 — 존재하지 않음/삭제/타인 소유는 차단.
  const admin = createAdminClient();
  const { data: nr } = await admin
    .from("naming_requests")
    .select("user_id, status, deleted_at")
    .eq("id", resultId)
    .maybeSingle();
  if (!nr || nr.deleted_at || nr.status === "DELETED") notFound();
  if (nr.user_id && nr.user_id !== user.id) notFound();

  // 3. 기결제 차단 — 이미 결제한 결과면 결제 페이지 재진입 불가
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

  const sp = await searchParams;

  // confirm A-실패 redirect(?error=)와 Toss failUrl redirect(?code=&message=) 둘 다 수용
  const pick = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const initialErrorCode = pick(sp.error) ?? pick(sp.code) ?? null;
  const initialErrorMessage = pick(sp.message) ?? null;

  return (
    <CheckoutClient
      resultId={resultId}
      initialErrorCode={initialErrorCode}
      initialErrorMessage={initialErrorMessage}
    />
  );
}
