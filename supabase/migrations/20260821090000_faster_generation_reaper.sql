-- 리퍼의 회수 속도를 20분 → 3분으로 줄이고, 환불 재시도 패스를 추가한다.
--
-- 배경: 예전 리퍼는 "5분 정체 → 재시도"를 3회 반복한 뒤에야 실패를 확정했다.
-- 정체 판정이 5분이나 걸린 이유는 진행 중인 생성(1~2분)과 죽은 생성을 구분할
-- 방법이 generation_started_at 하나뿐이었기 때문이다.
--
-- 이제 두 가지가 바뀌었다.
--   ① 생성 라우트가 30초마다 generation_started_at을 갱신한다(하트비트).
--      "진행 중"과 "죽음"이 구분되므로 정체 판정을 90초까지 당길 수 있다.
--   ② 라우트가 스스로 감지한 실패는 그 자리에서 확정하고 환불한다.
--      따라서 리퍼의 재시도는 "라우트가 판정조차 못 내리고 죽은 경우"만 겨냥하면
--      되고, 그런 건에 같은 호출을 세 번 반복할 이유가 없다 → 1회로 줄인다.
--
-- 최악 소요: 90초(정체 감지) → 재시도 → 90초 → 실패 확정 + 환불 ≈ 3분.
--
-- ⚠ 배포 순서: 반드시 **앱을 먼저 배포**한 뒤 이 마이그레이션을 적용할 것.
--   순서가 뒤집히면 하트비트가 없는 상태에서 정체 기준만 90초로 좁혀져,
--   정상 진행 중인 생성을 죽은 것으로 오인해 중복 실행한다.

create or replace function public.reap_stuck_generations()
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  -- 하트비트가 30초 간격이라 90초면 세 번 연속 놓친 것이다. 정상 진행 중인
  -- 건이 여기 걸릴 일은 없다.
  stale_after  constant interval := interval '90 seconds';
  -- 라우트가 무응답일 때 한 번만 더 깨워 본다. 그래도 조용하면 환불한다.
  max_attempts constant integer  := 1;
  -- 환불이 끊긴 건을 다시 주울 기간. 이 창을 넘기면 사람이 볼 몫이다.
  refund_retry_window constant interval := interval '24 hours';
  -- 실패 확정 직후는 건드리지 않는다. 라우트가 스스로 환불을 끝내는 중일 수도,
  -- 사용자가 막 재결제해 completeOrder가 상태를 바꾸는 중일 수도 있다.
  refund_retry_delay  constant interval := interval '2 minutes';

  app_origin text;
  job_secret text;
  r          record;
  dispatched integer := 0;
begin
  select decrypted_secret into app_origin
    from vault.decrypted_secrets where name = 'app_origin' limit 1;
  select decrypted_secret into job_secret
    from vault.decrypted_secrets where name = 'internal_job_secret' limit 1;

  if app_origin is null or app_origin = '' or job_secret is null or job_secret = '' then
    raise exception 'app_origin / internal_job_secret is not configured in vault';
  end if;

  -- ① 재시도 여유가 남은 건 → 생성 API를 다시 깨운다.
  --    generation_started_at을 지금으로 밀어야 다음 분에 또 잡히지 않는다.
  for r in
    with bumped as (
      update public.naming_requests
         set generation_attempts   = generation_attempts + 1,
             generation_started_at = now()
       where status = 'PREMIUM_GENERATING'
         -- 트리거 호출이 아예 닿지 못해 started_at이 비었을 수 있다.
         and coalesce(generation_started_at, paid_at) < now() - stale_after
         and generation_attempts < max_attempts
      returning id, generation_attempts
    )
    select * from bumped
  loop
    perform net.http_post(
      url     := app_origin || '/api/naming/' || r.id::text || '/premium',
      body    := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-job-secret', job_secret
      ),
      timeout_milliseconds := 5000
    );
    dispatched := dispatched + 1;
  end loop;

  -- ② 재시도를 소진한 건 → 앱에 실패 확정과 환불을 맡긴다.
  --    앱이 status를 FAILED로 바꾸면 이 조회에서 빠지므로 반복 호출되지 않는다.
  --    (앱 호출 자체가 실패하면 다음 분에 다시 시도한다 — 의도된 동작)
  for r in
    select id from public.naming_requests
     where status = 'PREMIUM_GENERATING'
       and coalesce(generation_started_at, paid_at) < now() - stale_after
       and generation_attempts >= max_attempts
  loop
    perform net.http_post(
      url     := app_origin || '/api/internal/generation-failed',
      body    := jsonb_build_object('requestId', r.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-job-secret', job_secret
      ),
      timeout_milliseconds := 5000
    );
    dispatched := dispatched + 1;
  end loop;

  -- ③ 실패로 확정됐는데 결제가 그대로 남은 건 → 환불만 다시 시도한다.
  --
  --    자동 환불이 토스 장애·네트워크 오류로 한 번 끊기면 예전에는 거기서
  --    끝이었다. status가 이미 FAILED라 ②의 조회에 걸리지 않았고, 사용자가
  --    실패 화면의 환불 버튼을 누르지 않는 한 돈이 그대로 남았다.
  --    환불은 멱등하므로(주문 id를 토스 멱등키로 사용) 중복 호출도 안전하다.
  for r in
    select nr.id
      from public.naming_requests nr
      join public.premium_orders po on po.request_id = nr.id
     where nr.status = 'FAILED'
       and po.status = 'COMPLETED'
       and nr.updated_at > now() - refund_retry_window
       -- 재결제 직후의 찰나(주문 COMPLETED ↔ 요청 PREMIUM_GENERATING 사이)에
       -- 걸려 방금 받은 돈을 도로 환불하는 일을 막는다.
       and nr.updated_at < now() - refund_retry_delay
  loop
    perform net.http_post(
      url     := app_origin || '/api/internal/generation-failed',
      body    := jsonb_build_object('requestId', r.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-job-secret', job_secret
      ),
      timeout_milliseconds := 5000
    );
    dispatched := dispatched + 1;
  end loop;

  return dispatched;
end;
$$;
