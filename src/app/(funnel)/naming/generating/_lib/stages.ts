/**
 * 무료 생성 로딩 화면의 "진행감" 로직.
 *
 * 서버가 실제 진척도를 주지 않으므로 경과 시간만으로 추정한다.
 * 핵심 규칙 두 가지:
 *  1. 단계는 단방향으로만 진행한다. (되돌아오면 진행감이 깨진다)
 *  2. 진행률은 100%에 절대 도달하지 않고 계속 미세하게 증가한다.
 *     (멈춘 게이지는 고장으로 보이므로 완료 신호는 실제 응답만 준다)
 */

import { asymptoticProgress } from "@/lib/loading/progress";

/** 사용자에게 보여줄 분석 단계 — `at`(초)부터 해당 문구를 노출한다. */
export const STAGES = [
  { at: 0, label: "사주팔자를 세우고 있어요" },
  { at: 8, label: "오행의 균형을 살펴보고 있어요" },
  { at: 18, label: "음양의 조화를 맞추고 있어요" },
  { at: 28, label: "획수와 수리를 계산하고 있어요" },
  { at: 38, label: "소리와 발음을 다듬고 있어요" },
  { at: 48, label: "이름에 담긴 의미를 새기고 있어요" },
  { at: 58, label: "마지막으로 다시 검토하고 있어요" },
] as const;

/** 평균(40~60초)을 넘겼을 때 전환할 문구와 시점. */
export const OVERRUN_AT_SEC = 75;
export const OVERRUN_LABEL = "조금 더 꼼꼼히 살펴보고 있어요";

/** 생성 완료 문구. 게이지가 100%까지 찬 뒤 결과 페이지로 이동한다. */
export const DONE_LABEL = "분석이 완료됐어요!";

/**
 * 100%까지 차오르는 애니메이션을 위해 이동 전 대기하는 시간(ms).
 *
 * 짧아도 되는 이유: `/results/[id]`는 Supabase를 조회하는 async 서버 컴포넌트인데
 * 앱에 `loading.tsx`(Suspense 경계)가 없어서, `router.replace()`는 RSC 페이로드가
 * 도착할 때까지 이 화면을 계속 띄워둔다. 즉 100% 상태는 이 대기시간 이후에도
 * 이동 지연 동안 계속 보인다. 여기서는 게이지가 끝까지 차는 것만 보장하면 된다.
 *
 * ⚠️ 나중에 `results/[id]/loading.tsx`를 추가하면 이동이 즉시 전환되므로
 *    이 값이 100%의 유일한 노출 시간이 된다. 그때 값을 재검토할 것.
 */
export const DONE_HOLD_MS = 400;

/** 진행률 곡선 계수 — 상한 92%에 점근, tau가 작을수록 앞부분이 빠르게 찬다. */
const PROGRESS = { ceiling: 92, tau: 22 };

export type StageState = {
  /** 화면에 표시할 문구 */
  label: string;
  /** 1부터 시작하는 단계 번호 (오버런 시에도 마지막 단계 번호를 유지) */
  step: number;
  /** 전체 단계 수 */
  total: number;
  /** 평균 소요시간을 초과했는지 */
  isOverrun: boolean;
};

/** 경과 시간(초)에 해당하는 단계 상태. */
export function stageStateAt(elapsedSec: number): StageState {
  const total = STAGES.length;

  if (elapsedSec >= OVERRUN_AT_SEC) {
    return { label: OVERRUN_LABEL, step: total, total, isOverrun: true };
  }

  // 뒤에서부터 찾아 첫 번째로 통과한 단계를 쓴다 (단방향 보장)
  let index = 0;
  for (let i = STAGES.length - 1; i >= 0; i -= 1) {
    if (elapsedSec >= STAGES[i].at) {
      index = i;
      break;
    }
  }

  return {
    label: STAGES[index].label,
    step: index + 1,
    total,
    isOverrun: false,
  };
}

/** 경과 시간(초) → 진행률(%). */
export function progressAt(elapsedSec: number): number {
  return asymptoticProgress(elapsedSec, PROGRESS);
}
