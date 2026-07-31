"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Trash2, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type DeleteState = "confirm" | "deleting" | "failed" | "unauthorized";

export default function AccountDeletionButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState>("confirm");

  function openModal() {
    setDeleteState("confirm");
    setIsOpen(true);
  }

  function closeModal() {
    if (deleteState === "deleting") return;
    setIsOpen(false);
  }

  async function handleDelete() {
    if (deleteState === "deleting") return;

    setDeleteState("deleting");

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
      };

      if (response.status === 401 || body.code === "unauthorized") {
        setDeleteState("unauthorized");
        return;
      }

      if (!response.ok || !body.ok) {
        setDeleteState("failed");
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    } catch {
      setDeleteState("failed");
    }
  }

  function handleLogin() {
    router.replace("/login?redirectTo=/mypage");
  }

  const isDeleting = deleteState === "deleting";
  const isUnauthorized = deleteState === "unauthorized";
  const isFailed = deleteState === "failed";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full flex items-center gap-2.5 min-[376px]:gap-3 px-3 min-[376px]:px-4 py-[14px] border border-divider rounded-lg text-left"
      >
        <Trash2 size={20} className="text-danger shrink-0" />
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="font-semibold text-danger text-caption min-[376px]:text-body">
            계정 삭제
          </span>
          <span className="text-ink-muted break-keep text-nav min-[376px]:text-tag">
            계정을 삭제하면 모든 데이터가 복구되지 않습니다.
          </span>
        </span>
        <ChevronRight size={16} className="text-danger shrink-0" />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-delete-title"
            aria-describedby="account-delete-description"
            className="w-full max-w-[360px] rounded-lg bg-surface px-7 py-7.5 shadow-card-md"
          >
            <div className="mb-7">
              <div className="flex items-start justify-between gap-3">
                <h2
                  id="account-delete-title"
                  className="min-w-0 font-bold text-ink text-[18px] leading-[1.4] break-keep"
                >
                  {isUnauthorized
                    ? "다시 확인이 필요해요"
                    : "계정을 삭제하시겠어요?"}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isDeleting}
                  aria-label="닫기"
                  className="shrink-0 rounded-full text-ink-muted disabled:opacity-40"
                >
                  <X size={18} />
                </button>
              </div>
              <p
                id="account-delete-description"
                className="mt-2 text-ink-muted text-caption leading-[1.6] break-keep"
              >
                {isUnauthorized
                  ? "계정 보호를 위해 다시 로그인한 뒤 계정 삭제를 진행해주세요."
                  : isFailed
                    ? "계정 삭제를 완료하지 못했어요. 잠시 후 다시 시도해주세요."
                    : "삭제가 완료되면 계정을 복구할 수 없습니다."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={isUnauthorized ? handleLogin : handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-danger px-3 py-2.5 font-semibold text-white text-caption disabled:opacity-60"
              >
                {isDeleting
                  ? "삭제 중..."
                  : isUnauthorized
                    ? "로그인하기"
                    : isFailed
                      ? "다시 시도"
                      : "계정 삭제"}
              </button>
              <button
                type="button"
                onClick={closeModal}
                disabled={isDeleting}
                className="rounded-md border border-divider bg-surface px-3 py-2.5 font-semibold text-ink text-caption disabled:opacity-60"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
