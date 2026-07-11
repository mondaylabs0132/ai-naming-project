import { notFound, redirect } from "next/navigation";

import ResultPageView from "@/components/result/ResultPageView";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function MyPageResultDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. 인증 — 미로그인 시 로그인 페이지로 (인증 후 이 결과로 복귀)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirectTo=/mypage/results/${id}`);
  }

  // 2. 소유권 — 본인 결과가 아니면 존재를 숨김(404)
  const admin = createAdminClient();
  const { data: nr } = await admin
    .from("naming_requests")
    .select("user_id, status, deleted_at")
    .eq("id", id)
    .maybeSingle();
  if (!nr || nr.deleted_at || nr.status === "DELETED") notFound();
  if (nr.user_id !== user.id) notFound();

  // 3. 준비된 유료 결과만 재열람 가능
  if (nr.status !== "PREMIUM_RESULT_READY") notFound();

  return <ResultPageView requestId={id} userId={user.id} />;
}
