import { createClient } from "@/lib/supabase/server";
import { createShare } from "@/lib/share/server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * 공유 링크 생성.
 *
 * body: { requestId, candidateIds?: string[] | null }
 * candidateIds가 없거나 null이면 "전체 20개" 모드다.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const result = await createShare(
    supabase,
    user.id,
    parsed.requestId,
    parsed.candidateIds,
  );

  if (result.ok) {
    return Response.json(result.share, { status: 201 });
  }

  // 남의 결과인지 없는 결과인지 구분해 알려주지 않는다.
  if (result.code === "NOT_FOUND") {
    return Response.json({ error: "결과를 찾을 수 없어요." }, { status: 404 });
  }

  if (result.code === "INVALID_CANDIDATES") {
    return Response.json(
      { error: "공유할 이름을 다시 골라주세요." },
      { status: 400 },
    );
  }

  return Response.json(
    { error: "공유 링크를 만들지 못했어요." },
    { status: 500 },
  );
}

function parseBody(body: unknown) {
  if (!body || typeof body !== "object") return null;

  const { requestId, candidateIds } = body as Record<string, unknown>;

  if (typeof requestId !== "string" || !UUID_RE.test(requestId)) return null;

  if (candidateIds === undefined || candidateIds === null) {
    return { requestId, candidateIds: null };
  }

  if (
    !Array.isArray(candidateIds) ||
    candidateIds.length === 0 ||
    !candidateIds.every((id) => typeof id === "string" && UUID_RE.test(id))
  ) {
    return null;
  }

  return { requestId, candidateIds: candidateIds as string[] };
}
