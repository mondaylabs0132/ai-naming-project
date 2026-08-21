import { createClient } from "@/lib/supabase/server";
import { clearShareComment } from "@/lib/share/server";

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 한마디 삭제(소유자 전용).
 *
 * 참가자를 지우는 게 아니라 comment만 비운다. 표는 그대로 남는다.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string; participantId: string }> },
) {
  const { token, participantId } = await params;

  if (!TOKEN_RE.test(token) || !UUID_RE.test(participantId)) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const cleared = await clearShareComment(supabase, token, participantId);

  if (!cleared) {
    return Response.json({ error: "찾을 수 없어요." }, { status: 404 });
  }

  return Response.json({ ok: true });
}
