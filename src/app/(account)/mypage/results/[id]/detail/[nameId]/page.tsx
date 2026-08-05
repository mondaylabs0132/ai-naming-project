import { notFound, redirect } from "next/navigation";

import ResultDetailView from "@/components/result/ResultDetailView";
import { fetchNameDetail } from "@/lib/result/name-detail";
import { createClient } from "@/lib/supabase/server";
import { loginRedirect } from "@/lib/auth/redirect";

export default async function MyPageNameDetailPage({
  params,
}: {
  params: Promise<{ id: string; nameId: string }>;
}) {
  const { id, nameId } = await params;

  // 1. 인증 — 미로그인 시 로그인 페이지로 (인증 후 이 이름으로 복귀)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(loginRedirect(`/mypage/results/${id}/detail/${nameId}`));
  }

  // 2. 소유권 — 본인 결과가 아니면 존재를 숨김(404)
  const { data: nr } = await supabase
    .from("naming_requests")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  // 3. 준비된 유료 결과만 재열람 가능
  if (!nr || nr.status !== "PREMIUM_RESULT_READY") notFound();

  // 4. 이름 상세 — 이 결과에 속한 이름이 아니면 존재를 숨김(404)
  const detail = await fetchNameDetail(supabase, id, nameId);
  if (!detail) notFound();

  return <ResultDetailView detail={detail} userId={user.id} />;
}
