"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Heart, RotateCw } from "lucide-react";

import StarRating from "@/components/result/StarRating";
import TagPill from "@/components/result/TagPill";
import { formatDate } from "@/lib/mypage/summary";
import {
  addBookmark,
  getBookmarks,
  removeBookmark,
  type BookmarkItem,
} from "@/lib/bookmarks/list";

type Sort = "최근" | "추천도";

// 저장 해제 후 되돌릴 수 있는 시간. 오조작 복구용이라 짧게 둔다.
const UNDO_MS = 5000;

export default function BookmarkListView({ userId }: { userId: string }) {
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [activeSort, setActiveSort] = useState<Sort>("최근");

  // 저장 해제 요청이 응답 대기 중인 후보 id. 같은 하트 재클릭을 무시한다.
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  // 방금 해제한 항목 — 되돌리기 배너에 쓴다.
  const [undo, setUndo] = useState<BookmarkItem | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    getBookmarks()
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((e) => {
        if (!cancelled)
          setLoadError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // 언마운트 시 남은 되돌리기 타이머 정리
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  // 조회 실패는 렌더 중 throw → error.tsx가 처리
  if (loadError) throw loadError;

  // 저장 해제: 낙관적 제거 → 백그라운드 delete → 실패 시 원위치 복원
  async function handleRemove(item: BookmarkItem) {
    if (removing.has(item.id)) return;
    setRemoving((p) => new Set(p).add(item.id));

    // 복구 위치만 기억하고 목록 전체는 스냅샷하지 않는다.
    // 다른 항목의 삭제가 겹친 상태에서 옛 스냅샷으로 되돌리면
    // 뒤 요청이 지운 항목이 화면에 되살아난다.
    const index = items.findIndex((i) => i.id === item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    try {
      await removeBookmark(item.id);

      // 성공했을 때만 되돌리기를 제안한다 (실패는 이미 원복됐으므로)
      if (undoTimer.current) clearTimeout(undoTimer.current);
      setUndo(item);
      undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
    } catch {
      // 실패한 항목 하나만 원래 자리에 되돌린다.
      setItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        const next = [...prev];
        next.splice(index < 0 ? next.length : Math.min(index, next.length), 0, item);
        return next;
      });
    } finally {
      setRemoving((p) => {
        const next = new Set(p);
        next.delete(item.id);
        return next;
      });
    }
  }

  // 되돌리기: 다시 저장하고 목록에 복귀시킨다.
  async function handleUndo() {
    if (!undo) return;
    const target = undo;
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);

    try {
      await addBookmark(userId, target.id);
      setItems((prev) =>
        prev.some((i) => i.id === target.id) ? prev : [target, ...prev],
      );
    } catch {
      // 복구 실패 시 서버 상태(해제됨)를 신뢰하고 목록은 그대로 둔다.
    }
  }

  const sorted = useMemo(() => {
    const arr = [...items];
    if (activeSort === "추천도") {
      arr.sort((a, b) => b.score - a.score);
    }
    // "최근"은 조회 순서(created_at 내림차순)를 그대로 쓴다.
    return arr;
  }, [items, activeSort]);

  return (
    <div className="px-5 pb-20">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between gap-2 pt-5 pb-3">
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-bold text-ink text-page-title truncate">
            보관함
          </span>
          <Image
            src="/assets/purple_heart.png"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="inline-block h-7 w-7 shrink-0"
          />
        </div>
        {!isLoading && items.length > 0 && (
          <span className="text-ink-muted text-caption shrink-0">
            {items.length}개 저장됨
          </span>
        )}
      </div>

      {!isLoading && items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── 정렬 탭 ── */}
          <div className="flex gap-2 mb-3">
            {(["최근", "추천도"] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setActiveSort(sort)}
                className="px-3 py-[6px] font-medium transition-colors"
                style={{
                  fontSize: "13px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor:
                    activeSort === sort
                      ? "var(--color-primary)"
                      : "transparent",
                  color:
                    activeSort === sort ? "#fff" : "var(--color-ink-muted)",
                  border:
                    activeSort === sort
                      ? "none"
                      : "1px solid var(--color-divider)",
                }}
              >
                {sort === "최근" ? "최근 저장순" : "추천도 순"}
              </button>
            ))}
          </div>

          {/* ── 카드 리스트 ── */}
          <div className="flex flex-col gap-3">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <BookmarkCardSkeleton key={i} />
              ))}
            {!isLoading &&
              sorted.map((item) => (
                <BookmarkCard
                  key={item.id}
                  item={item}
                  isRemoving={removing.has(item.id)}
                  onRemove={() => handleRemove(item)}
                />
              ))}
          </div>
        </>
      )}

      {/* ── 되돌리기 배너 ── */}
      {undo && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[560px] flex items-center gap-3 px-4 py-3 bg-ink text-white shadow-[var(--shadow-card-md)] z-40"
          style={{ borderRadius: "var(--radius-md)" }}
          role="status"
        >
          <span className="flex-1 min-w-0 truncate text-caption">
            <span className="font-semibold">{undo.name}</span> 저장을
            해제했어요
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="flex items-center gap-1 font-semibold shrink-0 text-caption"
          >
            <RotateCw size={13} />
            되돌리기
          </button>
        </div>
      )}
    </div>
  );
}

