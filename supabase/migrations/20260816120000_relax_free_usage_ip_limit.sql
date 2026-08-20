-- 무료 사용 제한 완화 + 결제 이력자 IP 제한 우회
--
-- WHY: IP 3회/30일은 통신사 NAT·회사망·카페 와이파이에서 오탐이 크다.
--      처음 온 사용자가 남의 사용 이력 때문에 막히고, 그 순간 유료 결제
--      경로까지 함께 사라졌다(퍼널 입구에서 차단했기 때문).
--      제한은 "무료 AI 생성 1회"에만 남기고, IP는 순수 남용 방어선으로 바꾼다.
--
--   - 방문자(visitor_id) 제한: 1회 / 30일 (변경 없음 — 이게 실제 비용 게이트)
--   - IP 제한: 3회 / 30일  →  5회 / 24시간
--   - p_ip_limit_bypass: 결제 이력이 있는 로그인 사용자는 IP 제한만 우회.
--     방문자 제한은 그대로 적용되므로 무료 AI 무한 사용은 열리지 않는다.
--
-- 무중단 배포를 위해 기존 2·3인자 시그니처는 남겨 두고 새 시그니처로 위임한다.
-- (기존 시그니처를 DROP하면 마이그레이션~배포 사이에 구버전 코드가 깨진다.)

-- ── check_free_usage ──────────────────────────────────────────────
create or replace function public.check_free_usage(
  p_visitor_id uuid,
  p_ip_hash text,
  p_ip_limit_bypass boolean
)
returns table(ok boolean, code text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.free_trial_usages
  where visitor_id = p_visitor_id
    and status in ('USED', 'REANALYSIS_USED')
    and created_at >= now() - interval '30 days';

  if v_count >= 1 then
    return query select false, 'VISITOR_LIMIT';
    return;
  end if;

  if not p_ip_limit_bypass then
    select count(*) into v_count
    from public.free_trial_usages
    where ip_hash = p_ip_hash
      and status in ('USED', 'REANALYSIS_USED')
      and created_at >= now() - interval '24 hours';

    if v_count >= 5 then
      return query select false, 'IP_LIMIT';
      return;
    end if;
  end if;

  return query select true, 'OK';
end;
$function$;

create or replace function public.check_free_usage(
  p_visitor_id uuid,
  p_ip_hash text
)
returns table(ok boolean, code text)
language sql
security definer
set search_path to ''
as $function$
  select * from public.check_free_usage(p_visitor_id, p_ip_hash, false);
$function$;

-- ── use_free_usage ────────────────────────────────────────────────
create or replace function public.use_free_usage(
  p_request_id uuid,
  p_visitor_id uuid,
  p_ip_hash text,
  p_ip_limit_bypass boolean
)
returns table(ok boolean, code text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_k1 bigint;
  v_k2 bigint;
  v_count int;
begin
  v_k1 := pg_catalog.hashtextextended(p_visitor_id::text, 0);
  v_k2 := pg_catalog.hashtextextended(p_ip_hash, 0);

  perform pg_catalog.pg_advisory_xact_lock(least(v_k1, v_k2));
  if v_k1 <> v_k2 then
    perform pg_catalog.pg_advisory_xact_lock(greatest(v_k1, v_k2));
  end if;

  -- 이미 이 요청으로 소비한 적이 있으면 재호출은 통과(생성 라우트 재시도 안전)
  if exists (
    select 1
    from public.free_trial_usages
    where request_id = p_request_id
      and status in ('USED', 'CREDITED', 'REANALYSIS_USED')
  ) then
    return query select true, 'OK';
    return;
  end if;

  select count(*) into v_count
  from public.free_trial_usages
  where visitor_id = p_visitor_id
    and status in ('USED', 'REANALYSIS_USED')
    and created_at >= now() - interval '30 days';

  if v_count >= 1 then
    return query select false, 'VISITOR_LIMIT';
    return;
  end if;

  if not p_ip_limit_bypass then
    select count(*) into v_count
    from public.free_trial_usages
    where ip_hash = p_ip_hash
      and status in ('USED', 'REANALYSIS_USED')
      and created_at >= now() - interval '24 hours';

    if v_count >= 5 then
      return query select false, 'IP_LIMIT';
      return;
    end if;
  end if;

  insert into public.free_trial_usages (request_id, visitor_id, ip_hash, status)
  values (p_request_id, p_visitor_id, p_ip_hash, 'USED');

  return query select true, 'OK';
end;
$function$;

create or replace function public.use_free_usage(
  p_request_id uuid,
  p_visitor_id uuid,
  p_ip_hash text
)
returns table(ok boolean, code text)
language sql
security definer
set search_path to ''
as $function$
  select * from public.use_free_usage(p_request_id, p_visitor_id, p_ip_hash, false);
$function$;

-- 서버(admin 클라이언트)만 호출한다. 기존 2인자 함수와 동일한 권한을 명시한다.
revoke all on function public.check_free_usage(uuid, text, boolean) from public;
revoke all on function public.use_free_usage(uuid, uuid, text, boolean) from public;
grant execute on function public.check_free_usage(uuid, text, boolean) to service_role;
grant execute on function public.use_free_usage(uuid, uuid, text, boolean) to service_role;
