/**
 * Supabase(PostgrestError)는 Error 인스턴스가 아니라 평범한 객체다.
 * 그대로 String()으로 감싸면 "[object Object]"가 되어 원인이 사라진다.
 * (권한 누락 42501, 스키마 캐시 PGRST205 같은 문제를 진단할 수 없게 된다.)
 *
 * 조회 계층에서 이 함수로 변환해 던지면 화면·에러 바운더리·로그 어디서든
 * 실제 메시지와 코드가 남는다.
 */
export function toError(e: unknown): Error {
  if (e instanceof Error) return e;

  if (e && typeof e === "object") {
    const { message, code, details, hint } = e as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };

    if (message) {
      const error = new Error(code ? `${message} (${code})` : message);
      // 원본을 보존해 콘솔에서 details/hint까지 확인할 수 있게 한다.
      error.cause = e;
      if (details || hint) {
        error.message += ` — ${[details, hint].filter(Boolean).join(" / ")}`;
      }
      return error;
    }
  }

  return new Error(String(e));
}
