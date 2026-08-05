"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, CreditCard } from "lucide-react";

import SubPageHeader from "../_components/SubPageHeader";
import RowSkeleton from "../_components/RowSkeleton";
import EmptyState from "../_components/EmptyState";
import StatusBadge, { type BadgeTone } from "../_components/StatusBadge";
import { formatDate, formatWon } from "@/lib/mypage/summary";
import {
  getOrders,
  ORDER_STATE_LABEL,
  type OrderItem,
  type OrderState,
} from "@/lib/mypage/orders";

const STATE_TONE: Record<OrderState, BadgeTone> = {
  COMPLETED: "green",
  PENDING: "amber",
  FAILED: "red",
  CANCELED: "neutral",
};

export default function OrdersPage() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    getOrders()
      .then((rows) => {
        if (alive) setItems(rows);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) throw error;

  const paidTotal = items
    .filter((i) => i.state === "COMPLETED")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="flex flex-col pb-20">
      <SubPageHeader title="결제 내역" />

      <div className="px-5 pt-4 flex flex-col gap-3">
        {!loading && items.length > 0 && (
          <p className="text-ink-muted text-caption">
            전체 {items.length}건 · 결제 완료 금액{" "}
            <span className="font-semibold text-ink">
              {formatWon(paidTotal)}
            </span>
          </p>
        )}

        {loading &&
          Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}

        {!loading && items.length === 0 && (
          <EmptyState
            title="결제 내역이 없어요"
            desc={"유료 분석을 결제하시면\n여기에 내역이 남아요."}
          />
        )}

        {!loading &&
          items.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-primary-pale p-4"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full bg-primary-pale shrink-0 size-9">
                  <CreditCard size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-body">
                      프리미엄 작명
                    </span>
                    {/* 실패·진행 중 건도 목록에 남기므로 상태 표시는 필수다 */}
                    <StatusBadge
                      label={ORDER_STATE_LABEL[item.state]}
                      tone={STATE_TONE[item.state]}
                    />
                  </div>
                  <p className="text-ink-muted text-caption mt-0.5">
                    {formatDate(item.paidAt ?? item.failedAt ?? item.createdAt)}
                  </p>
                </div>
                <span className="font-bold text-ink text-body shrink-0">
                  {formatWon(item.amount)}
                </span>
              </div>

              {/* 쿠폰을 쓴 건만 정가/할인을 펼쳐 보여준다 */}
              {item.usedCoupon && item.discountAmount > 0 && (
                <div className="mt-3 pt-3 border-t border-divider flex flex-col gap-1">
                  <Row
                    label="정가"
                    value={formatWon(item.originalAmount)}
                    muted
                  />
                  <Row
                    label="쿠폰 할인"
                    value={`-${formatWon(item.discountAmount)}`}
                    accent
                  />
                </div>
              )}

              {item.state === "FAILED" && item.failureReason && (
                <p className="mt-3 pt-3 border-t border-divider text-[#B3261E] text-caption break-keep">
                  {item.failureReason}
                </p>
              )}

              {item.isResultReadable && (
                <Link
                  href={`/mypage/results/${item.requestId}`}
                  className="mt-3 pt-3 border-t border-divider flex items-center justify-between text-primary"
                >
                  <span className="font-medium text-caption">결과 보러가기</span>
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-muted text-caption shrink-0">{label}</span>
      <span
        className={`text-caption truncate ${
          accent ? "text-primary font-medium" : muted ? "text-ink-muted" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
