/**
 * 링크를 공유하거나 복사하는 클라이언트 유틸.
 *
 * 무료 결과 공유(upgrade-cta)와 유료 결과 공유(ShareSheet)가 같은 동작을
 * 써야 해서 한 곳에 모았다. 두 화면 모두 "모바일이면 네이티브 시트, 아니면
 * 링크 복사"라는 같은 규칙을 따른다.
 */

/**
 * Clipboard API는 보안 컨텍스트(https·localhost)에서만 쓸 수 있어서,
 * 못 쓰는 환경에서는 임시 textarea + execCommand로 대체한다.
 */
export async function copyText(text: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("복사에 실패했습니다");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

export type ShareOutcome =
  /** 네이티브 공유 시트로 넘겼다. 성공/취소는 시트가 처리한다. */
  | "shared"
  | "copied"
  | "error";

/**
 * 모바일은 네이티브 공유 시트가 카카오톡까지 가는 최단 경로라 우선 쓰고,
 * 그 외에는 링크를 복사한다.
 */
export async function shareOrCopy(
  shareData: { title: string; text: string; url: string },
): Promise<ShareOutcome> {
  // navigator.share 존재 여부만으로는 모바일을 가려낼 수 없다.
  // macOS Safari도 이를 지원해서 데스크톱에 AirDrop·메일 시트가 떠버린다.
  // 데스크톱에서는 링크 복사가 자연스러우므로 터치 기기일 때만 시트를 쓴다.
  // (결제 화면 resolveWindowTarget과 같은 기준)
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  const canUseNativeShare =
    isTouchDevice &&
    typeof navigator.share === "function" &&
    (typeof navigator.canShare !== "function" ||
      navigator.canShare(shareData));

  if (canUseNativeShare) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (error) {
      // 사용자가 시트를 그냥 닫은 경우(AbortError)는 의도된 취소라 여기서 끝낸다.
      if (error instanceof DOMException && error.name === "AbortError") {
        return "shared";
      }
      // 그 외(카카오톡 인앱 브라우저 미지원, 권한 거부 등)는 삼키지 말고
      // 복사로 넘어간다.
    }
  }

  // iOS Safari는 클릭 핸들러에서 다른 await을 거친 뒤 클립보드를 호출하면
  // 사용자 제스처가 끊긴 것으로 보고 거부할 수 있다. 그때는 error를 돌려준다.
  try {
    await copyText(shareData.url);
    return "copied";
  } catch {
    return "error";
  }
}
