import { createClient } from "@/lib/supabase/server";
import { revokeShare } from "@/lib/share/server";

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * 공유 중지.
 *
 * 소유권 검사는 result_shares의 UPDATE 정책(user_id = auth.uid())이 담당한다.
 * 남의 토큰으로 부르면 갱신되는 행이 0건이라 404가 된다.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!TOKEN_RE.test(token)) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const revoked = await revokeShare(supabase, token);

  if (!revoked) {
    // 이미 닫혔거나, 없거나, 남의 링크. 셋을 구분해 알려주지 않는다.
    return Response.json(
      { error: "공유 링크를 찾을 수 없어요." },
      { status: 404 },
    );
  }

  return Response.json({ ok: true });
}