function BookmarkCard({
  item,
  isRemoving,
  onRemove,
}: {
  item: BookmarkItem;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  return (
    <div
      className="bg-surface border border-primary-pale p-3 min-[376px]:p-4"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="flex items-stretch gap-2 min-[376px]:gap-3">
        {/* 좌측 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 min-[376px]:gap-2 mb-[3px]">
            <span className="font-extrabold text-ink tracking-[-0.3px] text-[18px] min-[376px]:text-[20px]">
              {item.name}
            </span>
            <span className="text-ink-muted truncate text-[12px] min-[376px]:text-caption">
              {item.hanja}
            </span>
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
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.map((tag) => (
              <TagPill key={tag} label={tag} />
            ))}
          </div>
          {/* 여러 분석이 한 목록에 섞이므로 출처를 밝힌다 */}
          <p className="text-ink-light text-[10px]">
            {formatDate(item.analyzedAt)} 분석
          </p>
        </div>

        {/* 우측 고정 컬럼 */}
        <div className="flex flex-col items-center justify-between shrink-0 w-[52px] min-[376px]:w-16 pl-1 min-[376px]:pl-2">
          <button
            type="button"
            onClick={onRemove}
            disabled={isRemoving}
            aria-label={`${item.name} 저장 해제`}
            className="flex flex-col items-center gap-0.5 min-[376px]:gap-1 text-primary min-h-[44px] justify-center disabled:opacity-40"
          >
            <Heart
              className="size-5 min-[376px]:size-[22px]"
              fill="var(--color-primary)"
            />
            <span className="font-medium text-[10px] min-[376px]:text-nav">
              저장됨
            </span>
          </button>

          {/* 유료 결과가 준비된 분석만 상세로 이동할 수 있다 */}
          {item.isReadable ? (
            <Link
              href={`/mypage/results/${item.requestId}/detail/${item.id}`}
              className="flex items-end justify-center gap-[2px] text-primary min-h-[44px] pb-1"
            >
              <span className="font-medium whitespace-nowrap text-[10px] min-[376px]:text-nav">
                자세히
              </span>
              <ChevronRight className="mb-0.5 size-3 min-[376px]:size-[13px]" />
            </Link>
          ) : (
            <span className="flex items-end justify-center text-ink-light min-h-[44px] pb-1 text-[10px] min-[376px]:text-nav">
              준비 중
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function BookmarkCardSkeleton() {
  return (
    <div
      className="bg-surface border border-primary-pale p-3 min-[376px]:p-4 animate-pulse"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-[376px]:gap-2 mb-[3px] h-[28px] min-[376px]:h-[32px]">
          <div className="h-5 min-[376px]:h-6 w-[34px] rounded bg-divider" />
          <div className="h-[15px] min-[376px]:h-[16px] w-[22px] rounded bg-divider" />
        </div>
        <div className="h-[16px] min-[376px]:h-[17.594px] w-full max-w-[150px] rounded bg-divider mb-[6px]" />
        <div className="h-[17px] min-[376px]:h-[18px] w-full max-w-[230px] rounded bg-divider mb-2" />
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[22px] min-[376px]:h-[23.59px] w-[46px] min-[376px]:w-[50px] rounded-full bg-divider"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
      <Image
        src="/assets/smile_heart.png"
        alt=""
        aria-hidden="true"
        width={160}
        height={160}
        className="h-auto w-32 object-contain"
      />
      <h2 className="mt-8 font-bold text-ink text-section-title">
        아직 저장한 이름이 없어요
      </h2>
      <p className="mt-3 text-ink-muted text-caption leading-relaxed break-keep">
        결과에서 하트를 누르면
        <br />
        마음에 든 이름을 여기에 모아둘 수 있어요.
      </p>
      <Link
        href="/mypage"
        className="mt-8 flex h-[52px] w-full max-w-xs items-center justify-center rounded-lg bg-primary font-semibold text-white shadow-btn"
      >
        내 분석 결과 보기
      </Link>
    </div>
  );
}
