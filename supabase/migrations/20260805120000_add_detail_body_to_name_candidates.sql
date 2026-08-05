-- name_candidates.detail_body 컬럼 추가
--
-- 배경:
-- 기존 detailed_explanation은 [summary, categories, detail, tags]를 개행으로
-- 이어붙인 단일 문자열이라, 유료 상세 페이지에서 섹션별로 렌더링할 수 없었다.
-- categories/tags/meaning_summary는 이미 각각 별도 컬럼에 저장돼 있으므로
-- 사실상 중복 저장이기도 하다.
--
-- 조치:
-- AI가 생성한 상세 해설 본문(detail) 원문만 담는 컬럼을 분리한다.
-- detailed_explanation은 기존 데이터 호환을 위해 그대로 둔다.
-- (이미 생성된 행의 detail_body는 빈 문자열이며, 애플리케이션에서
--  detailed_explanation으로 폴백한다.)

alter table public.name_candidates
  add column if not exists detail_body text not null default '';

comment on column public.name_candidates.detail_body is
  'AI가 생성한 상세 해설 본문 원문. 무료 단계 저장 시에는 빈 문자열이며 유료 생성 시 채워진다.';
