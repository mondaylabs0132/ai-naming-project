-- 환불 이력을 별도 테이블에 남긴다.
--
-- 배경: premium_orders는 request_id당 1행이고, 재구매 시 그 행을 PENDING으로
-- 되살리면서 refunded_at/refund_amount/refund_reason을 비운다. 그러면 환불
-- 기록이 통째로 사라져 분쟁·정산 때 근거가 없다.
--
-- 실결제 건은 payment_attempts에 REFUNDED 행이 남아 흔적이라도 있지만,
-- 쿠폰 100%(amount=0) 건은 payment_attempts 행 자체가 없어 기록이 완전히
-- 소멸한다. 실제 결제 7건 중 4건이 이 경우다.
--
-- premium_orders에 새 행을 쌓는 방식은 쓰지 않는다. request_id로 주문을
-- maybeSingle() 조회하는 곳이 8군데라, UNIQUE를 없애면 두 번째 주문이
-- 생기는 순간 전부 깨진다.

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),

  -- 주문은 재사용되므로 같은 order_id로 여러 번 환불될 수 있다(환불 → 재구매 → 환불).
  -- 따라서 premium_order_id에 UNIQUE를 걸지 않는다.
  premium_order_id uuid not null references public.premium_orders (id),
  request_id       uuid not null references public.naming_requests (id),
  user_id          uuid not null references public.users (id) on delete cascade,

  -- 실결제를 취소한 경우에만 채워진다. 쿠폰 100% 건은 null.
  payment_attempt_id uuid references public.payment_attempts (id),
  -- 되살린 쿠폰. 쿠폰을 쓰지 않은 주문이면 null.
  coupon_id          uuid references public.coupons (id),

  -- 실제로 돌려준 금액. 쿠폰 100% 건은 0이며, 이때 환불의 실체는 쿠폰 복원이다.
  amount   integer not null check (amount >= 0),
  currency text    not null default 'KRW' check (currency = 'KRW'),
  reason   text    not null,

  -- 토스 취소 응답 원본. 분쟁이 생기면 이게 유일한 증거다.
  toss_response jsonb,

  refunded_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- 마이페이지에서 "이 주문의 과거 환불"을 최신순으로 읽는 유일한 조회 패턴
create index if not exists refunds_user_id_refunded_at_idx
  on public.refunds (user_id, refunded_at desc);
create index if not exists refunds_request_id_idx
  on public.refunds (request_id);

-- RLS 정책은 "어떤 행을 볼지"만 정한다. 테이블 접근 자체는 GRANT가 필요하며
-- 이게 없으면 정책이 맞아도 permission denied(42501)로 막힌다.
-- 기록은 서버(service role)만 남기므로 사용자에겐 select만 준다.
grant select on public.refunds to authenticated;

alter table public.refunds enable row level security;

create policy "authenticated can read own refunds"
  on public.refunds
  for select
  to authenticated
  using (user_id = auth.uid());
