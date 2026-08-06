-- AI 생성 실패 감지와 환불에 필요한 컬럼을 추가한다.
--
-- 배경: 유료 결제 후 생성이 실패하면 돈만 받고 결과를 못 주는 상태로 방치됐다.
-- 실패를 감지할 근거(언제 시작했는지, 몇 번 시도했는지)가 없었고,
-- 환불 결과를 기록할 자리도 없었다.

-- ── 1. 생성 진행 추적 ────────────────────────────────────────────
-- generation_started_at은 리퍼(reap_stuck_generations)가 "이 건이 멈췄는지"를
-- 판단하는 유일한 근거다. 유료 생성 라우트가 긴 작업 전에 찍는다.
alter table public.naming_requests
  add column if not exists generation_started_at     timestamptz,
  add column if not exists generation_attempts       integer not null default 0,
  add column if not exists generation_failure_reason text;

-- 리퍼가 매분 훑는 조회 패턴. PREMIUM_GENERATING은 소수라 부분 인덱스로 충분하다.
create index if not exists naming_requests_stuck_generation_idx
  on public.naming_requests (generation_started_at)
  where status = 'PREMIUM_GENERATING';

-- ── 2. 환불 기록 ─────────────────────────────────────────────────
-- premium_orders.status는 이미 'REFUNDED'를 허용한다(코드가 안 쓰고 있었을 뿐).
-- 얼마를 왜 돌려줬는지는 남길 자리가 없어 추가한다.
alter table public.premium_orders
  add column if not exists refunded_at   timestamptz,
  add column if not exists refund_amount integer,
  add column if not exists refund_reason text;

-- 토스 취소 응답 원본. 분쟁이 생기면 이게 유일한 증거다.
alter table public.payment_attempts
  add column if not exists canceled_at     timestamptz,
  add column if not exists cancel_response jsonb;

-- payment_attempts는 REFUNDED를 아직 허용하지 않는다.
-- (CANCELED는 '결제가 성립하지 않음', REFUNDED는 '성립한 결제를 되돌림'으로 구분한다)
alter table public.payment_attempts
  drop constraint if exists payment_attempts_status_check;
alter table public.payment_attempts
  add constraint payment_attempts_status_check
  check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED', 'REFUNDED'));
