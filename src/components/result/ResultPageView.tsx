"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Gift,
  Heart,
  Mail,
  RotateCw,
  TriangleAlert,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { scoreToLabel, scoreToStars } from "@/lib/result/score";
import StarRating from "@/components/result/StarRating";
import ShareSheet from "@/components/share/ShareSheet";
import ShareTallyCard from "@/components/share/ShareTallyCard";
import type { ShareTally } from "@/lib/share/constants";
import TagPill from "@/components/result/TagPill";
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

// 개수를 상수로 박아 두면 검증에서 후보가 걸러져 20개가 안 될 때 화면이 거짓말을 한다.
// 실제로 저장된 이름 수를 그대로 보여준다.
// nameCount가 null이면 아직 로딩 중 — "0개"를 잠깐이라도 보여주지 않는다.
const buildStats = (nameCount: number | null) => [
  {
    icon: <Gift className="size-3.5 min-[376px]:size-4" />,
    label: "분석 이름",
    value: nameCount === null ? "분석 완료" : `${nameCount}개`,
    desc: "전문가 + AI 정밀 분석",
  },
  {
    icon: <Mail className="size-3.5 min-[376px]:size-4" />,
    label: "결과 보관",
    value: "메일 발송",
    desc: "메일함에 그대로 남아요",
  },
  {
    icon: <Heart className="size-3.5 min-[376px]:size-4" />,
    label: "마음에 든 이름",
    value: "하트로 저장",
    desc: "골라서 모아보기",
  },
];

