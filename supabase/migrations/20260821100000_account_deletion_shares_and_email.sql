-- 계정 삭제(delete_account_data)에서 빠져 있던 두 곳을 마저 정리한다.
--
-- 1) result_shares
--    공유 링크 자체는 이미 죽는다 — resolveShareToken이 naming_requests의
--    deleted_at/status를 검사하고, 탈퇴 시 status='DELETED'가 되기 때문.
--    하지만 result_shares.user_id FK는 ON DELETE CASCADE인데 users 행이
--    소프트 삭제라 발동하지 않아, 공유 행과 share_participants(voter_label·
--    comment — 제3자가 남긴 개인정보)가 그대로 남는다. 여기서 직접 지운다.
--    share_participants는 result_shares에 CASCADE로 물려 있고, share_votes는
--    name_candidates 삭제로 이미 캐스케이드된다.
--
-- 2) premium_email_deliveries.email
--    users.email은 GoTrue 소프트 삭제가 난독화하지만 이 발송 대장은 평문
--    수신 주소를 그대로 들고 있다. 행을 지우면 UNIQUE(request_id, kind)로
--    보장하던 중복 발송 방지가 풀리므로, 행과 이력은 남기고 주소만 파기한다.
create or replace function public.delete_account_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_deleted_at timestamptz := now();
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  delete from public.name_favorites nf
  using public.name_candidates nc, public.naming_requests nr
  where nf.name_candidate_id = nc.id
    and nc.request_id = nr.id
    and nr.user_id = p_user_id;

  delete from public.name_favorites
  where user_id = p_user_id;

  -- share_participants·share_votes가 캐스케이드로 함께 사라진다.
  delete from public.result_shares
  where user_id = p_user_id;

  delete from public.name_candidates nc
  using public.naming_requests nr
  where nc.request_id = nr.id
    and nr.user_id = p_user_id;

  delete from public.naming_surveys ns
  using public.naming_requests nr
  where ns.request_id = nr.id
    and nr.user_id = p_user_id;

  -- 발송 이력(멱등성 키)은 남기고 수신 주소만 파기.
  update public.premium_email_deliveries
  set
    email = 'deleted@removed.invalid',
    updated_at = now()
  where user_id = p_user_id;

  update public.naming_requests
  set
    status = 'DELETED',
    deleted_at = coalesce(deleted_at, v_deleted_at),
    updated_at = now()
  where user_id = p_user_id;

  update public.users
  set
    is_deleted = true,
    deleted_at = coalesce(deleted_at, v_deleted_at),
    is_paid_user = false,
    updated_at = now()
  where id = p_user_id;
end;
$function$;

-- CREATE OR REPLACE는 기존 ACL을 유지하지만, 명시해 두는 편이 안전하다.
grant execute on function public.delete_account_data(uuid) to service_role;
