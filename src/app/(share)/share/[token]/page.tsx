import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { isUuid, VISITOR_ID_COOKIE } from "@/lib/free-usage/visitor";
import { bumpShareViewCount, getSharePage } from "@/lib/share/public";
import ShareResultView from "./_components/share-result-view";
import ShareVoteView from "./_components/share-vote-view";

// 아기 이름은 개인정보에 가깝다. 링크를 아는 사람만 보면 되고
// 검색에 잡혀서는 안 된다.
export const metadata: Metadata = {
  title: "아기 이름 고르기 | 첫지음",
  robots: { index: false, follow: false },
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // 이미 투표했는지 판정용. 쿠키가 없어도 페이지는 보여준다
  // (투표하려는 시점에 API가 막는다).
  const cookieStore = await cookies();
  const rawVisitorId = cookieStore.get(VISITOR_ID_COOKIE)?.value;
  const voterKey = isUuid(rawVisitorId) ? rawVisitorId : null;

  const page = await getSharePage(token, voterKey);

  // 없는 토큰·닫힌 링크·만료된 링크·사라진 결과를 전부 404로 합친다.
  if (!page) notFound();

  await bumpShareViewCount(page.shareId);

  if (page.hasVoted) {
    return (
      <ShareResultView
        candidates={page.candidates}
        voterCount={page.voterCount}
        participants={page.participants}
      />
    );
  }

  return (
    <ShareVoteView
      token={token}
      candidates={page.candidates}
      voterCount={page.voterCount}
    />
  );
}
