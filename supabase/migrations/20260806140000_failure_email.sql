-- 생성 실패 안내 메일을 결과 완료 메일과 같은 경로로 보낸다.
--
-- 배경: 결제 후 페이지를 떠난 사용자에게 닿을 수단이 메일뿐이다. 지금까지는
-- 성공했을 때만 보냈으므로, 자동 환불이 일어나도 사용자는 아무것도 알 수 없었다.

-- ── 1. 발송 종류 구분 ────────────────────────────────────────────
-- 지금은 request_id와 premium_order_id에 각각 UNIQUE가 걸려 있어 요청당 메일이
-- 딱 1통이다. 실패 메일을 보내고 나면 재구매 후 성공 메일이 막히므로,
-- 종류를 붙여 (요청, 종류)당 1통으로 바꾼다.
alter table public.premium_email_deliveries
  add column if not exists kind text not null default 'RESULT_READY';

alter table public.premium_email_deliveries
  drop constraint if exists premium_email_deliveries_kind_check;
alter table public.premium_email_deliveries
  add constraint premium_email_deliveries_kind_check
  check (kind in ('RESULT_READY', 'GENERATION_FAILED'));

alter table public.premium_email_deliveries
  drop constraint if exists premium_email_deliveries_request_id_key;
alter table public.premium_email_deliveries
  drop constraint if exists premium_email_deliveries_premium_order_id_key;

-- 멱등성의 근거가 이 UNIQUE다. Edge Function은 INSERT가 23505로 튕기는 것을
-- "이미 보냈음"으로 해석하므로, 이 제약이 없으면 메일이 중복 발송된다.
alter table public.premium_email_deliveries
  add constraint premium_email_deliveries_request_id_kind_key
  unique (request_id, kind);
alter table public.premium_email_deliveries
  add constraint premium_email_deliveries_order_id_kind_key
  unique (premium_order_id, kind);

-- ── 2. 트리거가 실패 전이도 태우도록 확장 ────────────────────────
-- FAILED는 리퍼가 재시도를 소진했을 때만 찍히는 최종 상태라 메일 1통과 짝이 맞는다.
create or replace trigger email_trigger
  after update on public.naming_requests
  for each row
  when (
    new.status in ('PREMIUM_RESULT_READY', 'FAILED')
    and old.status is distinct from new.status
  )
  execute function private.call_premium_email_webhook();
