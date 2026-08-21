-- 유료 결과 공유·투표.
--
-- 목적: 부모가 유료 결과의 이름 후보를 링크로 공유하고, 링크를 받은 사람이
-- 마음에 드는 이름에 투표(최대 3표)와 한마디를 남긴다.
--
-- 설계 결정 세 가지:
--
-- 1) 링크 키는 naming_requests.id가 아니라 별도 token이다.
--    requestId를 그대로 URL에 쓰면 /mypage/results/[id]와 같은 값이 외부로
--    퍼지고, 한 번 나간 링크를 회수할 방법이 없다. token은 서버가 만들고
--    is_active/expires_at으로 언제든 닫을 수 있다.
--
-- 2) 공개 읽기용 RLS 정책을 만들지 않는다.
--    비로그인 방문자가 유료 후보(name_candidates)를 읽어야 하지만,
--    private.can_read_premium_name_candidate는 본인만 허용한다. 토큰을 RLS로
--    흘려보내는 대신, /share/[token] 서버 컴포넌트가 토큰을 검증한 뒤
--    admin 클라이언트로 조회하고 노출 컬럼을 코드에서 화이트리스트로 고정한다.
--    "소유권 검사 없이 admin 클라이언트 금지" 규칙은 토큰 검증이 대신한다.
--    그래서 아래 세 테이블에는 anon 정책도, anon GRANT도 없다.
--
-- 3) 관계(voter_label)와 한마디(comment)는 표가 아니라 사람에 붙는다.
--    투표는 1인 최대 3표인데 이걸 표마다 들고 있으면 같은 문장이 3행에
--    중복 저장되고, 집계할 때마다 중복 제거를 해야 한다. 참가자를
--    share_participants로 분리하고 표는 그 아래 share_votes에 쌓는다.

-- ────────────────────────────────────────────────────────────
-- 1. result_shares — 공유 링크 한 건
-- ────────────────────────────────────────────────────────────

create table if not exists public.result_shares (
  id uuid primary key default gen_random_uuid(),

  request_id uuid not null references public.naming_requests (id) on delete cascade,
  -- 소유자. 링크를 닫거나 집계를 보는 권한의 기준이다.
  user_id    uuid not null references public.users (id) on delete cascade,

  -- URL에 들어가는 추측 불가능한 키. 서버(crypto)가 만든다.
  token text not null unique,

  -- 공유할 이름 후보. null이면 요청의 이름 20개 전체를 뜻한다.
  -- 화면의 "전체 20개" / "직접 고르기" 두 모드가 각각 null / 배열에 대응하며,
  -- 별도 모드 컬럼은 두지 않는다.
  candidate_ids uuid[],

  is_active  boolean     not null default true,
  -- 아기 이름은 개인정보에 가까워 무기한 공개는 위험하다. 기본 30일.
  expires_at timestamptz not null default now() + interval '30 days',
  -- 조회수. 지금은 화면에 쓰지 않는다 — "몇 번 열렸는지"는 새로고침·본인
  -- 확인까지 세어서 "몇 명이 봤는지"로 읽히고, 투표 수와 나란히 놓이면
  -- 오히려 헷갈린다. 고유 방문자 집계로 바꿀 때 다시 쓸 수 있게 남겨둔다.
  view_count integer     not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,

  -- URL-safe 문자만. 서버 생성값이지만 형식을 DB에서도 고정해 둔다.
  constraint result_shares_token_format_check
    check (token ~ '^[A-Za-z0-9_-]{16,64}$'),
  -- 이름 후보는 요청당 20개 고정(name_candidates.sort_order CHECK와 묶여 있다).
  constraint result_shares_candidate_ids_check
    check (
      candidate_ids is null
      or (array_length(candidate_ids, 1) between 1 and 20)
    ),
  constraint result_shares_view_count_check check (view_count >= 0)
);

-- 한 결과에 살아 있는 링크는 하나만. "링크 복사"·"공유 중지"가 어떤 링크를
-- 가리키는지 모호해지지 않는다. 닫힌 링크는 기록으로 남는다.
create unique index if not exists result_shares_one_active_per_request_idx
  on public.result_shares (request_id)
  where is_active;

-- 마이페이지에서 "내 공유 링크"를 최신순으로 읽는 조회 패턴
create index if not exists result_shares_user_id_created_at_idx
  on public.result_shares (user_id, created_at desc);

create or replace trigger set_result_shares_updated_at
  before update on public.result_shares
  for each row
  execute function public.set_current_timestamp_updated_at();

-- ────────────────────────────────────────────────────────────
-- 2. share_participants — 링크에 투표한 사람 한 명
-- ────────────────────────────────────────────────────────────

create table if not exists public.share_participants (
  id uuid primary key default gen_random_uuid(),

  share_id uuid not null references public.result_shares (id) on delete cascade,

  -- proxy.ts가 전 요청에 부여하는 visitor_id 쿠키. 중복 투표를 막는 기준이며
  -- 위조 가능하므로 IP 해시(FREE_TRIAL_IP_PEPPER) 제한과 함께 쓴다.
  voter_key text not null,

  -- 화면에 "친척", "친구"처럼 표시되는 관계. 프리셋 4종과 직접 입력을 함께
  -- 받으므로 CHECK로 값을 묶지 않고 길이만 제한한다. 프리셋 여부는 서버가
  -- 화이트리스트로 검증한다.
  voter_label text,
  -- 한마디. 화면 카운터(80자)와 같은 기준.
  comment     text,

  created_at timestamptz not null default now(),

  constraint share_participants_unique_voter unique (share_id, voter_key),
  constraint share_participants_voter_key_length_check
    check (char_length(voter_key) between 8 and 64),
  constraint share_participants_voter_label_length_check
    check (voter_label is null or char_length(voter_label) between 1 and 12),
  constraint share_participants_comment_length_check
    check (comment is null or char_length(comment) between 1 and 80)
);

