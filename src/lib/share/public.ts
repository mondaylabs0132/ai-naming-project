import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ShareCandidate, SharePage } from "./constants";

/**
 * 공유 페이지(비로그인)가 쓰는 조회 계층.
 *
 * name_candidates의 RLS는 유료 후보를 본인에게만 연다. 비로그인 방문자가
 * 읽어야 하므로 admin 클라이언트를 쓰되, **토큰 검증이 소유권 검사를
 * 대신한다** — 유효하지 않은 토큰이면 아무것도 돌려주지 않는다.
 *
 * 조회 컬럼은 아래 한 줄로 고정한다. select("*")를 쓰면 detail_body·
 * saju_summary·grids까지 그대로 새어나간다.
 *
 * score·sound_score는 **정렬에만** 쓰고 화면으로 내보내지 않는다.
 * 결과 목록(ResultPageView)과 순서를 맞춰야 부모와 투표자가 같은 이름을
 * 같은 자리에서 보게 되는데, 점수 자체가 보이면 투표가 위쪽으로 쏠린다.
 * 무엇이 나가는지는 ShareCandidate 매핑이 결정한다.
 */
const SHARE_CANDIDATE_COLUMNS =
  "id, surname_hangul, given_name_hangul, given_name_hanja, meaning_summary, tags, score, sound_score";

type ShareRow = {
  id: string;
  request_id: string;
  candidate_ids: string[] | null;
};

/**
 * 토큰으로 살아 있는 공유 링크를 찾는다.
 *
 * 닫혔거나(is_active=false), 만료됐거나, 원본 결과가 삭제·강등된 링크는
 * 없는 것으로 취급한다. 호출부가 404로 처리하면 된다.
 */
export async function resolveShareToken(token: string) {
  const supabase = createAdminClient();

  const { data: share } = await supabase
    .from("result_shares")
    .select("id, request_id, candidate_ids")
    .eq("token", token)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<ShareRow>();

  if (!share) return null;

  // 원본 결과가 아직 유효한지. 환불·탈퇴로 결과가 사라졌는데 링크만 살아
  // 있으면 안 된다.
  const { data: namingRequest } = await supabase
    .from("naming_requests")
    .select("status")
    .eq("id", share.request_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!namingRequest || namingRequest.status !== "PREMIUM_RESULT_READY") {
    return null;
  }

  return share;
}

/**
 * 공유 페이지 렌더에 필요한 전부를 한 번에 모은다.
 *
 * @param voterKey 방문자 식별자(visitor_id 쿠키). 이미 투표했는지 판정에 쓴다.
 */
export async function getSharePage(
  token: string,
  voterKey: string | null,
): Promise<SharePage | null> {
  const share = await resolveShareToken(token);
  if (!share) return null;

  const supabase = createAdminClient();

  // 결과 목록(ResultPageView)과 같은 순위 규칙.
  let candidateQuery = supabase
    .from("name_candidates")
    .select(SHARE_CANDIDATE_COLUMNS)
    .eq("request_id", share.request_id)
    .order("score", { ascending: false })
    .order("sound_score", { ascending: false });

  if (share.candidate_ids) {
    candidateQuery = candidateQuery.in("id", share.candidate_ids);
  }

  const [{ data: rows }, { data: participantRows }] = await Promise.all([
    candidateQuery,
    supabase
      .from("share_participants")
      .select("id, voter_key, voter_label, comment, share_votes(name_candidate_id)")
      .eq("share_id", share.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!rows) return null;

  const participants = (participantRows ?? []) as {
    id: string;
    voter_key: string;
    voter_label: string | null;
    comment: string | null;
    share_votes: { name_candidate_id: string }[];
  }[];

  const voteCounts = new Map<string, number>();
  for (const participant of participants) {
    for (const vote of participant.share_votes) {
      voteCounts.set(
        vote.name_candidate_id,
        (voteCounts.get(vote.name_candidate_id) ?? 0) + 1,
      );
    }
  }

  // score·sound_score는 여기서 버린다. 정렬에만 썼고 화면에는 나가지 않는다.
  const candidates: ShareCandidate[] = (
    rows as unknown as {
      id: string;
      surname_hangul: string;
      given_name_hangul: string;
      given_name_hanja: string;
      meaning_summary: string;
      tags: string[] | null;
    }[]
  ).map((row) => ({
    id: row.id,
    fullName: `${row.surname_hangul}${row.given_name_hangul}`,
    hanja: row.given_name_hanja,
    summary: row.meaning_summary,
    tags: row.tags ?? [],
    voteCount: voteCounts.get(row.id) ?? 0,
  }));

  const nameById = new Map(candidates.map((c) => [c.id, c.fullName]));

  return {
    shareId: share.id,
    candidates,
    voterCount: participants.length,
    hasVoted: !!voterKey && participants.some((p) => p.voter_key === voterKey),
    participants: participants.map((participant) => ({
      label: participant.voter_label,
      comment: participant.comment,
      votedNames: participant.share_votes
        .map((vote) => nameById.get(vote.name_candidate_id))
        .filter((name): name is string => !!name),
    })),
  };
}

/** 조회수. 실패해도 페이지는 떠야 하므로 결과를 보지 않는다. */
export async function bumpShareViewCount(shareId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("result_shares")
    .select("view_count")
    .eq("id", shareId)
    .maybeSingle();

  if (!data) return;

  await supabase
    .from("result_shares")
    .update({ view_count: (data.view_count as number) + 1 })
    .eq("id", shareId);
}
