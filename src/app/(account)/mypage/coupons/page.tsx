"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";

import SubPageHeader from "../_components/SubPageHeader";
import RowSkeleton from "../_components/RowSkeleton";
import EmptyState from "../_components/EmptyState";
import StatusBadge, { type BadgeTone } from "../_components/StatusBadge";
import { formatDate, formatWon } from "@/lib/mypage/summary";
import {
  getCoupons,
  COUPON_STATE_LABEL,
  type CouponItem,
  type CouponState,
} from "@/lib/mypage/coupons";

const STATE_TONE: Record<CouponState, BadgeTone> = {
  AVAILABLE: "green",
  USED: "neutral",
  EXPIRED: "neutral",
};

export default function CouponsPage() {
  const [items, setItems] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    getCoupons()
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

  const availableCount = items.filter((i) => i.state === "AVAILABLE").length;

  return (
    <div className="flex flex-col pb-20">
      <SubPageHeader title="쿠폰 내역" />

      <div className="px-5 pt-4 flex flex-col gap-3">
        {!loading && items.length > 0 && (
          <p className="text-ink-muted text-caption">
            전체 {items.length}장 중{" "}
            <span className="font-semibold text-primary">
              {availableCount}장
            </span>{" "}
            사용 가능해요.
          </p>
        )}

        {loading &&
          Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}

        {!loading && items.length === 0 && (
          <EmptyState
            title="보유한 쿠폰이 없어요"
            desc={"쿠폰이 발급되면\n여기에서 확인하실 수 있어요."}
          />
        )}

        {!loading &&
          items.map((item) => {
            const isDimmed = item.state !== "AVAILABLE";
            return (
              <div
                key={item.id}
                className={`bg-surface border border-primary-pale p-4 ${
                  isDimmed ? "opacity-60" : ""
                }`}
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-full bg-primary-pale shrink-0 size-9">
                    <Ticket size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink text-body truncate">
                        {item.typeLabel}
                      </span>
                      <StatusBadge
                        label={COUPON_STATE_LABEL[item.state]}
                        tone={STATE_TONE[item.state]}
                      />
                    </div>
                    <p className="font-bold text-primary text-section-title mt-0.5">
                      {formatWon(item.discountAmount)} 할인
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-divider flex flex-col gap-1">
                  <Row label="발급일" value={formatDate(item.issuedAt)} />
                  {/* 사용한 쿠폰은 만료일보다 사용일이 더 궁금한 정보다 */}
                  {item.state === "USED" ? (
                    <Row label="사용일" value={formatDate(item.usedAt)} />
                  ) : (
                    <Row
                      label={item.state === "EXPIRED" ? "만료됨" : "사용 기한"}
                      value={formatDate(item.expiresAt)}
                    />
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-ink-muted text-caption shrink-0">{label}</span>
      <span className="text-ink text-caption truncate">{value}</span>
    </div>
  );
}
