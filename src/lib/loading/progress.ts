/**
 * 오래 걸리는 작업(AI 생성)의 로딩 진행률 곡선.
 *
 * 서버가 실제 진척도를 주지 않는 구간에서 쓴다. 핵심은 **100%에 도달하지 않고
 * 계속 미세하게 증가**하는 것 — 멈춘 게이지는 고장으로 보이므로, 완료 신호는
 * 실제 응답(또는 서버 상태)만 준다.
 *
 * `ceiling * (1 - e^(-t/tau))` — 앞부분은 빠르게 차고 뒤로 갈수록 완만해지며
 * `ceiling`에 점근한다. 예상보다 오래 걸려도 게이지가 굳지 않는다.
 */
export function asymptoticProgress(
  elapsedSec: number,
  { ceiling, tau }: { ceiling: number; tau: number },
): number {
  if (elapsedSec <= 0) return 0;
  const ratio = 1 - Math.exp(-elapsedSec / tau);
  return Math.round(ceiling * ratio * 10) / 10;
}
