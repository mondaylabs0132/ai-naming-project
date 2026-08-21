import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ShareTally } from "./constants";
import { shareUrl } from "./server";

/**
 * 소유자가 보는 집계.
 *
 * 전부 **세션 클라이언트**로 읽는다. result_shares는 user_id = auth.uid(),
 * share_participants·share_votes는 private.owns_result_share로 묶여 있어
 * RLS가 소유권 검사를 대신한다 — 여기서 admin 클라이언트를 쓰면 남의 결과
 * 집계가 그대로 새어나간다.
 *
 * 살아 있는 링크가 없으면 null. 마이페이지는 그때 집계 카드를 그리지 않는다.
 */
export async function getShareTally(
  supabase: SupabaseClient,
  requestId: string,
): Promise<ShareTally | null> {
  const { data: share } = await supabase
    .from("result_shares")
    .select("id, token, expires_at, candidate_ids")
    .eq("request_id", requestId)
    .eq("is_active", true)
    .maybeSingle<{
      id: string;
      token: string;
      expires_at: string;
      candidate_ids: string[] | null;
    }>();

  if (!share) return null;

  const { data: participantRows } = await supabase
    .from("share_participants")
    .select("id, voter_label, comment, share_votes(name_candidate_id)")
    .eq("share_id", share.id)
    .order("created_at", { ascending: false });

  const participants = (participantRows ?? []) as {
    id: string;
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

  // 표를 받은 이름만 조회한다. 목록 전체를 다시 읽을 이유가 없다.
  const votedIds = [...voteCounts.keys()];
  const nameById = new Map<string, string>();

  if (votedIds.length > 0) {
    const { data: rows } = await supabase
      .from("name_candidates")
      .select("id, given_name_hangul")
      .eq("request_id", requestId)
      .in("id", votedIds);

    for (const row of rows ?? []) {
      nameById.set(row.id as string, row.given_name_hangul as string);
    }
  }

  const ranking = votedIds
    .map((candidateId) => ({
      candidateId,
      name: nameById.get(candidateId) ?? "",
      voteCount: voteCounts.get(candidateId) ?? 0,
    }))
    .filter((item) => item.name)
    .sort(
      (a, b) => b.voteCount - a.voteCount || a.name.localeCompare(b.name, "ko"),
    );

  return {
    token: share.token,
    url: shareUrl(share.token),
    expiresAt: share.expires_at,
    candidateIds: share.candidate_ids,
    voterCount: participants.length,
    ranking,
    comments: participants
      .filter((participant) => !!participant.comment)
      .map((participant) => ({
        participantId: participant.id,
        label: participant.voter_label,
        comment: participant.comment as string,
        votedNames: participant.share_votes
          .map((vote) => nameById.get(vote.name_candidate_id))
          .filter((name): name is string => !!name),
      })),
  };
}
