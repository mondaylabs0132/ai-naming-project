import { notFound, redirect } from "next/navigation";

import Footer from "@/components/layout/footer";
import ResultPageView from "@/components/result/ResultPageView";
import { createClient } from "@/lib/supabase/server";
import { loginRedirect } from "@/lib/auth/redirect";

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
    redirect(loginRedirect(`/mypage/results/${id}`));
  }

  // 2. 소유권 — 본인 결과가 아니면 존재를 숨김(404)
  const { data: nr } = await supabase
    .from("naming_requests")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  // 3. 준비된 유료 결과만 재열람 가능
  if (!nr || nr.status !== "PREMIUM_RESULT_READY") notFound();

  return (
    <>
      <ResultPageView
        requestId={id}
        userId={user.id}
        detailBasePath={`/mypage/results/${id}/detail`}
        shareEnabled
      />
      <Footer />
    </>
  );
}