-- 집계 화면이 참가자를 최신순으로 읽는 조회 패턴
create index if not exists share_participants_share_id_created_at_idx
  on public.share_participants (share_id, created_at desc);

-- ────────────────────────────────────────────────────────────
-- 3. share_votes — 참가자가 이름 하나에 던진 표
-- ────────────────────────────────────────────────────────────

create table if not exists public.share_votes (
  id uuid primary key default gen_random_uuid(),

  participant_id    uuid not null references public.share_participants (id) on delete cascade,
  name_candidate_id uuid not null references public.name_candidates (id) on delete cascade,

  created_at timestamptz not null default now(),

  constraint share_votes_unique_choice unique (participant_id, name_candidate_id)
);

create index if not exists share_votes_participant_id_idx
  on public.share_votes (participant_id);
-- 이름별 득표 집계
create index if not exists share_votes_name_candidate_id_idx
  on public.share_votes (name_candidate_id);

-- 1인 최대 3표.
-- 서버에서도 검사하지만, 표 제한이 API 한 곳에만 있으면 조용히 무너진다.
-- 서로 다른 트랜잭션이 동시에 통과할 여지는 남지만(한 표 초과), 표 하나가
-- 더 들어가는 것 자체는 무해해서 잠금까지는 걸지 않는다.
--
-- private 스키마에 두는 이유: public에 있으면 PostgREST가
-- /rest/v1/rpc/enforce_share_vote_limit으로 노출한다. 트리거 함수라 직접
-- 호출은 Postgres가 거부하지만, SECURITY DEFINER 함수의 노출면을 남길
-- 이유가 없다(보안 린터 0028/0029).
create or replace function private.enforce_share_vote_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  vote_count integer;
begin
  select count(*) into vote_count
  from public.share_votes
  where participant_id = new.participant_id;

  if vote_count >= 3 then
    raise exception 'share_votes limit exceeded: max 3 per participant'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create or replace trigger enforce_share_vote_limit_trigger
  before insert on public.share_votes
  for each row
  execute function private.enforce_share_vote_limit();

-- ────────────────────────────────────────────────────────────
-- 4. GRANT
--
-- 이 프로젝트는 새 테이블에 기본 권한이 붙지 않는다. service_role조차
-- 명시하지 않으면 조용히 막힌다(refunds에서 실제로 겪은 실패).
--
-- 투표는 전부 비로그인 방문자가 하고 서버가 토큰을 검증한 뒤 대신 쓰므로,
-- share_participants·share_votes의 쓰기 권한은 service_role에만 준다.
-- anon에는 어떤 GRANT도 주지 않는다.
-- ────────────────────────────────────────────────────────────

grant select, insert, update, delete on public.result_shares      to service_role;
grant select, insert, update, delete on public.share_participants to service_role;
grant select, insert, update, delete on public.share_votes        to service_role;

-- 소유자는 자기 링크를 만들고 닫고, 집계를 읽는다.
grant select, insert, update on public.result_shares      to authenticated;
grant select                 on public.share_participants to authenticated;
grant select                 on public.share_votes        to authenticated;

-- 부적절한 한마디를 소유자가 지울 수 있어야 한다. 참가자 행을 지우면 표까지
-- 사라지므로, 컬럼 단위 GRANT로 comment만 비울 수 있게 한다.
grant update (comment) on public.share_participants to authenticated;

-- ────────────────────────────────────────────────────────────
-- 5. RLS
-- ────────────────────────────────────────────────────────────

-- 자식 테이블 정책이 result_shares를 참조해야 하는데, RLS가 걸린 테이블을
-- 정책 안에서 그냥 조회하면 정책이 다시 평가된다. private 헬퍼로 감싼다.
create or replace function private.owns_result_share(target_share_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  select exists (
    select 1
    from public.result_shares s
    where s.id = target_share_id
      and s.user_id = auth.uid()
  );
$$;

alter table public.result_shares      enable row level security;
alter table public.share_participants enable row level security;
alter table public.share_votes        enable row level security;

create policy "authenticated can read own result shares"
  on public.result_shares
  for select
  to authenticated
  using (user_id = auth.uid());

-- 본인 명의로, 본인 소유의 결과에만 링크를 만들 수 있다.
create policy "authenticated can create own result shares"
  on public.result_shares
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.naming_requests nr
      where nr.id = request_id
        and nr.user_id = auth.uid()
        and nr.status = 'PREMIUM_RESULT_READY'
        and nr.deleted_at is null
    )
  );

-- 공유 중지. UPDATE GRANT가 전체 컬럼에 열려 있어 expires_at을 늘릴 수도
-- 있지만, 자기 링크의 만료를 자기가 미루는 것이라 문제되지 않는다.
create policy "authenticated can update own result shares"
  on public.result_shares
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "authenticated can read own share participants"
  on public.share_participants
  for select
  to authenticated
  using (private.owns_result_share(share_id));

-- comment만 GRANT돼 있으므로 이 정책으로 열리는 것은 한마디 삭제·수정뿐이다.
create policy "authenticated can moderate own share comments"
  on public.share_participants
  for update
  to authenticated
  using (private.owns_result_share(share_id))
  with check (private.owns_result_share(share_id));

create policy "authenticated can read own share votes"
  on public.share_votes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.share_participants p
      where p.id = participant_id
        and private.owns_result_share(p.share_id)
    )
  );
