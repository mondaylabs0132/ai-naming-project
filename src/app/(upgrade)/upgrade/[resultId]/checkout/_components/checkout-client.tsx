"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Check,
  Cloud,
  FileText,
  Heart,
  Info,
  Lock,
  ShieldCheck,
} from "lucide-react";

const PRODUCT_PRICE = 19900;

type Coupon = {
  id: string;
  label: string;
  /** 정액 할인 금액(원) */
  discount: number;
};

// TODO: 실제 보유 쿠폰 API 연동 시 교체. 빈 배열이면 "보유한 쿠폰이 없어요" 상태로 렌더링됨.
const COUPONS: Coupon[] = [
  { id: "pre-signup", label: "사전응모자 할인 쿠폰", discount: 10000 },
  { id: "free-reanalysis", label: "무료재분석 쿠폰", discount: 19900 },
];

function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export default function CheckoutClient({ resultId }: { resultId: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    COUPONS[0]?.id ?? null,
  );

  const selectedCoupon = COUPONS.find((c) => c.id === selectedId) ?? null;
  const discount = selectedCoupon ? selectedCoupon.discount : 0;
  const total = PRODUCT_PRICE - discount;

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col">
        <div className="flex-1 px-5 pt-8 pb-6">
          {/* ── 헤더 ── */}
          <header className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-hero font-extrabold leading-tight tracking-[-0.5px] text-ink break-keep">
                프리미엄 결제
              </h1>
              <p className="mt-3 text-body text-ink-muted leading-relaxed break-keep">
                쿠폰을 적용하고 최종 결제 금액을 확인해보세요
              </p>
            </div>
            <Image
              src="/assets/checkout/checkout-star.png"
              alt=""
              width={240}
              height={220}
              priority
              className="w-[34%] max-w-[150px] h-auto shrink-0 object-contain"
            />
          </header>

          {/* ── 상품 카드 ── */}
          <section className="mt-6 rounded-xl bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Image
                  src="/assets/checkout/crown.png"
                  alt=""
                  width={64}
                  height={64}
                  className="w-6 h-auto shrink-0 object-contain"
                />
                <p className="min-w-0 break-keep text-[18px] font-bold text-ink">
                  작명 서비스
                </p>
              </div>
              <p className="shrink-0 text-[19px] min-[400px]:text-[20px] font-extrabold text-ink whitespace-nowrap">
                {formatWon(PRODUCT_PRICE)}
              </p>
            </div>
            <p className="mt-1 text-caption text-ink-muted break-keep">
              아이에게 어울리는 이름 20개 전체 확인
            </p>

            <div className="mt-4 flex flex-nowrap gap-1.5 min-[400px]:gap-2">
              {[
                { Icon: FileText, label: "이름 20개 확인" },
                { Icon: Cloud, label: "평생 보관" },
                { Icon: Heart, label: "부부 공유" },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-0.5 whitespace-nowrap rounded-pill bg-primary-pale px-2 py-1 text-nav font-semibold text-primary min-[400px]:gap-1.5 min-[400px]:px-3 min-[400px]:py-1.5 min-[400px]:text-caption"
                >
                  <Icon className="size-3 shrink-0 min-[400px]:size-3.5" />
                  {label}
                </span>
              ))}
            </div>
          </section>

          {/* ── 쿠폰 선택 ── */}
          <section className="mt-4 rounded-xl bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/mypage/coupon.png"
                alt=""
                width={64}
                height={64}
                className="w-6 h-auto object-contain"
              />
              <h2 className="text-section-title font-bold text-ink">
                쿠폰 선택
              </h2>
            </div>

            {COUPONS.length === 0 ? (
              <div className="mt-4 flex flex-col items-center rounded-lg bg-surface-section py-10 text-center">
                <Image
                  src="/assets/checkout/no-coupon.png"
                  alt=""
                  width={240}
                  height={240}
                  className="w-[100px] h-auto object-contain"
                />
                <p className="mt-3 text-body font-bold text-ink">
                  보유한 쿠폰이 없어요
                </p>
                <p className="mt-1 text-caption text-ink-muted">
                  사용 가능한 쿠폰이 생기면 이곳에서 선택할 수 있어요
                </p>
              </div>
            ) : (
              <>
                {selectedCoupon && (
                  <div className="mt-4 rounded-lg border border-divider bg-surface-section px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-caption text-ink-muted">적용 쿠폰</p>
                      <p className="text-body font-bold text-primary">
                        -{formatWon(discount)}
                      </p>
                    </div>
                    <p className="mt-1 min-w-0 break-keep text-body font-bold text-ink">
                      {selectedCoupon.label}
                    </p>
                  </div>
                )}

                <ul className="mt-3 space-y-2">
                  {COUPONS.map((coupon) => {
                    const isSelected = coupon.id === selectedId;
                    return (
                      <li key={coupon.id}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            setSelectedId(isSelected ? null : coupon.id)
                          }
                          className={`flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-left transition min-[400px]:gap-3 ${
                            isSelected
                              ? "border-primary bg-primary-pale/40"
                              : "border-divider bg-surface"
                          }`}
                        >
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition min-[400px]:size-6 ${
                              isSelected
                                ? "border-primary bg-primary text-white"
                                : "border-ink-light bg-surface"
                            }`}
                          >
                            {isSelected && (
                              <Check
                                strokeWidth={3}
                                className="size-3 min-[400px]:size-3.5"
                              />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 break-keep text-caption font-semibold text-ink min-[400px]:text-body">
                            {coupon.label}
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-caption font-bold text-ink-muted min-[400px]:text-body">
                            -{formatWon(coupon.discount)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-3 flex items-center gap-1.5 text-caption text-ink-muted">
                  <Info size={14} className="shrink-0 text-ink-light" />
                  쿠폰은 1개만 적용할 수 있어요
                </p>
              </>
            )}
          </section>

          {/* ── 결제 금액 ── */}
          <section className="mt-4 rounded-xl bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/mypage/card.png"
                alt=""
                width={64}
                height={64}
                className="w-6 h-auto object-contain"
              />
              <h2 className="text-section-title font-bold text-ink">
                결제 금액
              </h2>
            </div>

            <dl className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <dt className="text-body text-ink-muted">상품 금액</dt>
                <dd className="text-body font-medium text-ink">
                  {formatWon(PRODUCT_PRICE)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-body text-ink-muted">쿠폰 할인</dt>
                <dd className="text-body font-medium text-primary">
                  {discount > 0 ? `-${formatWon(discount)}` : formatWon(0)}
                </dd>
              </div>
            </dl>

            <div className="my-4 border-t border-dashed border-divider" />

            <div className="flex items-center justify-between">
              <p className="text-body font-bold text-ink min-[400px]:text-section-title">
                최종 결제 금액
              </p>
              <p className="text-[19px] font-extrabold text-primary min-[400px]:text-stat">
                {formatWon(total)}
              </p>
            </div>
          </section>
        </div>

        {/* ── 하단 결제 버튼 ── */}
        <div className="sticky bottom-0 bg-bg px-5 pb-6 pt-2">
          <button
            type="button"
            data-result-id={resultId}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-btn font-bold text-white shadow-btn transition hover:bg-primary-light"
          >
            <Lock size={18} />
            결제하기
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-nav text-ink-muted min-[400px]:text-caption">
            <ShieldCheck className="size-3 shrink-0 text-ink-light min-[400px]:size-3.5" />
            결제 시 이용약관 및 환불정책에 동의한 것으로 간주됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
