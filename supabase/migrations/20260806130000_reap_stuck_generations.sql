-- 멈춘 유료 생성을 회수하는 리퍼.
--
-- 배경: 유료 생성은 서버가 트리거하지만, 트리거를 담은 함수가 수명을 넘겨 죽으면
-- naming_requests가 PREMIUM_GENERATING에 영구히 고착됐다. 폴링 화면에는 상한이
-- 없어 사용자는 92%에서 무한히 기다렸고, 결제는 그대로 남았다.
--
-- 이제 앱은 "요청을 던지기만" 하고, 완주 보장은 전부 이 리퍼가 맡는다.
--   재시도 여유 있음 → 생성 API를 다시 호출
--   재시도 소진      → 앱의 실패 처리 엔드포인트 호출 (거기서 FAILED 확정 + 환불)
--
-- 환불을 DB에서 직접 하지 않는 이유: 토스 취소는 외부 HTTP 호출이고 멱등키·에러
-- 코드 해석이 필요하다. DB 함수가 감당할 일이 아니라 앱으로 넘긴다.

-- ── 사전 준비 (한 번만) ─────────────────────────────────────────
-- 리퍼가 앱을 호출하려면 주소와 내부 시크릿이 필요하다.
-- premium_email_webhook_secret과 같은 방식으로 Vault에 넣는다.
--
--   select vault.create_secret('https://www.cheot-jieum.co.kr', 'app_origin',
--     'Base URL the generation reaper calls back into');
--   select vault.create_secret('<INTERNAL_JOB_SECRET와 동일한 값>', 'internal_job_secret',
--     'Authenticates the generation reaper when it calls the premium generation API');
--
-- 값은 앱의 APP_ORIGIN / INTERNAL_JOB_SECRET 환경변수와 반드시 일치해야 한다.

create or replace function public.reap_stuck_generations()
returns integer
language plpgsql
security definer
set search_path to ''
as $$
declare
  -- 생성 실측이 1~2분이라 5분이면 "정상 진행 중"과 겹치지 않는다.
  stale_after  constant interval := interval '5 minutes';
  max_attempts constant integer  := 3;

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

  return dispatched;
end;
$$;

-- 사용자가 무한 로딩을 보는 시간을 줄이려면 자주 돌아야 한다.
-- 대상이 없으면 조회 두 번으로 끝나므로 매분이어도 부담이 없다.
select cron.schedule(
  'reap-stuck-generations',
  '* * * * *',
  $cron$ select public.reap_stuck_generations(); $cron$
);
