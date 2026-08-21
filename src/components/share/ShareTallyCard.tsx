"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  Clock,
  Link2Off,
  Share2,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";

import { shareOrCopy } from "@/lib/share/share-link";
import type { ShareTally } from "@/lib/share/constants";

/**
 * 소유자가 보는 집계 카드.
 *
 * 공유 중인 동안에만 결과 목록 위에 뜬다. 링크를 닫으면 카드도 사라지고
 * "가족·친구에게 물어보기" 버튼이 다시 나온다.
 *
 * 데이터는 서버 컴포넌트(마이페이지)가 넘겨주므로, 변경 후에는 상태를 직접
 * 고치지 않고 router.refresh()로 서버에서 다시 받는다.
 */
export default function ShareTallyCard({
  tally,
  // 공유 범위를 바꾸는 시트를 여는 콜백. 시트는 결과 화면이 들고 있다.
  onEditScope,
}: {
  tally: ShareTally;
  onEditScope: () => void;
}) {
  const router = useRouter();

  const [copied, setCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const daysLeft = remainingDays(tally.expiresAt);
  const topVotes = tally.ranking[0]?.voteCount ?? 0;
  // 상위 3개까지만. 20개 막대를 결과 목록 위에 세우면 정작 이름이 안 보인다.
  const top = tally.ranking.slice(0, 3);

  async function handleShare() {
    setErrorMessage(null);

    const outcome = await shareOrCopy({
      title: "첫지음",
      text: "아기 이름 후보를 골랐어요. 어떤 게 제일 좋으세요?",
      url: tally.url,
    });

    if (outcome === "error") {
      setErrorMessage("링크를 복사하지 못했어요.");
      return;
    }

    if (outcome === "copied") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleRevoke() {
    if (isRevoking) return;

    setIsRevoking(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/share/${tally.token}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setErrorMessage("공유를 중지하지 못했어요.");
        return;
      }

      setIsConfirmingRevoke(false);
      router.refresh();
    } catch {
      setErrorMessage("공유를 중지하지 못했어요.");
    } finally {
      setIsRevoking(false);
    }
  }

  async function handleDeleteComment(participantId: string) {
    if (deletingId) return;

    setDeletingId(participantId);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/share/${tally.token}/participants/${participantId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        setErrorMessage("한마디를 지우지 못했어요.");
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("한마디를 지우지 못했어요.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className="mb-4 bg-surface p-4 min-[376px]:p-5 shadow-card"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 font-bold text-ink tracking-[-0.2px] text-[15px] min-[376px]:text-[16px]">
            <Users size={16} className="text-primary" />
            가족·친구 투표
          </p>
          <p className="mt-1 text-ink-muted text-[12px] leading-[1.5]">
            {tally.voterCount > 0
              ? `${tally.voterCount}명이 투표했어요`
              : "아직 투표한 사람이 없어요"}
          </p>
        </div>
        <span className="flex items-center gap-1 shrink-0 text-ink-muted text-[11px]">
          <Clock size={12} />
          {daysLeft > 0 ? `${daysLeft}일 남음` : "오늘 닫혀요"}
        </span>
      </div>

      {/* ── 상위 3개 ── */}
      {top.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {top.map((item, index) => {
            const isTop = index === 0;
            const ratio = topVotes > 0 ? (item.voteCount / topVotes) * 100 : 0;

            return (
              <div key={item.candidateId} className="flex flex-col gap-[6px]">
                <div className="flex items-center gap-2">
                  {isTop && (
                    <span className="px-2 py-0.5 rounded-pill bg-primary text-white font-bold text-[11px]">
                      1위
                    </span>
                  )}
                  <span
                    className={[
                      "flex-1 min-w-0 truncate text-ink",
                      isTop
                        ? "font-bold text-[15px]"
                        : "font-semibold text-[14px]",
                    ].join(" ")}
                  >
                    {item.name}
                  </span>
                  <span
                    className={[
                      "shrink-0 text-[13px] font-semibold",
                      isTop ? "text-primary font-bold" : "text-ink-muted",
                    ].join(" ")}
                  >
                    {item.voteCount}표
                  </span>
                </div>
                <div className="h-2 rounded-pill bg-surface-section overflow-hidden">
                  <div
                    className={[
                      "h-full rounded-pill",
                      isTop ? "bg-primary" : "bg-[var(--color-primary-muted)]",
                    ].join(" ")}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 한마디 ── */}
      {tally.comments.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2.5 border-t border-divider pt-3.5">
          {tally.comments.map((item) => (
            <li key={item.participantId} className="flex items-start gap-2.5">
              <span className="shrink-0 px-2 py-1 rounded-pill bg-primary-pale text-primary font-bold text-[11px]">
                {item.label ?? "익명"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-ink text-[13px] leading-[1.55] break-keep">
                  {item.comment}
                </p>
                {item.votedNames.length > 0 && (
                  <p className="mt-0.5 text-ink-light text-[11px]">
                    {item.votedNames.join(" · ")}에 투표
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDeleteComment(item.participantId)}
                disabled={deletingId === item.participantId}
                aria-label="한마디 지우기"
                className="shrink-0 p-1 -mr-1 text-ink-light disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {errorMessage && (
        <p role="alert" className="mt-3 text-danger text-[12px] font-medium">
          {errorMessage}
        </p>
      )}

      {/* ── 조작 ── */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-pill bg-primary text-white font-semibold text-[13px] shadow-btn"
        >
          {copied ? <Check size={15} strokeWidth={3} /> : <Share2 size={15} />}
          {copied ? "복사했어요" : "링크 다시 공유"}
        </button>
        <button
          type="button"
          onClick={onEditScope}
          aria-label="보여줄 이름 바꾸기"
          className="h-11 w-11 shrink-0 flex items-center justify-center rounded-pill border border-divider text-ink-muted"
        >
          <SlidersHorizontal size={15} />
        </button>
        <button
          type="button"
          onClick={() => setIsConfirmingRevoke(true)}
          aria-label="공유 중지"
          className="h-11 w-11 shrink-0 flex items-center justify-center rounded-pill border border-divider text-ink-muted"
        >
          <Link2Off size={15} />
        </button>
      </div>
      <p className="mt-2 text-center text-ink-light text-[11px]">
        가운데 버튼으로 보여줄 이름을, 오른쪽 버튼으로 공유를 중지해요
      </p>

      {/* 링크를 닫으면 이미 보낸 링크가 전부 죽는다. 되돌릴 수 없으므로 한 번 묻는다. */}
      {isConfirmingRevoke && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-8">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setIsConfirmingRevoke(false)}
            className="absolute inset-0 bg-[rgba(45,37,64,0.45)]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-title"
            className="relative w-full max-w-[320px] bg-surface p-5"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p
              id="revoke-title"
              className="font-bold text-ink text-[16px] tracking-[-0.2px]"
            >
              공유를 중지할까요?
            </p>
            <p className="mt-2 text-ink-muted text-[13px] leading-[1.55] break-keep">
              이미 보낸 링크가 모두 닫혀요. 지금까지 받은 투표는 그대로
              남습니다.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingRevoke(false)}
                className="flex-1 h-11 rounded-pill border border-divider text-ink-muted font-medium text-[14px]"
              >
                그대로 두기
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isRevoking}
                className="flex-1 h-11 rounded-pill bg-danger text-white font-semibold text-[14px] disabled:opacity-60"
              >
                {isRevoking ? "중지 중…" : "중지하기"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/** 만료까지 남은 날. 오늘 닫히는 경우를 0으로 본다. */
function remainingDays(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();

  return Math.max(0, Math.ceil(diff / 86_400_000));
}
