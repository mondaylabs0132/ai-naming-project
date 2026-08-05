import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { loginRedirect } from "@/lib/auth/redirect";
import InquiryView from "./_components/InquiryView";

export const metadata = { title: "문의하기 | 첫지음" };

export default async function InquiriesPage() {
  // 인증만 서버에서 확정하고, 등록·목록은 클라이언트가 맡는다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginRedirect("/mypage/inquiries"));

  return <InquiryView userId={user.id} />;
}
