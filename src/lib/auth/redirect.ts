/**
 * 로그인 후 복귀 경로를 담은 /login URL을 만든다.
 *
 * 경로에 동적 세그먼트를 넣을 때 인코딩이 필요하다. Next.js가 넘겨주는
 * params 값은 이미 디코딩된 상태라 &, #, ? 가 섞여 있으면 쿼리 문자열이
 * 그 지점에서 끊기거나 엉뚱한 파라미터가 덧붙는다.
 * 그 결과 인증 후 의도한 화면이 아닌 곳으로 돌아가게 된다.
 *
 * 값을 통째로 인코딩해도 수신 측 searchParams.get()이 되돌려 읽으므로
 * login 화면의 getSafeRedirectTo 검사(선행 "/" 확인)는 그대로 동작한다.
 */
export function loginRedirect(path: string): string {
  return `/login?redirectTo=${encodeURIComponent(path)}`;
}
