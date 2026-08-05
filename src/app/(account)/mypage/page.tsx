"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Clock,
  FileText,
  LogOut,
  Mail,
  Receipt,
  RefreshCw,
  Shield,
  Star,
} from "lucide-react";
import SectionHeader from "./_components/SectionHeader";
import SectionCard from "./_components/SectionCard";
import MiniCard from "./_components/MiniCard";
import ListRow from "./_components/ListRow";
import AccountDeletionButton from "./_components/AccountDeletionButton";
import { createClient } from "@/lib/supabase/client";
import {
  getMyPageSummary,
  formatDate,
  formatWon,
  type MyPageSummary,
} from "@/lib/mypage/summary";

export default function MyPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<MyPageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let alive = true;
    getMyPageSummary()
      .then((data) => {
        if (alive) setSummary(data);
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

  // 조회 실패 시 에러 바운더리(error.tsx)로 위임
  if (error) throw error;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setLoggingOut(false);
      return;
    }
    // 프록시가 세션 없음을 감지하도록 로그인으로 이동 후 서버 상태 새로고침
    router.replace("/login");
    router.refresh();
  }

  // 데이터 로딩 중에는 동적 값들을 뿌옇게(blur + pulse) 처리해 로딩 상태를 표현
  const blurClass = loading ? "blur-[4px] animate-pulse select-none" : "";

  return (
    <div className="pb-16">
      {/* ── 헤더 ── */}
      <div className="flex justify-between items-center gap-2 px-5 pt-5 pb-3">
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-bold text-ink text-page-title truncate">
            마이페이지
          </span>
          <Image
            src="/assets/mypage/mypage-star.png"
            alt="별"
            width={32}
            height={32}
            className="inline-block h-8 w-8 shrink-0"
          />
        </div>
        <Bell size={22} className="text-ink-muted shrink-0" />
      </div>

      {/* ── Section 0: 유저 정보 ── */}
      <div className="mx-5 mb-4">
        <SectionCard>
          <div className="flex items-center gap-2.5 min-[376px]:gap-3">
            <div className="rounded-full bg-primary-pale flex items-center justify-center shrink-0 size-8 min-[376px]:size-16">
              <Star className="text-primary-muted size-4 min-[376px]:size-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold text-ink truncate text-caption min-[376px]:text-body ${blurClass}`}
              >
                {loading ? "example@email.com" : (summary?.email ?? "-")}
              </p>
              <p className="text-ink-muted truncate text-nav min-[376px]:text-caption">
                가입일{" "}
                <span className={blurClass}>
                  {loading
                    ? "2024.00.00"
                    : formatDate(summary?.joinedAt ?? null)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-0.5 min-[376px]:gap-1 shrink-0 whitespace-nowrap border border-primary text-primary px-2 py-1 min-[376px]:px-3 rounded-pill text-[10px] min-[376px]:text-caption disabled:opacity-50"
            >
              <LogOut className="size-[11px] min-[376px]:size-[13px]" />
              로그아웃
            </button>
          </div>
        </SectionCard>
      </div>

      {/* ── Section 1: 나의 이름 분석 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="1" label="나의 이름 분석" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <MiniCard
              image={
                <Image
                  src="/assets/mypage/chart.png"
                  alt="이름 분석"
                  width={48}
                  height={48}
                  className="object-contain h-12 w-12"
                />
              }
            >
              <span className="text-ink-muted text-nav break-keep">
                최근 분석 결과
              </span>
              <span
                className={`font-bold text-primary text-section-title break-keep ${blurClass}`}
              >
                {loading
                  ? "0개 이름"
                  : `${summary?.latestNameCount ?? 0}개 이름`}
              </span>
              <span
                className={`text-ink-muted text-nav break-keep ${blurClass}`}
              >
                {loading
                  ? "2024.00.00 분석"
                  : `${formatDate(summary?.latestAnalyzedAt ?? null)} 분석`}
              </span>
            </MiniCard>
            <div className="w-full min-w-0 sm:basis-3/5 flex flex-col justify-center">
              {/* 유료 결과가 없으면 갈 곳이 없다 — 로딩 중에는 비활성으로 두고
                  깜빡임을 피하기 위해 안내 문구도 띄우지 않는다. */}
              <ListRow
                icon={<FileText size={16} />}
                label="결과 보러가기"
                href={
                  summary?.latestRequestId
                    ? `/mypage/results/${summary.latestRequestId}`
                    : undefined
                }
                hint={loading ? undefined : "분석 내역 없음"}
              />
              <ListRow
                icon={<Clock size={16} />}
                label="분석 이력 전체보기"
                href="/mypage/results"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Section 2: 쿠폰/혜택 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="2" label="쿠폰/혜택" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <MiniCard
              image={
                <Image
                  src="/assets/mypage/coupon.png"
                  alt="쿠폰"
                  width={48}
                  height={48}
                  className="object-contain h-12 w-12"
                />
              }
            >
              <span className="text-ink-muted text-nav break-keep">
                보유 쿠폰
              </span>
              <span
                className={`font-bold text-primary text-section-title break-keep ${blurClass}`}
              >
                {loading ? "0장" : `${summary?.activeCouponCount ?? 0}장`}
              </span>
            </MiniCard>
            <div className="w-full min-w-0 sm:basis-3/5 flex flex-col justify-center">
              <ListRow
                icon={<Receipt size={16} />}
                label="쿠폰 사용 내역"
                href="/mypage/coupons"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Section 3: 결제 내역 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="3" label="결제 내역" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <MiniCard
              image={
                <Image
                  src="/assets/mypage/card.png"
                  alt="결제 카드"
                  width={48}
                  height={48}
                  className="object-contain h-12 w-12"
                />
              }
            >
              <span className="text-ink-muted text-nav break-keep">
                최근 결제
              </span>
              <span
                className={`font-bold text-ink text-section-title break-keep ${blurClass}`}
              >
                {loading
                  ? "0,000원"
                  : formatWon(summary?.latestPaidAmount ?? null)}
              </span>
              <span
                className={`text-ink-muted text-nav break-keep ${blurClass}`}
              >
                {loading
                  ? "2024.00.00"
                  : formatDate(summary?.latestPaidAt ?? null)}
              </span>
            </MiniCard>
            <div className="w-full min-w-0 sm:basis-3/5 flex flex-col justify-center">
              <ListRow
                icon={<FileText size={16} />}
                label="결제 내역 전체보기"
                href="/mypage/orders"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Section 4: 고객 지원 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="4" label="고객 지원" />
          <Link
            href="/mypage/inquiries"
            className="flex items-center gap-2 px-3 py-2 border border-divider rounded-md"
          >
            <span className="text-primary shrink-0">
              <Mail size={18} />
            </span>
            <span className="flex-1 min-w-0 text-ink break-keep text-caption">
              문의하기
            </span>
            <ChevronRight size={14} className="text-ink-muted shrink-0" />
          </Link>
        </SectionCard>
      </div>

      {/* ── Section 5: 약관 및 정책 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="5" label="약관 및 정책" />
          <div
            className="divide-y divide-[var(--color-divider)] overflow-hidden border border-[var(--color-divider)]"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            {[
              { icon: <FileText size={18} />, label: "이용약관" },
              { icon: <Shield size={18} />, label: "개인정보처리방침" },
              { icon: <RefreshCw size={18} />, label: "환불 정책" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 min-[376px]:gap-3 px-3 min-[376px]:px-4 py-[14px]"
              >
                <span className="text-primary shrink-0">{item.icon}</span>
                <span className="flex-1 min-w-0 text-ink break-keep text-caption min-[376px]:text-body">
                  {item.label}
                </span>
                <ChevronRight size={16} className="text-ink-muted shrink-0" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Section 6: 계정 관리 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="6" label="계정 관리" />
          <AccountDeletionButton />
        </SectionCard>
      </div>
    </div>
  );
}
