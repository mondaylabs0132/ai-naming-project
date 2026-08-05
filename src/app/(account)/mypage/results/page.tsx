"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, FileText } from "lucide-react";

import SubPageHeader from "../_components/SubPageHeader";
import RowSkeleton from "../_components/RowSkeleton";
import EmptyState from "../_components/EmptyState";
import { formatDate } from "@/lib/mypage/summary";
import {
  getAnalysisHistory,
  type AnalysisHistoryItem,
} from "@/lib/mypage/history";

export default function AnalysisHistoryPage() {
  const [items, setItems] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    getAnalysisHistory()
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

  // 조회 실패는 렌더 중 throw → mypage/error.tsx 경계가 잡는다.
  if (error) throw error;

  return (
    <div className="flex flex-col pb-20">
      <SubPageHeader title="분석 이력" />

      <div className="px-5 pt-4 flex flex-col gap-3">
        {!loading && items.length > 0 && (
          <p className="text-ink-muted text-caption">
            결제하신 분석 {items.length}건이에요.
          </p>
        )}

        {loading &&
          Array.from({ length: 3 }).map((_, i) => <RowSkeleton key={i} />)}

        {!loading && items.length === 0 && (
          <EmptyState
            title="아직 분석 이력이 없어요"
            desc={"유료 분석을 완료하면\n여기에서 언제든 다시 볼 수 있어요."}
            action={{ label: "이름 분석 시작하기", href: "/naming/new" }}
          />
        )}

        {!loading &&
          items.map((item, i) => (
            <Link
              key={item.id}
              href={`/mypage/results/${item.id}`}
              className="bg-surface border border-primary-pale p-4 flex items-center gap-3"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <div className="flex items-center justify-center rounded-full bg-primary-pale shrink-0 size-9">
                <FileText size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink text-body">
                  {formatDate(item.analyzedAt)} 분석
                </p>
                <p className="text-ink-muted text-caption mt-0.5">
                  이름 {item.nameCount}개
                  {/* 최신 건을 한눈에 구분할 수 있게 표시 */}
                  {i === 0 && <span className="text-primary"> · 최근</span>}
                </p>
              </div>
              <ChevronRight size={18} className="text-ink-muted shrink-0" />
            </Link>
          ))}
      </div>
    </div>
  );
}
