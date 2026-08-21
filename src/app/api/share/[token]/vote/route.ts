import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, VISITOR_ID_COOKIE } from "@/lib/free-usage/visitor";
import {
  MAX_COMMENT_LENGTH,
  MAX_VOTER_LABEL_LENGTH,
  MAX_VOTES_PER_VOTER,
  VOTER_LABEL_PRESETS,
} from "@/lib/share/constants";
import { resolveShareToken } from "@/lib/share/public";

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/;
const UNIQUE_VIOLATION = "23505";

/**
 * 투표.
 *
 * 인증이 없는 대신 두 가지로 중복을 막는다.
 * 1) visitor_id 쿠키(proxy.ts가 전 요청에 부여) — share_participants의
 *    unique (share_id, voter_key)가 DB에서 강제한다.
 * 2) 1인 3표 — private.enforce_share_vote_limit 트리거.
 *
 * 쿠키는 지우면 다시 투표할 수 있다. 가족·친구에게 의견을 묻는 용도라
 * 그 이상의 방어(로그인·인증)는 참여율만 떨어뜨린다고 보고 넣지 않았다.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!TOKEN_RE.test(token)) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

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

  const cookieStore = await cookies();
  const voterKey = cookieStore.get(VISITOR_ID_COOKIE)?.value;

  if (!isUuid(voterKey)) {
    return Response.json(
      { error: "브라우저 설정 때문에 투표할 수 없어요. 새로고침해주세요." },
      { status: 400 },
    );
  }

  const share = await resolveShareToken(token);
  if (!share) {
    return Response.json(
      { error: "이미 닫힌 링크예요." },
      { status: 404 },
    );
  }

  const supabase = createAdminClient();

  // 고른 이름이 정말 이 링크에 공개된 후보인지. 공유 범위를 "직접 고르기"로
  // 좁혀놨는데 숨긴 이름에 표가 꽂히면 안 된다.
  let candidateQuery = supabase
    .from("name_candidates")
    .select("id")
    .eq("request_id", share.request_id)
    .in("id", parsed.candidateIds);

  if (share.candidate_ids) {
    candidateQuery = candidateQuery.in("id", share.candidate_ids);
  }

  const { data: allowed, error: candidateError } = await candidateQuery;

  if (candidateError) {
    return Response.json({ error: "투표하지 못했어요." }, { status: 500 });
  }

  if ((allowed?.length ?? 0) !== parsed.candidateIds.length) {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  // 참가자 먼저. unique (share_id, voter_key)가 재투표를 막는다.
  const { data: participant, error: participantError } = await supabase
    .from("share_participants")
    .insert({
      share_id: share.id,
      voter_key: voterKey,
      voter_label: parsed.voterLabel,
      comment: parsed.comment,
    })
    .select("id")
    .single();

  if (participantError || !participant) {
    if (participantError?.code === UNIQUE_VIOLATION) {
      return Response.json(
        { error: "이미 투표하셨어요." },
        { status: 409 },
      );
    }

    return Response.json({ error: "투표하지 못했어요." }, { status: 500 });
  }

  const { error: voteError } = await supabase.from("share_votes").insert(
    parsed.candidateIds.map((id) => ({
      participant_id: participant.id as string,
      name_candidate_id: id,
    })),
  );

  if (voteError) {
    // 표가 하나도 안 들어갔는데 참가자만 남으면, 이 방문자는 unique 제약에
    // 걸려 다시 투표할 수도 없는 상태가 된다. 반드시 되돌린다.
    await supabase.from("share_participants").delete().eq("id", participant.id);

    return Response.json({ error: "투표하지 못했어요." }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}

function parseBody(body: unknown) {
  if (!body || typeof body !== "object") return null;

  const { candidateIds, voterLabel, comment } = body as Record<string, unknown>;

  if (
    !Array.isArray(candidateIds) ||
    candidateIds.length === 0 ||
    candidateIds.length > MAX_VOTES_PER_VOTER ||
    !candidateIds.every((id) => typeof id === "string" && isUuid(id))
  ) {
    return null;
  }

  const uniqueIds = [...new Set(candidateIds as string[])];
  if (uniqueIds.length !== candidateIds.length) return null;

  const label = normalizeText(voterLabel, MAX_VOTER_LABEL_LENGTH);
  if (label === undefined) return null;

  const trimmedComment = normalizeText(comment, MAX_COMMENT_LENGTH);
  if (trimmedComment === undefined) return null;

  // 프리셋이 아니면 직접 입력으로 보고 길이만 본다. 화이트리스트로 묶어두면
  // "이모"·"외할머니" 같은 실제로 쓰고 싶은 표현을 막게 된다.
  if (label !== null && !VOTER_LABEL_PRESETS.includes(label)) {
    if (label.length > MAX_VOTER_LABEL_LENGTH) return null;
  }

  return {
    candidateIds: uniqueIds,
    voterLabel: label,
    comment: trimmedComment,
  };
}

/**
 * 선택 입력 정규화. 값이 없거나 공백뿐이면 null,
 * 길이를 넘거나 타입이 틀리면 undefined(= 거부)를 돌려준다.
 */
function normalizeText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength) return undefined;

  return trimmed;
}
