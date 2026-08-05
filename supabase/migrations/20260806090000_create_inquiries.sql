-- 마이페이지 문의하기: 로그인 사용자가 남긴 문의를 보관한다.
-- 답변은 운영자가 service role로 처리하므로 사용자에게는 UPDATE/DELETE 권한을 주지 않는다.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,

  category text not null default 'ETC',
  message text not null,

  status text not null default 'RECEIVED',
  -- 답변은 메일이 아니라 이 컬럼으로 전달한다. 운영자가 service role로 채우면
  -- 사용자 문의 내역에 그대로 노출된다.
  -- 회신 주소가 필요하면 user_id로 users.email을 조인한다(중복 보관하지 않음).
  answer text,
  answered_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint inquiries_category_check
    check (category in ('PAYMENT', 'RESULT', 'ACCOUNT', 'ETC')),
  constraint inquiries_status_check
    check (status in ('RECEIVED', 'IN_PROGRESS', 'ANSWERED')),
  -- 빈 문의와 과도한 길이를 DB에서 막는다. 화면 검증과 같은 기준.
  constraint inquiries_message_length_check
    check (char_length(message) between 10 and 2000)
);

-- 내 문의 목록을 최신순으로 읽는 유일한 조회 패턴
create index if not exists inquiries_user_id_created_at_idx
  on public.inquiries (user_id, created_at desc);

create or replace trigger set_inquiries_updated_at
  before update on public.inquiries
  for each row
  execute function public.set_current_timestamp_updated_at();

-- RLS 정책은 "어떤 행을 볼지"만 정한다. 테이블 접근 자체는 GRANT가 필요하며
-- 이게 없으면 정책이 맞아도 permission denied(42501)로 막힌다.
-- 수정·삭제는 운영자(service role)만 하므로 select/insert만 준다.
grant select, insert on public.inquiries to authenticated;

alter table public.inquiries enable row level security;

-- 본인 문의만 조회
create policy "authenticated can read own inquiries"
  on public.inquiries
  for select
  to authenticated
  using (user_id = auth.uid());

-- 본인 명의로만 등록. status/answered_at은 기본값으로만 들어가고
-- 사용자가 UPDATE할 수 없으므로 임의로 '답변완료'를 만들 수 없다.
create policy "authenticated can create own inquiries"
  on public.inquiries
  for insert
  to authenticated
  with check (user_id = auth.uid());
