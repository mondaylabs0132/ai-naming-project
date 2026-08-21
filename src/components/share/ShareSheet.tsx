"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Lock, Share2, X } from "lucide-react";

import { shareOrCopy } from "@/lib/share/share-link";

type ShareName = {
  id: string;
  name: string;
  hanja: string;
};

type Mode = "all" | "pick";

export default function ShareSheet({
  requestId,
  names,
  onClose,
}: {
  requestId: string;
  names: ShareName[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 링크를 만든 뒤 복사까지 끝났을 때만 채워진다. 네이티브 시트로 넘어간
  // 경우에는 시트가 결과를 알려주므로 여기서 따로 표시하지 않는다.
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // 시트가 열려 있는 동안 뒤쪽 목록이 스크롤되지 않게 막는다.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canSubmit =
    !isSubmitting && (mode === "all" || selected.size > 0) && names.length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          candidateIds: mode === "all" ? null : [...selected],
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErrorMessage(body?.error ?? "공유 링크를 만들지 못했어요.");
        return;
      }

      const share = (await response.json()) as { url: string };
      const outcome = await shareOrCopy({
        title: "첫지음",
        text: "아기 이름 후보를 골랐어요. 어떤 게 제일 좋으세요?",
        url: share.url,
      });

      if (outcome === "error") {
        // 링크는 만들어졌으니 주소라도 보여준다. 여기서 실패로 끝내면
        // 링크만 생기고 사용자는 아무것도 못 받는 상태가 된다.
        setCopiedUrl(share.url);
        setErrorMessage("링크를 복사하지 못했어요. 아래 주소를 복사해주세요.");
        return;
      }

      if (outcome === "copied") {
        setCopiedUrl(share.url);
        return;
      }

      onClose();
    } catch {
      setErrorMessage("공유 링크를 만들지 못했어요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // 하단 탭 바(BottomNav)가 z-50이라 같은 층에 두면 DOM 순서상 탭 바가
    // 시트 위에 그려져 CTA를 가린다. 모달은 탭 바까지 덮는 게 맞다 —
    // 딤 영역 아래로 탭이 눌리는 것도 막아야 한다.
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(45,37,64,0.45)]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
        className="relative w-full max-w-150 bg-surface px-5 pt-2.5 max-h-[90vh] overflow-y-auto"
        style={{
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          boxShadow: "0px -8px 32px rgba(124, 111, 205, 0.18)",
          // iOS 홈 인디케이터에 CTA가 물리지 않게 안전영역만큼 더 띄운다.
          paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto h-1 w-10 rounded-pill bg-divider" />

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="share-sheet-title"
              className="font-bold text-ink tracking-[-0.3px] text-[18px]"
            >
              가족·친구에게 물어보기
            </h2>
            <p className="mt-1 text-ink-muted text-caption leading-[1.5]">
              링크를 받은 사람이 마음에 드는 이름을 골라줘요
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 text-ink-muted -mr-1 -mt-1 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── 공유 범위 ── */}
        <div className="mt-[18px]">
          <p className="font-semibold text-ink text-caption">
            어떤 이름을 보여줄까요?
          </p>
          <div className="mt-2.5 flex gap-2">
            <ModeChip
              label={`전체 ${names.length}개`}
              isActive={mode === "all"}
              onClick={() => setMode("all")}
            />
            <ModeChip
              label="직접 고르기"
              isActive={mode === "pick"}
              onClick={() => setMode("pick")}
            />
          </div>

          {mode === "pick" && (
            <>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-ink-muted text-[12px]">
                  보여줄 이름을 골라주세요
                </span>
                <span className="font-semibold text-primary text-[12px]">
                  {selected.size} / {names.length} 선택
                </span>
              </div>
              <div className="mt-2.5 max-h-[152px] overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {names.map((item) => {
                    const isPicked = selected.has(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-pressed={isPicked}
                        className={[
                          "flex items-center gap-1 px-3 py-2 text-caption rounded-pill transition-colors",
                          isPicked
                            ? "bg-primary-pale text-primary font-semibold"
                            : "border border-divider text-ink-muted",
                        ].join(" ")}
                      >
                        {isPicked && <Check size={13} strokeWidth={3} />}
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 공개 범위 고지 ── */}
        <div
          className="mt-[18px] flex items-start gap-2.5 bg-surface-section p-3.5"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <Lock size={16} className="shrink-0 mt-px text-primary" />
          <p className="text-ink text-[12px] leading-[1.55]">
            이름·한자·의미 요약만 공개돼요.
            <br />
            생년월일·출생시각·상세 해설은 보이지 않아요.
          </p>
        </div>

        <div className="mt-[18px] flex items-center gap-1.5">
          <Clock size={14} className="shrink-0 text-ink-muted" />
          <span className="text-ink-muted text-[12px]">
            링크는 30일 뒤 자동으로 닫혀요. 언제든 직접 닫을 수도 있어요.
          </span>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-3 text-danger text-caption font-medium">
            {errorMessage}
          </p>
        )}

        {copiedUrl && (
          <div
            className="mt-3 bg-surface-section p-3 break-all text-ink text-[12px]"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            {copiedUrl}
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={[
            "mt-[18px] w-full h-13 flex items-center justify-center gap-2 font-semibold text-btn rounded-pill transition-colors",
            canSubmit
              ? "bg-primary text-white shadow-btn"
              : "bg-primary-pale text-ink-light",
          ].join(" ")}
        >
          {copiedUrl ? (
            <Check size={18} strokeWidth={3} />
          ) : (
            <Share2 size={18} />
          )}
          {isSubmitting
            ? "링크 만드는 중…"
            : copiedUrl
              ? "링크를 복사했어요"
              : "링크 만들고 공유하기"}
        </button>
      </div>
    </div>
  );
}

function ModeChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={[
        "flex-1 py-2.5 px-2 text-caption rounded-pill transition-colors",
        isActive
          ? "border-[1.5px] border-primary bg-primary-pale text-primary font-semibold"
          : "border border-divider bg-surface text-ink-muted font-medium",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
