"use client";

import { useEffect, useState } from "react";
import { Check, CornerDownRight, MessageSquare } from "lucide-react";

import SubPageHeader from "../../_components/SubPageHeader";
import RowSkeleton from "../../_components/RowSkeleton";
import StatusBadge, { type BadgeTone } from "../../_components/StatusBadge";
import { formatDate } from "@/lib/mypage/summary";
import {
  createInquiry,
  getInquiries,
  INQUIRY_CATEGORIES,
  INQUIRY_STATUS_LABEL,
  MESSAGE_MAX,
  MESSAGE_MIN,
  type InquiryCategory,
  type InquiryItem,
  type InquiryStatus,
} from "@/lib/mypage/inquiries";

const STATUS_TONE: Record<InquiryStatus, BadgeTone> = {
  RECEIVED: "amber",
  IN_PROGRESS: "amber",
  ANSWERED: "green",
};

export default function InquiryView({ userId }: { userId: string }) {
  const [category, setCategory] = useState<InquiryCategory>("ETC");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);

  const [items, setItems] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    getInquiries()
      .then((rows) => {
        if (alive) setItems(rows);
      })
      .catch((e) => {
        if (alive) setLoadError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loadError) throw loadError;

  const trimmed = message.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MESSAGE_MIN;
  const canSubmit =
    !submitting && trimmed.length >= MESSAGE_MIN && trimmed.length <= MESSAGE_MAX;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await createInquiry({ userId, category, message });

      // 등록 성공 — 목록을 다시 읽어 서버가 확정한 값(생성 시각·상태)을 반영한다.
      setMessage("");
      setCategory("ETC");
      setJustSent(true);
      setItems(await getInquiries());
    } catch (e) {
      // 사용자에게는 일반 문구를 보이되, 원인은 콘솔에 남긴다.
      // (권한 누락 같은 문제는 메시지 없이는 진단할 수 없다)
      console.error("[inquiry] 등록 실패:", e);
      setSubmitError("문의를 보내지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col pb-20">
      <SubPageHeader title="문의하기" />

      <div className="px-5 pt-4 flex flex-col gap-6">
        {/* ── 문의 작성 ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block font-semibold text-ink text-body mb-2">
              문의 유형
            </label>
            <div className="flex flex-wrap gap-2">
              {INQUIRY_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  aria-pressed={category === c.value}
                  className="px-3 py-[6px] font-medium transition-colors"
                  style={{
                    fontSize: "13px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor:
                      category === c.value
                        ? "var(--color-primary)"
                        : "transparent",
                    color:
                      category === c.value ? "#fff" : "var(--color-ink-muted)",
                    border:
                      category === c.value
                        ? "none"
                        : "1px solid var(--color-divider)",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            {/* 최소 글자 수는 입력 전부터 보여야 한다.
                다 쓰고 나서야 알게 되면 다시 손봐야 한다. */}
            <label
              htmlFor="inquiry-message"
              className="flex items-baseline gap-1.5 font-semibold text-ink text-body mb-2"
            >
              문의 내용
              <span className="font-normal text-ink-muted text-[11px]">
                {MESSAGE_MIN}자 이상
              </span>
            </label>
            <textarea
              id="inquiry-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setJustSent(false);
              }}
              maxLength={MESSAGE_MAX}
              rows={6}
              placeholder={`어떤 점이 궁금하신가요? ${MESSAGE_MIN}자 이상 자세히 적어주시면 더 빠르게 도와드릴 수 있어요.`}
              className="w-full bg-surface border border-divider p-3 text-ink text-caption leading-relaxed resize-none outline-none focus:border-primary"
              style={{ borderRadius: "var(--radius-md)" }}
            />
            <div className="flex items-center justify-between gap-2 mt-1">
              <span
                className={`text-[11px] ${tooShort ? "text-[#B3261E]" : "text-ink-light"}`}
              >
                {tooShort
                  ? `${MESSAGE_MIN - trimmed.length}자 더 입력해주세요`
                  : ""}
              </span>
              <span className="text-ink-light text-[11px] shrink-0">
                {trimmed.length}/{MESSAGE_MAX}
              </span>
            </div>
          </div>

          {submitError && (
            <p className="text-[#B3261E] text-caption" role="alert">
              {submitError}
            </p>
          )}

          {justSent && (
            <p
              className="flex items-center gap-1 text-[#2E7D32] text-caption"
              role="status"
            >
              <Check size={14} />
              문의가 접수됐어요. 순서대로 확인하고 답변드릴게요.
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-[52px] flex items-center justify-center rounded-lg bg-primary font-semibold text-white shadow-btn disabled:opacity-40 disabled:shadow-none"
          >
            {submitting ? "보내는 중…" : "문의 보내기"}
          </button>
        </form>

        {/* ── 내 문의 내역 ── */}
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-ink text-body">내 문의 내역</h2>

          {loading &&
            Array.from({ length: 2 }).map((_, i) => <RowSkeleton key={i} />)}

          {!loading && items.length === 0 && (
            <p className="text-ink-muted text-caption py-6 text-center">
              아직 남긴 문의가 없어요.
            </p>
          )}

          {!loading &&
            items.map((item) => (
              <div
                key={item.id}
                className="bg-surface border border-primary-pale p-4"
                style={{ borderRadius: "var(--radius-lg)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={14} className="text-primary shrink-0" />
                  <span className="font-semibold text-ink text-caption">
                    {item.categoryLabel}
                  </span>
                  {/* 답변이 달렸으면 status와 무관하게 답변 완료로 보여준다.
                      운영자가 answer만 채우고 status를 못 바꾼 경우에도
                      사용자가 답변을 놓치지 않게 하기 위함이다. */}
                  <StatusBadge
                    label={
                      item.answer
                        ? INQUIRY_STATUS_LABEL.ANSWERED
                        : INQUIRY_STATUS_LABEL[item.status]
                    }
                    tone={item.answer ? "green" : STATUS_TONE[item.status]}
                  />
                  <span className="ml-auto text-ink-light text-[11px] shrink-0">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
                <p className="text-ink-muted text-caption leading-relaxed break-keep whitespace-pre-wrap">
                  {item.message}
                </p>

                {item.answer && (
                  <div
                    className="mt-3 p-3 bg-surface-section"
                    style={{ borderRadius: "var(--radius-md)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CornerDownRight size={13} className="text-primary shrink-0" />
                      <span className="font-semibold text-primary text-caption">
                        답변
                      </span>
                      {item.answeredAt && (
                        <span className="ml-auto text-ink-light text-[11px] shrink-0">
                          {formatDate(item.answeredAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-ink text-caption leading-relaxed break-keep whitespace-pre-wrap">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}
