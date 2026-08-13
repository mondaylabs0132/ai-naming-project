-- total_strokes 백필: 사격 수리의 합(실제 획수의 3배) → 실제 글자 획수 합
--
-- 문제: getFourGrids가 rawStroke를 원격+형격+이격+정격의 합으로 계산했다.
-- 성 1자 + 이름 2자(획수 A,B,C)에서 이 합은
--   (B+C) + (A+B) + (A+C) + (A+B+C) = 3(A+B+C)
-- 로, 화면에 "총획"으로 노출되는 값이 실제 획수의 정확히 3배였다(31획 → 93획).
--
-- 실제 총획은 정격(A+B+C, 두 자 성이면 A+B+C+D)과 같으므로 정격 stroke로 덮는다.
-- 전제 검증(2026-08-13, 222행 전체): total_strokes = 정격×3 이 100% 성립,
-- 정격 > 81(정규화로 값이 깎이는 경우) 0건 — 정격 stroke를 그대로 써도 안전하다.
--
-- 코드 쪽 수정(getFourGrids의 rawStroke 계산)과 같은 PR에 있다.
-- grids jsonb 안의 총격.rawStroke도 함께 맞춰, 이후 어떤 경로로 읽어도 같은 값이 나오게 한다.

update public.name_candidates
set
  total_strokes = (grids -> '정격' ->> 'stroke')::int,
  grids = jsonb_set(
    grids,
    '{총격,rawStroke}',
    to_jsonb((grids -> '정격' ->> 'stroke')::int)
  )
where total_strokes is distinct from (grids -> '정격' ->> 'stroke')::int;
