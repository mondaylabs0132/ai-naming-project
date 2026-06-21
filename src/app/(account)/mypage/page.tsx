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

export default function MyPage() {
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
            className="inline-block"
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
            <div className="flex-1">
              <p
                className="font-semibold text-[var(--color-ink)]"
                style={{ fontSize: "15px" }}
              >
                example@email.com
              </p>
              <p
                className="text-[var(--color-ink-muted)]"
                style={{ fontSize: "13px" }}
              >
                가입일 2024.05.20
              </p>
            </div>
            <button
              className="flex items-center gap-1 border border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-1"
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
                  className="object-contain"
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
                className="font-bold text-[var(--color-primary)]"
                style={{ fontSize: "16px" }}
              >
                3개 이름
              </span>
              <span
                className="text-[var(--color-ink-muted)]"
                style={{ fontSize: "11px" }}
              >
                2024.06.11 분석
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
                  className="object-contain"
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
                className="font-bold text-[var(--color-primary)]"
                style={{ fontSize: "16px" }}
              >
                2장
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
                  className="object-contain"
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
                className="font-bold text-[var(--color-ink)]"
                style={{ fontSize: "16px" }}
              >
                9,900원
              </span>
              <span
                className="text-[var(--color-ink-muted)]"
                style={{ fontSize: "11px" }}
              >
                2024.06.10
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
