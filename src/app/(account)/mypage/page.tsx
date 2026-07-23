"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bell,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  LogOut,
  Mail,
  Megaphone,
  Receipt,
  RefreshCw,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import SectionHeader from "./_components/SectionHeader";
import SectionCard from "./_components/SectionCard";
import MiniCard from "./_components/MiniCard";
import ListRow from "./_components/ListRow";
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
      <div className="flex justify-between items-center px-5 pt-5 pb-3">
        <div className="flex items-center gap-1">
          <span
            className="font-bold text-[var(--color-ink)]"
            style={{ fontSize: "24px" }}
          >
            마이페이지
          </span>
          <Image
            src="/assets/mypage/mypage-star.png"
            alt="별"
            width={32}
            height={32}
            className="inline-block h-8 w-8"
          />
        </div>
        <Bell size={22} className="text-[var(--color-ink-muted)]" />
      </div>

      {/* ── Section 0: 유저 정보 ── */}
      <div className="mx-5 mb-4">
        <SectionCard>
          <div className="flex items-center gap-3">
            <div
              className="rounded-full bg-[var(--color-primary-pale)] flex items-center justify-center shrink-0"
              style={{ width: "64px", height: "64px" }}
            >
              <Star size={28} className="text-[var(--color-primary-muted)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold text-[var(--color-ink)] truncate ${blurClass}`}
                style={{ fontSize: "15px" }}
              >
                {loading ? "example@email.com" : (summary?.email ?? "-")}
              </p>
              <p
                className="text-[var(--color-ink-muted)]"
                style={{ fontSize: "13px" }}
              >
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
              className="flex items-center gap-1 shrink-0 whitespace-nowrap border border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-1 disabled:opacity-50"
              style={{ fontSize: "13px", borderRadius: "var(--radius-pill)" }}
            >
              <LogOut size={13} />
              로그아웃
            </button>
          </div>
        </SectionCard>
      </div>

      {/* ── Section 1: 나의 이름 분석 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="1" label="나의 이름 분석" />
          <div className="flex flex-row gap-3 items-stretch">
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
              <span
                className="text-[var(--color-ink-muted)]"
                style={{ fontSize: "11px" }}
              >
                최근 분석 결과
              </span>
              <span
                className={`font-bold text-[var(--color-primary)] ${blurClass}`}
                style={{ fontSize: "16px" }}
              >
                {loading
                  ? "0개 이름"
                  : `${summary?.latestNameCount ?? 0}개 이름`}
              </span>
              <span
                className={`text-[var(--color-ink-muted)] ${blurClass}`}
                style={{ fontSize: "11px" }}
              >
                {loading
                  ? "2024.00.00 분석"
                  : `${formatDate(summary?.latestAnalyzedAt ?? null)} 분석`}
              </span>
            </MiniCard>
            <div className="basis-[60%] flex flex-col justify-center">
              <ListRow icon={<FileText size={16} />} label="결과 보러가기" />
              <ListRow icon={<Clock size={16} />} label="분석 이력 전체보기" />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Section 2: 쿠폰/혜택 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="2" label="쿠폰/혜택" />
          <div className="flex flex-row gap-3 items-stretch">
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
              <span
                className="text-[var(--color-ink-muted)]"
                style={{ fontSize: "11px" }}
              >
                보유 쿠폰
              </span>
              <span
                className={`font-bold text-[var(--color-primary)] ${blurClass}`}
                style={{ fontSize: "16px" }}
              >
                {loading ? "0장" : `${summary?.activeCouponCount ?? 0}장`}
              </span>
            </MiniCard>
            <div className="basis-[60%] flex flex-col justify-center">
              <ListRow icon={<Receipt size={16} />} label="쿠폰 사용 내역" />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Section 3: 결제 내역 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="3" label="결제 내역" />
          <div className="flex flex-row gap-3 items-stretch">
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
              <span
                className="text-[var(--color-ink-muted)]"
                style={{ fontSize: "11px" }}
              >
                최근 결제
              </span>
              <span
                className={`font-bold text-[var(--color-ink)] ${blurClass}`}
                style={{ fontSize: "16px" }}
              >
                {loading
                  ? "0,000원"
                  : formatWon(summary?.latestPaidAmount ?? null)}
              </span>
              <span
                className={`text-[var(--color-ink-muted)] ${blurClass}`}
                style={{ fontSize: "11px" }}
              >
                {loading
                  ? "2024.00.00"
                  : formatDate(summary?.latestPaidAt ?? null)}
              </span>
            </MiniCard>
            <div className="basis-[60%] flex flex-col justify-center">
              <ListRow
                icon={<FileText size={16} />}
                label="결제 내역 전체보기"
              />
              <ListRow icon={<Receipt size={16} />} label="영수증 보기" />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* ── Section 4: 고객 지원 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="4" label="고객 지원" />
          <div className="flex flex-row gap-2">
            {[
              { icon: <Megaphone size={18} />, label: "공지사항" },
              { icon: <HelpCircle size={18} />, label: "자주 묻는 질문" },
              { icon: <Mail size={18} />, label: "문의하기" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex-1 flex flex-row items-center justify-center gap-2 py-2 border border-[var(--color-divider)]"
                style={{ borderRadius: "var(--radius-md)" }}
              >
                <span className="text-[var(--color-primary)]">{item.icon}</span>
                <span
                  className="text-[var(--color-ink)]"
                  style={{ fontSize: "13px" }}
                >
                  {item.label}
                </span>
                <ChevronRight
                  size={14}
                  className="text-[var(--color-ink-muted)]"
                />
              </div>
            ))}
          </div>
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
                className="flex items-center gap-3 px-4 py-[14px]"
              >
                <span className="text-[var(--color-primary)]">{item.icon}</span>
                <span
                  className="flex-1 text-[var(--color-ink)]"
                  style={{ fontSize: "15px" }}
                >
                  {item.label}
                </span>
                <ChevronRight
                  size={16}
                  className="text-[var(--color-ink-muted)]"
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Section 6: 계정 관리 ── */}
      <div className="mx-5 mb-3">
        <SectionCard>
          <SectionHeader badge="6" label="계정 관리" />
          <div
            className="flex items-center gap-3 px-4 py-[14px] border border-[var(--color-divider)]"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <Trash2 size={20} className="text-[var(--color-danger)]" />
            <div className="flex-1 flex flex-col">
              <span
                className="font-semibold text-[var(--color-danger)]"
                style={{ fontSize: "15px" }}
              >
                계정 삭제
              </span>
              <span
                className="text-[var(--color-ink-muted)]"
                style={{ fontSize: "12px" }}
              >
                계정을 삭제하면 모든 데이터가 복구되지 않습니다.
              </span>
            </div>
            <ChevronRight size={16} className="text-[var(--color-danger)]" />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
