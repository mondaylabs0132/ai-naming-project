import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import BookmarkListView from "./_components/BookmarkListView";

export const metadata = { title: "보관함 | 첫지음" };

export default async function BookmarksPage() {
  // 인증만 서버에서 확정하고, 목록 조회·저장 해제는 클라이언트 뷰가 맡는다.
  // (마이페이지 결과 재열람 화면과 같은 구조)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/bookmarks");

  return <BookmarkListView userId={user.id} />;
}
