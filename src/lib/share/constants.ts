/**
 * 공유·투표의 상수와 타입.
 *
 * 서버(`public.ts`)와 클라이언트 컴포넌트가 함께 쓰기 때문에 여기에는
 * **server-only 의존이 들어오면 안 된다.** public.ts에 두면 admin 클라이언트가
 * 클라이언트 번들로 딸려 들어가 빌드가 깨진다(실제로 한 번 깨뜨렸다).
 */

/** 1인이 던질 수 있는 최대 표 수. DB 트리거(private.enforce_share_vote_limit)와 같은 값. */
export const MAX_VOTES_PER_VOTER = 3;

/** 관계 프리셋. 이 외의 값은 "직접 입력"으로 보고 길이만 검사한다. */
export const VOTER_LABEL_PRESETS = ["가족", "친척", "친구", "직장 동료"];

/** share_participants_voter_label_length_check와 같은 값 */
export const MAX_VOTER_LABEL_LENGTH = 12;
/** share_participants_comment_length_check와 같은 값 */
export const MAX_COMMENT_LENGTH = 80;

export type ShareCandidate = {
  id: string;
  /** 성 + 이름. 카드에 이미 성이 붙어 나오므로 성은 숨기지 않는다. */
  fullName: string;
  hanja: string;
  summary: string;
  tags: string[];
  /** 집계 화면에서만 의미가 있다. */
  voteCount: number;
};

export type ShareParticipant = {
  label: string | null;
  comment: string | null;
  votedNames: string[];
};

export type SharePage = {
  shareId: string;
  candidates: ShareCandidate[];
  /** 지금까지 투표한 사람 수 */
  voterCount: number;
  /** 이 방문자가 이미 투표했는지 — 투표 전에는 집계를 보여주지 않는다. */
  hasVoted: boolean;
  participants: ShareParticipant[];
};
