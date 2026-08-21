import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createShareToken } from "./token";

/** 이름 후보는 요청당 20개 고정 — name_candidates.sort_order CHECK와 묶여 있다. */
const MAX_CANDIDATES = 20;

/** 부분 유니크 인덱스(result_shares_one_active_per_request_idx) 충돌 코드 */
const UNIQUE_VIOLATION = "23505";

export type ShareLink = {
  token: string;
  url: string;
  expiresAt: string;
  /** null이면 요청의 이름 전체를 공유한다는 뜻 */
  candidateIds: string[] | null;
};

export type ShareResult =
  | { ok: true; share: ShareLink }
  // 남의 결과이거나, 없거나, 아직 유료 결과가 준비되지 않은 요청.
  // 존재 여부를 흘리지 않도록 셋을 한 코드로 합친다.
  | { ok: false; code: "NOT_FOUND" }
  | { ok: false; code: "INVALID_CANDIDATES" }
  | { ok: false; code: "FAILED" };

const SHARE_COLUMNS = "token, expires_at, candidate_ids";

type ShareRow = {
  token: string;
  expires_at: string;
  candidate_ids: string[] | null;
};

export function shareUrl(token: string) {
  return `${process.env.APP_ORIGIN}/share/${token}`;
}

function toShareLink(row: ShareRow): ShareLink {
  return {
    token: row.token,
    url: shareUrl(row.token),
    expiresAt: row.expires_at,
    candidateIds: row.candidate_ids,
  };
}

/**
 * 후보 목록을 비교 가능한 형태로 정규화한다.
 * 순서·중복만 다른 두 요청이 링크를 새로 만들지 않도록 정렬 + 중복 제거.
 */
function normalizeCandidateIds(ids: string[] | null | undefined) {
  if (!ids || ids.length === 0) return null;

  return [...new Set(ids)].sort();
}

function sameCandidateIds(a: string[] | null, b: string[] | null) {
  if (a === null || b === null) return a === b;
  if (a.length !== b.length) return false;

  return a.every((id, i) => id === b[i]);
}

/**
 * 공유 링크를 만든다. 이미 살아 있는 링크가 있으면 그걸 재사용한다.
 *
 * 한 결과에 활성 링크는 하나뿐이라(부분 유니크 인덱스), "링크 만들고
 * 공유하기"를 여러 번 눌러도 링크가 늘어나지 않는다. 공유 범위만 바뀌었으면
 * 기존 링크의 candidate_ids를 갱신한다 — 이미 지인에게 보낸 링크가 살아 있는
 * 편이 새 링크를 발급해 예전 링크를 죽이는 것보다 낫다.
 *
 * @param supabase 세션 클라이언트. 소유권 검사는 RLS가 담당하므로
 *   admin 클라이언트를 넘기면 안 된다.
 */
export async function createShare(
  supabase: SupabaseClient,
  userId: string,
  requestId: string,
  rawCandidateIds: string[] | null | undefined,
): Promise<ShareResult> {
  const candidateIds = normalizeCandidateIds(rawCandidateIds);

  if (candidateIds && candidateIds.length > MAX_CANDIDATES) {
    return { ok: false, code: "INVALID_CANDIDATES" };
  }

  // 1. 소유권 + 상태. RLS가 본인·미삭제 행만 보여주므로 여기서는 상태만 본다.
  const { data: namingRequest } = await supabase
    .from("naming_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();

  if (!namingRequest || namingRequest.status !== "PREMIUM_RESULT_READY") {
    return { ok: false, code: "NOT_FOUND" };
  }

  // 2. 고른 후보가 정말 이 요청의 것인지. 남의 요청 후보를 섞어 보내면
  //    공유 페이지가 그대로 노출해 버린다.
  if (candidateIds) {
    const { data: owned, error } = await supabase
      .from("name_candidates")
      .select("id")
      .eq("request_id", requestId)
      .in("id", candidateIds);

    if (error) return { ok: false, code: "FAILED" };
    if ((owned?.length ?? 0) !== candidateIds.length) {
      return { ok: false, code: "INVALID_CANDIDATES" };
    }
  }

  // 3. 이미 살아 있는 링크가 있으면 재사용하거나 범위만 갱신한다.
  const existing = await findActiveShare(supabase, requestId);

  if (existing) {
    if (sameCandidateIds(existing.candidate_ids, candidateIds)) {
      return { ok: true, share: toShareLink(existing) };
    }

    const { data, error } = await supabase
      .from("result_shares")
      .update({ candidate_ids: candidateIds })
      .eq("token", existing.token)
      .select(SHARE_COLUMNS)
      .single<ShareRow>();

    if (error || !data) return { ok: false, code: "FAILED" };

    return { ok: true, share: toShareLink(data) };
  }

  // 4. 새 링크.
  const { data, error } = await supabase
    .from("result_shares")
    .insert({
      request_id: requestId,
      user_id: userId,
      token: createShareToken(),
      candidate_ids: candidateIds,
    })
    .select(SHARE_COLUMNS)
    .single<ShareRow>();

  if (data) return { ok: true, share: toShareLink(data) };

  // 두 탭에서 동시에 눌러 부분 유니크 인덱스에 걸린 경우.
  // 먼저 만들어진 링크를 그대로 돌려주면 사용자에겐 아무 일도 없다.
  if (error?.code === UNIQUE_VIOLATION) {
    const winner = await findActiveShare(supabase, requestId);
    if (winner) return { ok: true, share: toShareLink(winner) };
  }

  return { ok: false, code: "FAILED" };
}

async function findActiveShare(supabase: SupabaseClient, requestId: string) {
  const { data } = await supabase
    .from("result_shares")
    .select(SHARE_COLUMNS)
    .eq("request_id", requestId)
    .eq("is_active", true)
    .maybeSingle<ShareRow>();

  return data;
}

/**
 * 공유 중지. 링크를 회수하는 유일한 수단이다.
 *
 * 행을 지우지 않고 is_active만 내린다. 투표 기록(share_participants·
 * share_votes)이 cascade로 함께 사라지면 안 되기 때문이다.
 */
export async function revokeShare(
  supabase: SupabaseClient,
  token: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("result_shares")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("token", token)
    .eq("is_active", true)
    .select("token")
    .maybeSingle();

  return !!data;
}
