-- refunds에 service_role INSERT 권한을 준다.
--
-- 20260806150000에서 authenticated에게만 GRANT를 줬다. 이 프로젝트는 새
-- 테이블에 기본 권한이 붙지 않아 service_role조차 명시해야 하는데, 그걸
-- 빠뜨렸다. refunds는 서버(service role)만 쓰는 테이블이라 이 누락이 곧
-- 기능 전체 실패였다.
--
-- 실측한 증상: 환불 자체(토스 취소·쿠폰 복원·주문 REFUNDED)는 전부 정상인데
-- 이력만 0행. refundOrder가 INSERT 실패를 throw하지 않고 로그만 남기도록
-- 설계돼 있어(이미 나간 돈은 되돌릴 수 없으므로) 조용히 넘어갔다.
--
-- 앞선 마이그레이션에도 같은 GRANT를 추가해 뒀다. 새 환경에서 처음부터
-- 실행하면 여기까지 올 필요가 없고, 이미 적용한 환경은 이 파일이 메운다.

grant insert, select on public.refunds to service_role;
