-- 환불(REFUNDED)된 주문이 물고 있는 쿠폰 예약(coupon_id)을 해제한다.
--
-- 배경: refundOrder는 쿠폰을 ACTIVE로 되살리지만 premium_orders.coupon_id를
-- 지우지 않았다. UNIQUE(coupon_id) 인덱스에 주문 상태 조건이 없어서,
-- 되살아난 쿠폰을 다른 결제에 쓰려 하면 23505(coupon_in_use)로 막혔다.
-- (마이페이지·체크아웃에는 "사용 가능"으로 보이는데 실제로는 못 쓰는 상태)
--
-- 코드는 이제 환불 확정 시 coupon_id를 함께 NULL로 만든다(refund.ts).
-- 이 마이그레이션은 이미 발생한 기존 데이터를 정리하는 백필이다.
--
-- 쿠폰 상태와 무관하게 REFUNDED 주문의 예약은 전부 푼다 — 환불된 주문이
-- 쿠폰을 계속 점유할 이유가 없고, 환불-쿠폰 연결 이력은 refunds 테이블이 담당한다.
UPDATE premium_orders
SET coupon_id = NULL
WHERE status = 'REFUNDED'
  AND coupon_id IS NOT NULL;