export default function ResultPageView({
  requestId,
  userId,
  // 이름 상세로 가는 경로. 결제 직후 흐름과 마이페이지 재열람 흐름의 URL이 다르므로
  // 목록을 공유하되 링크 베이스만 주입받는다.
  detailBasePath = `/upgrade/${requestId}/result`,
  // 공유는 재열람 화면(마이페이지)에서만 연다. 결제 직후 화면은 결과 확인에
  // 집중시키는 자리라 버튼을 늘리지 않는다.
  shareEnabled = false,
  // 살아 있는 공유 링크의 집계. 서버 컴포넌트가 세션 클라이언트로 읽어 넘긴다.
  // null이면 공유 중이 아니라는 뜻이고, 그때만 공유 시작 버튼을 보여준다.
  shareTally = null,
}: {
  requestId: string;
  userId: string;
  detailBasePath?: string;
  shareEnabled?: boolean;
  shareTally?: ShareTally | null;
}) {
  const [activeSort, setActiveSort] = useState<"추천도" | "가나다">("추천도");
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [names, setNames] = useState<ResultName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [hasFavoritesError, setHasFavoritesError] = useState(false); // 좋아요 조회 실패여부
  // 좋아요 요청이 응답 대기 중인 후보 id 집합. 같은 하트 재클릭을 조용히 무시.
  const [togglingFavorites, setTogglingFavorites] = useState<Set<string>>(
    new Set(),
  );

  // 좋아요 상태 조회
  const getFavorites = useCallback(async (candidateIds: string[]) => {
    if (candidateIds.length === 0) return;
    setIsFavoritesLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("name_favorites")
        .select("name_candidate_id")
        .in("name_candidate_id", candidateIds);
      if (error) throw error;

      setFavorites(
        new Set((data ?? []).map((r) => r.name_candidate_id as string)),
      );
      setHasFavoritesError(false);
    } catch {
      setHasFavoritesError(true);
    } finally {
      setIsFavoritesLoading(false);
    }
  }, []);

  // 작명 결과 조회
  // rank = score 내림차순, 동점이면 sound_score 내림차순으로 확정한 순위.
  useEffect(() => {
    let cancelled = false;

    async function getResult() {
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
        await getFavorites(rows.map((r) => r.id as string));
      } catch {
        if (cancelled) return;
        // 이름 목록 조회 에러 + 네트워크/예상치 못한 예외를 한 곳에서 처리.
        // 렌더 단계에서 다시 throw → 라우트의 error.tsx가 처리한다.
        setLoadError(new Error("결과를 불러오지 못했습니다"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    getResult();

    return () => {
      cancelled = true;
    };
  }, [requestId, getFavorites]);

  // 좋아요 토글: 낙관적 반영 → 백그라운드 insert/delete → 실패 시 롤백.
  async function toggleFavorite(candidateId: string) {
    // 하트 상태를 못 불러온 동안엔 토글 금지
    if (hasFavoritesError) return;
    // 처리 중이면 무시
    if (togglingFavorites.has(candidateId)) return;

    setTogglingFavorites((p) => new Set(p).add(candidateId));

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
      setTogglingFavorites((p) => {
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

  // 득표 1위 이름. 동점이면 집계 쪽에서 이미 하나로 정해져 온다.
  // 표가 하나도 없으면 뱃지를 달지 않는다.
  const topVotedId =
    shareTally && (shareTally.ranking[0]?.voteCount ?? 0) > 0
      ? shareTally.ranking[0].candidateId
      : null;

  // 조회 실패 시 렌더 중 throw → 가장 가까운 error.tsx 경계가 잡는다.
  if (loadError) throw loadError;

  return (
    <div className="px-5">
      {/* ── 커스텀 상단 바 ── */}
      <div className="flex items-center justify-between mb-1">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo.png"
            alt="첫지음 로고"
            className="py-3"
            style={{ width: "80px", height: "auto" }}
          />
        </Link>
        {/* 부부 공유 기능을 접고 좋아요 보관함 방향으로 정리한 자리 */}
        <Link
          href="/bookmarks"
          className="flex items-center gap-[5px] font-medium border border-primary text-primary px-3 py-[6px] shrink-0"
          style={{ fontSize: "12px", borderRadius: "var(--radius-pill)" }}
        >
          <Heart size={13} />
          보관함
        </Link>
      </div>

      {/* ── 히어로 카드 ── */}
      <div className="relative mt-5 mb-4">
        <div
          className="bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          {/* 상단 콘텐츠 — 텍스트 좌, 이미지 우 */}
          <div className="p-4 min-[376px]:p-5 flex items-center gap-2 min-[376px]:gap-3">
            <div className="flex-1 min-w-0">
              <span className="inline-block font-semibold text-primary mb-1.5 min-[376px]:mb-2 text-[12px] min-[376px]:text-caption">
                정밀 분석 완료! 🎉
              </span>
              <h1 className="font-extrabold text-ink leading-[1.3] tracking-[-0.5px] break-keep mb-2 min-[376px]:mb-3 text-[20px] min-[376px]:text-[24px] min-[430px]:text-[28px]">
                정성껏 분석한
                <br />
                <span className="text-primary">
                  {isLoading ? "엄선한" : `${names.length}개의`} 이름을
                </span>
                <br />
                확인해보세요
              </h1>
              <p className="text-ink-muted leading-[1.6] break-keep text-[11px] min-[376px]:text-[12px] min-[430px]:text-caption">
                AI와 전문가가 사주, 음양, 발음, 의미까지 꼼꼼하게 분석하여
                엄선한 이름입니다.
              </p>
            </div>
            <div className="shrink-0">
              <Image
                src="/assets/premium/premium_star.png"
                alt="별"
                width={120}
                height={120}
                className="w-[84px] min-[376px]:w-[100px] min-[430px]:w-[120px] h-auto"
              />
            </div>
          </div>

          {/* 하단 스탯 행 */}
          <div className="border-t border-[var(--color-divider)] flex divide-x divide-[var(--color-divider)]">
            {buildStats(isLoading ? null : names.length).map((s) => (
              <div
                key={s.label}
                className="flex-1 min-w-0 flex flex-col items-center gap-[5px] min-[376px]:gap-[6px] py-3 px-1 min-[376px]:px-2"
              >
                <div className="flex items-center justify-center rounded-full bg-primary-pale size-6 min-[376px]:size-7">
                  <span className="text-primary">{s.icon}</span>
                </div>
                <span className="text-ink-muted text-[9px] min-[376px]:text-[10px]">
                  {s.label}
                </span>
                <span className="font-bold text-ink text-center break-keep leading-[1.3] text-[12px] min-[376px]:text-caption">
                  {s.value}
                </span>
                <span className="text-ink-muted text-center leading-[1.4] break-keep text-[9px] min-[376px]:text-[10px]">
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 공유 집계 ── */}
      {shareEnabled && shareTally && (
        <ShareTallyCard
          tally={shareTally}
          onEditScope={() => setIsShareOpen(true)}
        />
      )}

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
        {/* 필터 현재 필요 없으므로 주석처리.
            되살릴 때 lucide-react의 SlidersHorizontal import도 함께 복구할 것. */}
        {/* <button
          className="flex items-center gap-1 border border-[var(--color-divider)] px-3 py-[6px] text-[var(--color-ink-muted)]"
          style={{ fontSize: "13px", borderRadius: "var(--radius-pill)" }}
        >
          <SlidersHorizontal size={15} />
          필터
        </button> */}
      </div>

      {/* ── 공유하기 ── */}
      {/* 공유 중이면 집계 카드가 링크 재공유까지 맡는다. 시작 버튼을 함께
          띄우면 같은 링크를 만드는 입구가 둘이 되어 헷갈린다. */}
      {shareEnabled && !isLoading && names.length > 0 && !shareTally && (
        <button
          type="button"
          onClick={() => setIsShareOpen(true)}
          className="mb-3 w-full flex items-center justify-center gap-1.5 border border-primary bg-surface text-primary font-semibold text-caption min-[376px]:text-btn rounded-pill py-3"
        >
          <Users className="size-4 min-[376px]:size-[18px]" />
          가족·친구에게 물어보기
        </button>
      )}

      {/* ── 좋아요 조회 실패 배너 ── */}
      {!isLoading && hasFavoritesError && (
        <div
          className="flex items-center gap-2 mb-3 px-3 py-[10px] bg-[#FFF8E1] text-[#8D6E00]"
          style={{ borderRadius: "var(--radius-md)", fontSize: "12px" }}
          role="alert"
        >
          <TriangleAlert size={15} className="shrink-0" />
          <span className="flex-1 leading-[1.4]">
            좋아요 정보를 가져오지 못했습니다.
          </span>
          <button
            onClick={() => getFavorites(names.map((n) => n.id))}
            disabled={isFavoritesLoading}
            className="flex items-center gap-1 font-medium shrink-0 disabled:opacity-50"
          >
            <RotateCw size={13} />
            다시 시도
          </button>
        </div>
      )}

      {/* ── 이름 카드 리스트 ── */}
      <div className="flex flex-col gap-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <NameCardSkeleton key={i} />)}
        {!isLoading &&
          sortedNames.map((item) => (
            <div
              key={item.id}
              className="bg-surface border border-primary-pale p-3 min-[376px]:p-4"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <div className="flex items-stretch gap-2 min-[376px]:gap-3">
                {/* 순위 뱃지 */}
                <div className="flex items-center justify-center rounded-full bg-primary-pale shrink-0 mt-[2px] size-7 min-[376px]:size-8">
                  <p className="font-bold text-primary text-[12px] min-[376px]:text-caption">
                    {item.rank}
                  </p>
                </div>

                {/* 좌측 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 min-[376px]:gap-2 mb-[3px]">
                    <span className="font-extrabold text-ink tracking-[-0.3px] text-[18px] min-[376px]:text-[20px]">
                      {item.name}
                    </span>
                    <span className="text-ink-muted truncate text-[12px] min-[376px]:text-caption">
                      {item.hanja}
                    </span>
                    {item.id === topVotedId && (
                      <span className="shrink-0 px-2 py-0.5 rounded-pill bg-primary text-white font-bold text-[10px] min-[376px]:text-[11px]">
                        투표 1위
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 min-[376px]:gap-[6px] mb-[6px]">
                    <StarRating stars={item.stars} />
                    <span className="text-ink-muted whitespace-nowrap text-[10px] min-[376px]:text-nav">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-ink-muted mb-2 leading-[1.5] break-keep text-[11px] min-[376px]:text-tag">
                    {item.desc}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <TagPill key={tag} label={tag} />
                    ))}
                  </div>
                </div>

                {/* 우측 고정 컬럼 */}
                <div className="flex flex-col items-center justify-between shrink-0 w-[52px] min-[376px]:w-16 pl-1 min-[376px]:pl-2">
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    disabled={
                      hasFavoritesError || togglingFavorites.has(item.id)
                    }
                    aria-pressed={favorites.has(item.id)}
                    aria-label={favorites.has(item.id) ? "저장 해제" : "저장"}
                    className={`flex flex-col items-center gap-0.5 min-[376px]:gap-1 text-primary min-h-[44px] justify-center ${
                      hasFavoritesError ? "opacity-40" : ""
                    }`}
                  >
                    <Heart
                      className="size-5 min-[376px]:size-[22px]"
                      fill={
                        favorites.has(item.id) ? "var(--color-primary)" : "none"
                      }
                    />
                    <span className="font-medium text-[10px] min-[376px]:text-nav">
                      {favorites.has(item.id) ? "저장됨" : "저장"}
                    </span>
                  </button>
                  <Link
                    href={`${detailBasePath}/${item.id}`}
                    className="flex items-end justify-center gap-[2px] text-primary min-h-[44px] pb-1"
                  >
                    <span className="font-medium whitespace-nowrap text-[10px] min-[376px]:text-nav">
                      자세히
                    </span>
                    <ChevronRight className="mb-0.5 size-3 min-[376px]:size-[13px]" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>

      {isShareOpen && (
        <ShareSheet
          requestId={requestId}
          names={sortedNames.map((item) => ({
            id: item.id,
            name: item.name,
            hanja: item.hanja,
          }))}
          activeCandidateIds={shareTally?.candidateIds ?? null}
          isEditingScope={!!shareTally}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}

function NameCardSkeleton() {
  return (
    <div
      className="bg-surface border border-primary-pale p-3 min-[376px]:p-4 animate-pulse"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="flex items-stretch gap-2 min-[376px]:gap-3">
        {/* 순위 뱃지 */}
        <div className="rounded-full bg-primary-pale shrink-0 mt-[2px] size-7 min-[376px]:size-8" />

        {/* 좌측 정보 */}
        <div className="flex-1 min-w-0">
          {/* 이름 행 */}
          <div className="flex items-center gap-1.5 min-[376px]:gap-2 mb-[3px] h-[28px] min-[376px]:h-[32px]">
            <div className="h-5 min-[376px]:h-6 w-[34px] rounded bg-divider" />
            <div className="h-[15px] min-[376px]:h-[16px] w-[22px] rounded bg-divider" />
          </div>
          {/* 별점 */}
          <div className="h-[16px] min-[376px]:h-[17.594px] w-full max-w-[150px] rounded bg-divider mb-[6px]" />
          {/* 설명 */}
          <div className="h-[17px] min-[376px]:h-[18px] w-full max-w-[230px] rounded bg-divider mb-2" />
          {/* 태그 */}
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[22px] min-[376px]:h-[23.59px] w-[46px] min-[376px]:w-[50px] rounded-full bg-divider"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

