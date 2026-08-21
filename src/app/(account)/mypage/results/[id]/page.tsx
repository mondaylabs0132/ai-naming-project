import { notFound, redirect } from "next/navigation";

import Footer from "@/components/layout/footer";
import ResultPageView from "@/components/result/ResultPageView";
import { createClient } from "@/lib/supabase/server";
import { loginRedirect } from "@/lib/auth/redirect";
import { getShareTally } from "@/lib/share/owner";

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

  // 4. 공유 중이면 집계를 함께 넘긴다. 세션 클라이언트로 읽으므로 소유권은
  //    RLS가 본다. 링크가 없으면 null이고, 그때만 공유 시작 버튼이 보인다.
  const shareTally = await getShareTally(supabase, id);

  return (
    <>
      <ResultPageView
        requestId={id}
        userId={user.id}
        detailBasePath={`/mypage/results/${id}/detail`}
        shareEnabled
        shareTally={shareTally}
      />
      <Footer />
    </>
  );
}
