"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Gift,
  Heart,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  StarHalf,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// name_candidates 한 행을 화면 표시용으로 매핑한 형태.
export type ResultName = {
  id: string;
  rank: number; // score 내림차순, 동점이면 sound_score 내림차순으로 확정된 순위
  name: string; // given_name_hangul
  hanja: string; // given_name_hanja
  stars: number; // score(0~100)를 0~5(0.5 단위) 별점으로 환산한 값
  label: string;
  desc: string; // meaning_summary
  tags: string[];
};

// score는 100점 만점. 별점 UI(5개)로 보여주기 위해 0~5(0.5 단위)로 환산.
function scoreToStars(score: number): number {
  const stars = Math.round(score / 10) / 2; // score/20 을 0.5 단위로 반올림
  return Math.max(0, Math.min(5, stars));
}

function scoreToLabel(score: number): string {
  if (score >= 90) return "추천도 매우 높음";
  if (score >= 70) return "추천도 높음";
  return "추천도 보통";
}

const STATS = [
  {
    icon: <Gift size={16} />,
    label: "분석 이름",
    value: "20개",
    desc: "전문가 + AI 정밀 분석",
  },
  {
    icon: <ShieldCheck size={16} />,
    label: "보관 기간",
    value: "평생",
    desc: "언제든 다시 확인 가능",
  },
  {
    icon: <Users size={16} />,
    label: "공유 가능",
    value: "부부와 공유",
    desc: "함께 선택하고 결정하세요",
  },
];

