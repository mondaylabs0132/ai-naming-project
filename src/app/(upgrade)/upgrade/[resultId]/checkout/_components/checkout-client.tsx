"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import {
  Check,
  Cloud,
  FileText,
  Heart,
  Info,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const PRODUCT_PRICE = 19900;

const COUPON_LABEL: Record<string, string> = {
  PRE_REGISTER: "사전응모자 할인 쿠폰",
  REANALYSIS: "무료재분석 쿠폰",
};

type Coupon = {
  id: string;
  label: string;
  /** 정액 할인 금액(원) */
  discount: number;
};

const ERROR_MESSAGE: Record<string, string> = {
  invalid_coupon: "선택한 쿠폰을 사용할 수 없어요. 다시 확인해주세요.",
  coupon_in_use: "이 쿠폰은 이미 다른 결제에 사용 중이에요.",
  already_paid: "이미 결제가 완료된 결과예요.",
  order_in_progress: "결제가 진행 중이에요. 잠시 후 다시 시도해주세요.",
  forbidden: "접근 권한이 없어요.",
  unauthorized: "로그인이 필요해요.",
  amount_mismatch:
    "결제 금액이 일치하지 않아 결제를 중단했어요. 다시 시도해주세요.",
  response_mismatch: "결제 확인에 실패했어요. 다시 시도해주세요.",
  CANCELED: "결제가 취소되었어요.",
  ABORTED: "결제가 중단되었어요.",
  EXPIRED: "결제 시간이 만료되었어요. 다시 시도해주세요.",
};

function messageFor(code: string | null, message: string | null) {
  if (code && ERROR_MESSAGE[code]) return ERROR_MESSAGE[code];
  if (message) return message;
  if (code) return "결제를 완료하지 못했어요. 다시 시도해주세요.";
  return null;
}

function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/**
 * 토스 결제창을 iframe 모달로 띄울지, 현재 창을 전환할지 결정한다.
 * 모달은 폭이 고정이라 좁은 화면에서 잘리는데, SDK 자동 판별은 UA 기준이라 놓치는
 * 경우가 있어 실제 뷰포트로 직접 판단한다.
 */
function resolveWindowTarget(): "iframe" | "self" {
  if (typeof window === "undefined") return "self";
  const tooNarrow = window.matchMedia(
    "(max-width: 768px), (max-height: 720px), (pointer: coarse)",
  ).matches;
  return tooNarrow ? "self" : "iframe";
}

export default function CheckoutClient({
  resultId,
  initialErrorCode = null,
  initialErrorMessage = null,
}: {
  resultId: string;
  initialErrorCode?: string | null;
  initialErrorMessage?: string | null;
}) {
  const router = useRouter();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponsLoaded, setCouponsLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(
    messageFor(initialErrorCode, initialErrorMessage),
  );

  // 본인 활성 쿠폰 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("coupons")
        .select("id, type, discount_amount, expires_at")
        .eq("status", "ACTIVE")
        .gt("expires_at", new Date().toISOString())
        .order("discount_amount", { ascending: false }); // 할인 큰 쿠폰부터

      if (!alive) return;
      const list: Coupon[] = (data ?? []).map((c) => ({
        id: c.id as string,
        label: COUPON_LABEL[c.type as string] ?? "할인 쿠폰",
        discount: c.discount_amount as number,
      }));
      setCoupons(list);
      setSelectedId(list[0]?.id ?? null);
      setCouponsLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selectedCoupon = coupons.find((c) => c.id === selectedId) ?? null;
  const discount = selectedCoupon ? selectedCoupon.discount : 0;
  const total = Math.max(PRODUCT_PRICE - discount, 0);

  async function handlePay() {
    if (paying) return;
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/prepare", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId: resultId,
          couponId: selectedId ?? undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(
          ERROR_MESSAGE[data?.code] ??
            "결제를 준비하지 못했어요. 잠시 후 다시 시도해주세요.",
        );
        setPaying(false);
        return;
      }

      // 0원(REANALYSIS) → 결제창 없이 서버가 이미 완료 처리, 바로 generating 페이지로 이동
      if (data.free) {
        router.push(`/upgrade/${resultId}/generating`);
        return;
      }

      // Toss 결제창. 실제 결제금액은 서버 prepare의 amount만 사용.
      const tossPayments = await loadTossPayments(data.clientKey);
      const payment = tossPayments.payment({ customerKey: data.customerKey });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: data.amount },
        orderId: data.orderId,
        orderName: data.orderName,
        successUrl: data.successUrl,
        failUrl: data.failUrl,
        windowTarget: resolveWindowTarget(),
      });
      // 성공 시 successUrl로 redirect. 여기 도달하면 창을 닫았거나 취소한 경우.
      // (windowTarget: "self"면 현재 창이 결제창으로 바뀌므로 여기까지 오지 않는다)
      setPaying(false);
    } catch {
      // 유저 취소(USER_CANCEL) 포함 — 버튼 복구 + 안내
      setError("결제를 완료하지 못했어요. 다시 시도해주세요.");
      setPaying(false);
    }
  }

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

            {couponsLoaded && coupons.length === 0 ? (
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
                  {coupons.map((coupon) => {
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
          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-center text-caption font-medium text-red-600">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-btn font-bold text-white shadow-btn transition hover:bg-primary-light disabled:opacity-60"
          >
            <Lock size={18} />
            {paying ? "결제 준비 중..." : `${formatWon(total)} 결제하기`}
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
