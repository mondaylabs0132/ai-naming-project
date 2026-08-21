"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Users, X } from "lucide-react";

import TagPill from "@/components/result/TagPill";
import {
  MAX_COMMENT_LENGTH,
  MAX_VOTER_LABEL_LENGTH,
  MAX_VOTES_PER_VOTER,
  VOTER_LABEL_PRESETS,
  type ShareCandidate,
} from "@/lib/share/constants";

/** 프리셋 대신 직접 쓰겠다는 선택지 */
const CUSTOM_LABEL = "__custom__";

export default function ShareVoteView({
  token,
  candidates,
  voterCount,
}: {
  token: string;
  candidates: ShareCandidate[];
  voterCount: number;
}) {
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [labelChoice, setLabelChoice] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      // 이미 3개를 골랐으면 조용히 무시하지 않고 가장 오래된 선택을 밀어낸다.
      // "왜 안 눌리지?" 하는 상태를 만들지 않는 편이 낫다.
      if (prev.length >= MAX_VOTES_PER_VOTER) return [...prev.slice(1), id];
      return [...prev, id];
    });
  };

  async function handleSubmit() {
    if (selected.length === 0 || isSubmitting) return;

    const label =
      labelChoice === CUSTOM_LABEL ? customLabel.trim() : labelChoice;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/share/${token}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateIds: selected,
          voterLabel: label || null,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrorMessage(body?.error ?? "투표하지 못했어요.");
        return;
      }

      // 서버 컴포넌트를 다시 그려 집계 화면으로 넘어간다.
      router.refresh();
    } catch {
      setErrorMessage("투표하지 못했어요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedNames = candidates
    .filter((candidate) => selected.includes(candidate.id))
    .map((candidate) => candidate.fullName);

  return (
    <div className="px-5 pb-32">
      <div className="pt-4 pb-3.5">
        <span className="font-bold text-ink tracking-[-0.2px] text-[15px]">
          첫지음
        </span>
      </div>

      {/* ── 헤더 카드 ── */}
      <div
        className="bg-surface p-5 shadow-card"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <h1 className="font-bold text-ink leading-[1.35] tracking-[-0.4px] break-keep text-[22px]">
          어떤 이름이
          <br />
          제일 잘 어울릴까요?
        </h1>
        <p className="mt-2.5 text-ink-muted text-caption leading-[1.6] break-keep">
          아기 이름을 짓는 중이에요. 엄마·아빠가 고른 후보 {candidates.length}개
          중에서 마음에 드는 이름을 {MAX_VOTES_PER_VOTER}개까지 골라주세요.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={[
              "px-3 py-1.5 text-[12px] font-semibold rounded-pill",
              selected.length > 0
                ? "bg-primary-pale text-primary"
                : "bg-surface-section text-ink-muted",
            ].join(" ")}
          >
            {selected.length} / {MAX_VOTES_PER_VOTER} 선택
          </span>
          {voterCount > 0 && (
            <span className="flex items-center gap-1.5 text-ink-muted text-[12px]">
              <Users size={14} />
              지금까지 {voterCount}명이 투표했어요
            </span>
          )}
        </div>
      </div>

      {/* ── 이름 카드 ── */}
      <div className="mt-3.5 flex flex-col gap-2.5">
        {candidates.map((candidate) => {
          const isPicked = selected.includes(candidate.id);

          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => toggle(candidate.id)}
              aria-pressed={isPicked}
              className={[
                "w-full flex items-center gap-3 text-left bg-surface transition-colors",
                isPicked
                  ? "border-2 border-primary p-[15px] shadow-card-md"
                  : "border border-primary-pale p-4",
              ].join(" ")}
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-ink tracking-[-0.3px] text-[22px]">
                    {candidate.fullName}
                  </span>
                  <span className="text-ink-muted text-caption truncate">
                    {candidate.hanja}
                  </span>
                </div>
                <p className="text-ink-muted text-[12px] leading-[1.5] break-keep">
                  {candidate.summary}
                </p>
                {candidate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {candidate.tags.map((tag) => (
                      <TagPill key={tag} label={tag} />
                    ))}
                  </div>
                )}
              </div>

              <span className="size-11 shrink-0 flex items-center justify-center">
                <span
                  className={[
                    "size-7 rounded-full flex items-center justify-center",
                    isPicked
                      ? "bg-primary"
                      : "border-2 border-[var(--color-primary-muted)]",
                  ].join(" ")}
                >
                  {isPicked && (
                    <Check size={15} strokeWidth={3.5} className="text-white" />
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 하단 고정 바 ── */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-150 bg-surface px-5 pt-3.5"
        style={{
          boxShadow: "0px -1px 12px rgba(0,0,0,0.06)",
          paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        <p className="text-center text-ink-muted text-[12px]">
          {selected.length === 0
            ? "마음에 드는 이름을 1개 이상 골라주세요"
            : `${selectedNames.join(" · ")} 선택됨`}
        </p>
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={selected.length === 0}
          className={[
            "mt-2.5 w-full h-13 flex items-center justify-center font-semibold text-btn rounded-pill transition-colors",
            selected.length > 0
              ? "bg-primary text-white shadow-btn"
              : "bg-primary-pale text-ink-light",
          ].join(" ")}
        >
          투표하기
        </button>
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setIsConfirmOpen(false)}
            className="absolute inset-0 bg-[rgba(45,37,64,0.45)]"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vote-confirm-title"
            className="relative w-full max-w-150 bg-surface px-5 pt-2.5 max-h-[90vh] overflow-y-auto"
            style={{
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              boxShadow: "0px -8px 32px rgba(124, 111, 205, 0.18)",
              paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
            }}
          >
            <div className="mx-auto h-1 w-10 rounded-pill bg-divider" />

            <div className="mt-4 flex items-start justify-between gap-3">
              <h2
                id="vote-confirm-title"
                className="font-bold text-ink tracking-[-0.2px] text-[16px]"
              >
                이 이름을 고르셨어요
              </h2>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                aria-label="닫기"
                className="shrink-0 text-ink-muted -mr-1 -mt-1 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {selectedNames.map((name) => (
                <span
                  key={name}
                  className="px-3.5 py-2 rounded-pill bg-primary-pale text-primary font-bold text-[14px]"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* ── 관계 ── */}
            <div className="mt-[18px]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-ink text-caption">
                  누구라고 표시할까요?
                </span>
                <span className="text-ink-muted text-[11px]">선택</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {VOTER_LABEL_PRESETS.map((preset) => (
                  <LabelChip
                    key={preset}
                    label={preset}
                    isActive={labelChoice === preset}
                    onClick={() =>
                      setLabelChoice((prev) => (prev === preset ? null : preset))
                    }
                  />
                ))}
                <LabelChip
                  label="직접 입력"
                  isActive={labelChoice === CUSTOM_LABEL}
                  isDashed
                  onClick={() =>
                    setLabelChoice((prev) =>
                      prev === CUSTOM_LABEL ? null : CUSTOM_LABEL,
                    )
                  }
                />
              </div>
              {labelChoice === CUSTOM_LABEL && (
                <input
                  type="text"
                  value={customLabel}
                  onChange={(event) => setCustomLabel(event.target.value)}
                  maxLength={MAX_VOTER_LABEL_LENGTH}
                  placeholder="예: 이모"
                  aria-label="표시할 이름"
                  className="mt-2 w-full h-12 px-3.5 border border-divider text-ink text-[15px] outline-none focus:border-primary"
                  style={{ borderRadius: "var(--radius-md)" }}
                />
              )}
            </div>

            {/* ── 한마디 ── */}
            <div className="mt-[18px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-ink text-caption">
                    한마디 남기기
                  </span>
                  <span className="text-ink-muted text-[11px]">선택</span>
                </div>
                <span className="text-ink-light text-[11px]">
                  {comment.length} / {MAX_COMMENT_LENGTH}
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                rows={2}
                aria-label="한마디"
                className="mt-2 w-full px-3.5 py-3 border border-divider text-ink text-[14px] leading-[1.55] outline-none resize-none focus:border-primary"
                style={{ borderRadius: "var(--radius-md)" }}
              />
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="mt-3 text-danger text-caption font-medium"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-[18px] w-full h-13 flex items-center justify-center font-semibold text-btn rounded-pill bg-primary text-white shadow-btn disabled:opacity-60"
            >
              {isSubmitting ? "보내는 중…" : "투표 완료하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LabelChip({
  label,
  isActive,
  isDashed = false,
  onClick,
}: {
  label: string;
  isActive: boolean;
  isDashed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={[
        "px-3.5 py-2.5 text-caption rounded-pill transition-colors",
        isActive
          ? "border-[1.5px] border-primary bg-primary-pale text-primary font-semibold"
          : isDashed
            ? "border border-dashed border-[var(--color-primary-muted)] text-ink-muted"
            : "border border-divider text-ink-muted",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