export default function ResultPageView({
  requestId,
  userId,
}: {
  requestId: string;
  userId: string;
}) {
  const [activeSort, setActiveSort] = useState<"추천도" | "가나다">("추천도");
  const [names, setNames] = useState<ResultName[]>([]);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // 좋아요 요청이 응답 대기 중인 후보 id 집합. 같은 하트 재클릭을 조용히 무시.
  const [pendingFavorites, setPendingFavorites] = useState<Set<string>>(
    new Set(),
  );

  // 작명 결과 조회
  // rank = score 내림차순, 동점이면 sound_score 내림차순으로 확정한 순위.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("name_candidates")
          .select(
            "id, given_name_hangul, given_name_hanja, meaning_summary, tags, score, sound_score",
          )
          .eq("request_id", requestId)
          .order("score", { ascending: false })
          .order("sound_score", { ascending: false });

        if (error) throw error; // 쿼리 에러를 throw로 승격 → 아래 catch로 합류
        if (cancelled) return;

        const rows = data ?? [];
        setNames(
          rows.map((row, i) => ({
            id: row.id as string,
            rank: i + 1,
            name: row.given_name_hangul as string,
            hanja: row.given_name_hanja as string,
            stars: scoreToStars(row.score as number),
            label: scoreToLabel(row.score as number),
            desc: row.meaning_summary as string,
            tags: (row.tags as string[] | null) ?? [],
          })),
        );

        // 좋아요 조회
        if (rows.length > 0) {
          const { data: favRows } = await supabase
            .from("name_favorites")
            .select("name_candidate_id")
            .in(
              "name_candidate_id",
              rows.map((r) => r.id as string),
            );
          if (cancelled) return;
          setFavorites(
            new Set((favRows ?? []).map((r) => r.name_candidate_id as string)),
          );
        }
      } catch {
        if (cancelled) return;
        // 쿼리 에러 + 네트워크/예상치 못한 예외를 한 곳에서 처리.
        // 렌더 단계에서 다시 throw → 라우트의 error.tsx가 처리한다.
        setLoadError(new Error("결과를 불러오지 못했습니다"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  // 좋아요 토글: 낙관적 반영 → 백그라운드 insert/delete → 실패 시 롤백.
  async function toggleFavorite(candidateId: string) {
    if (pendingFavorites.has(candidateId)) return; // 처리 중이면 무시
    setPendingFavorites((p) => new Set(p).add(candidateId));

    const isFav = favorites.has(candidateId);

    // 1. 낙관적 반영 — 하트 즉시 채워짐/비워짐
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });

    try {
      const supabase = createClient();
      if (isFav) {
        const { error } = await supabase
          .from("name_favorites")
          .delete()
          .eq("name_candidate_id", candidateId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("name_favorites")
          .insert({ user_id: userId, name_candidate_id: candidateId });
        if (error) throw error;
      }
    } catch {
      // 3. 실패 시 롤백 — 이전 상태로 되돌림
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(candidateId);
        else next.delete(candidateId);
        return next;
      });
    } finally {
      setPendingFavorites((p) => {
        const next = new Set(p);
        next.delete(candidateId);
        return next;
      });
    }
  }

  const sortedNames = useMemo(() => {
    const arr = [...names];
    if (activeSort === "가나다") {
      arr.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } else {
      // 추천도 순: 확정된 rank(score desc, 동점 시 sound_score desc) 오름차순
      arr.sort((a, b) => a.rank - b.rank);
    }
    return arr;
  }, [names, activeSort]);

  // 조회 실패 시 렌더 중 throw → 가장 가까운 error.tsx 경계가 잡는다.
  if (loadError) throw loadError;

  return (
    <div className="pb-[90px] px-5">
      {/* ── 커스텀 상단 바 ── */}
      <div className="flex items-center justify-between py-3 mb-1">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo.png"
            alt="첫지음 로고"
            style={{ width: "90px", height: "auto" }}
          />
        </Link>
        <button
          className="flex items-center gap-[5px] font-medium border border-[var(--color-primary)] text-[var(--color-primary)] px-3 py-[6px]"
          style={{ fontSize: "12px", borderRadius: "var(--radius-pill)" }}
        >
          <Users size={13} />
          부부와 공유
        </button>
      </div>

      {/* ── 히어로 카드 ── */}
      <div className="relative mt-5 mb-4">
        <div
          className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          {/* 상단 콘텐츠 — 텍스트 좌, 이미지 우 */}
          <div className="p-5 flex items-center gap-3">
            <div className="flex-1">
              <span
                className="inline-block font-semibold text-[var(--color-primary)] mb-2"
                style={{ fontSize: "13px" }}
              >
                정밀 분석 완료! 🎉
              </span>
              <h1
                className="font-extrabold text-[var(--color-ink)] leading-[1.3] mb-3"
                style={{
                  fontSize: "clamp(22px, 6vw, 28px)",
                  letterSpacing: "-0.5px",
                }}
              >
                정성껏 분석한
                <br />
                <span className="text-[var(--color-primary)]">
                  20개의 이름을
                </span>
                <br />
                확인해보세요
              </h1>
              <p
                className="text-[var(--color-ink-muted)] leading-[1.6]"
                style={{ fontSize: "13px" }}
              >
                AI와 전문가가 사주, 음양, 발음, 의미까지
                <br />
                꼼꼼하게 분석하여 엄선한 이름입니다.
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/assets/premium/premium_star.png"
                alt="별"
                width={120}
                height={120}
              />
            </div>
          </div>

          {/* 하단 스탯 행 */}
          <div className="border-t border-[var(--color-divider)] flex divide-x divide-[var(--color-divider)]">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex-1 flex flex-col items-center gap-[6px] py-3 px-2"
              >
                <div
                  className="flex items-center justify-center rounded-full bg-[var(--color-primary-pale)]"
                  style={{ width: "28px", height: "28px" }}
                >
                  <span className="text-[var(--color-primary)]">{s.icon}</span>
                </div>
                <span
                  className="text-[var(--color-ink-muted)]"
                  style={{ fontSize: "10px" }}
                >
                  {s.label}
                </span>
                <span
                  className="font-bold text-[var(--color-ink)]"
                  style={{ fontSize: "13px" }}
                >
                  {s.value}
                </span>
                <span
                  className="text-[var(--color-ink-muted)] text-center leading-[1.4]"
                  style={{ fontSize: "10px" }}
                >
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 정렬 탭 + 필터 ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {(["추천도", "가나다"] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setActiveSort(sort)}
              className="px-3 py-[6px] font-medium transition-colors"
              style={{
                fontSize: "13px",
                borderRadius: "var(--radius-pill)",
                backgroundColor:
                  activeSort === sort ? "var(--color-primary)" : "transparent",
                color: activeSort === sort ? "#fff" : "var(--color-ink-muted)",
                border:
                  activeSort === sort
                    ? "none"
                    : "1px solid var(--color-divider)",
              }}
            >
              {sort === "추천도" ? "추천도 순" : "이름 가나다 순"}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-1 border border-[var(--color-divider)] px-3 py-[6px] text-[var(--color-ink-muted)]"
          style={{ fontSize: "13px", borderRadius: "var(--radius-pill)" }}
        >
          <SlidersHorizontal size={15} />
          필터
        </button>
      </div>

      {/* ── 이름 카드 리스트 ── */}
      <div className="flex flex-col gap-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <NameCardSkeleton key={i} />)}
        {!isLoading &&
          sortedNames.map((item) => (
            <div
              key={item.id}
              className="bg-[var(--color-surface)] border border-[var(--color-primary-pale)] p-4"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <div className="flex items-stretch gap-3">
                {/* 순위 뱃지 */}
                <div
                  className="flex items-start justify-center rounded-full bg-[var(--color-primary-pale)] shrink-0 mt-[2px]"
                  style={{ width: "32px", height: "32px" }}
                >
                  <span
                    className="font-bold text-[var(--color-primary)] mt-[7px]"
                    style={{ fontSize: "13px" }}
                  >
                    {item.rank}
                  </span>
                </div>

                {/* 좌측 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-[3px]">
                    <span
                      className="font-extrabold text-[var(--color-ink)]"
                      style={{ fontSize: "20px", letterSpacing: "-0.3px" }}
                    >
                      {item.name}
                    </span>
                    <span
                      className="text-[var(--color-ink-muted)]"
                      style={{ fontSize: "13px" }}
                    >
                      {item.hanja}
                    </span>
                  </div>
                  <div className="flex items-center gap-[6px] mb-[6px]">
                    <StarRating stars={item.stars} />
                    <span
                      className="text-[var(--color-ink-muted)]"
                      style={{ fontSize: "11px" }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <p
                    className="text-[var(--color-ink-muted)] mb-2 leading-[1.5]"
                    style={{ fontSize: "12px" }}
                  >
                    {item.desc}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <TagPill key={tag} label={tag} />
                    ))}
                  </div>
                </div>

                {/* 우측 고정 컬럼 */}
                <div className="flex flex-col items-center justify-between shrink-0 w-16 pl-2">
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    disabled={pendingFavorites.has(item.id)}
                    aria-pressed={favorites.has(item.id)}
                    aria-label={favorites.has(item.id) ? "저장 해제" : "저장"}
                    className="flex flex-col items-center gap-1 text-[var(--color-primary)] min-h-[44px] justify-center"
                  >
                    <Heart
                      size={22}
                      fill={
                        favorites.has(item.id) ? "var(--color-primary)" : "none"
                      }
                    />
                    <span className="font-medium" style={{ fontSize: "11px" }}>
                      {favorites.has(item.id) ? "저장됨" : "저장"}
                    </span>
                  </button>
                  <Link
                    href={`/upgrade/${requestId}/result/${item.id}`}
                    className="flex items-center gap-[2px] text-[var(--color-primary)] min-h-[44px] items-end justify-center pb-1"
                  >
                    <span
                      className="font-medium"
                      style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                    >
                      자세히
                    </span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function NameCardSkeleton() {
  return (
    <div
      className="bg-[var(--color-surface)] border border-[var(--color-primary-pale)] p-4 animate-pulse"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="flex items-stretch gap-3">
        {/* 순위 뱃지 */}
        <div
          className="rounded-full bg-[var(--color-primary-pale)] shrink-0 mt-[2px]"
          style={{ width: "32px", height: "32px" }}
        />

        {/* 좌측 정보 */}
        <div className="flex-1 min-w-0">
          {/* 이름 행 */}
          <div className="flex items-center gap-2 mb-[3px] h-[32px]">
            <div className="h-6 w-[33.98px] rounded bg-[var(--color-divider)]" />
            <div className="h-[16px] w-[22.3px] rounded bg-[var(--color-divider)]" />
          </div>
          {/* 별점 */}
          <div className="h-[17.594px] w-[150.17px] rounded bg-[var(--color-divider)] mb-[6px]" />
          {/* 설명 */}
          <div className="h-[18px] w-full max-w-[230px] rounded bg-[var(--color-divider)] mb-2" />
          {/* 태그 */}
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[23.59px] w-[50px] rounded-full bg-[var(--color-divider)]"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StarRating({ stars }: { stars: number }) {
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className="flex items-center gap-[2px]">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={13} fill="#FFBA00" stroke="none" />
      ))}
      {half && <StarHalf size={13} fill="#FFBA00" stroke="none" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={13} fill="none" stroke="#FFBA00" />
      ))}
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  const isGreen = label === "사주 조화 우수";
  const isYellow = label.includes("발음") || label.includes("기운");
  if (isGreen) {
    return (
      <span className="px-2 py-[3px] text-[11px] font-medium rounded-full bg-[#E8F5E9] text-[#2E7D32]">
        {label}
      </span>
    );
  }
  if (isYellow) {
    return (
      <span className="px-2 py-[3px] text-[11px] font-medium rounded-full bg-[#FFF8E1] text-[#F57F17]">
        {label}
      </span>
    );
  }
  return (
    <span className="px-2 py-[3px] text-[11px] font-medium rounded-full bg-[var(--color-primary-pale)] text-[var(--color-primary)]">
      {label}
    </span>
  );
}
