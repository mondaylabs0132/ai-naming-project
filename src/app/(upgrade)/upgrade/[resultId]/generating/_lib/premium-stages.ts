/**
 * 유료 생성 로딩 화면의 "진행감" 로직.
 *
 * 무료(`(funnel)/naming/generating/_lib/stages.ts`)와 같은 원칙이지만 두 가지가 다르다:
 *  - 소요시간이 더 길고 분산이 크다. `premium/route.ts`의 `collectNames`가
 *    이름 19개를 모을 때까지 최대 4번 재시도하고, 그 뒤 풀이 19개를 또 생성한다.
 *    → 곡선을 더 완만하게(tau 32) 두고 지연 문구 시점도 늦춘다.
 *  - 완료 판정이 fetch 응답이 아니라 `naming_requests.status` 폴링이다.
 *    (PREMIUM_RESULT_READY → 게이지 100% → 결과 페이지)
 *
 * 단계 경계는 `premium/route.ts`의 실제 구간과 대응시켰지만 **서버가 보고하는
 * 값이 아니라 경과 시간 기반 추정**이다. 라벨이 실제 구간과 다소 어긋날 수 있다.
 */

import { asymptoticProgress } from "@/lib/loading/progress";

/** 진행률 곡선 계수 — 무료보다 tau를 키워 더 완만하게 찬다. */
const PROGRESS = { ceiling: 92, tau: 32 };

/**
 * 4단계 — 기존 화면의 타임라인 UI 구성을 그대로 따른다.
 * `at`(초)부터 해당 단계가 '진행 중'이 되고, 그 이전 단계는 '완료'로 표시된다.
 */
export const PREMIUM_STEPS = [
  {
    title: "기본 정보 분석",
    desc: "사주, 오행, 음양오행, 수리격을 분석해요",
    at: 0,
    messages: [
      "생년월일시로 사주를 세우고 있어요",
      "부족한 오행을 찾고 있어요",
      "음양 균형을 확인하고 있어요",
    ],
  },
  {
    title: "이름 후보 분석",
    desc: "의미, 발음, 한자, 활용도, 선호도를 분석해요",
    at: 10,
    messages: [
      "이름 후보를 넓게 모으고 있어요",
      "한자 후보를 하나씩 확인하고 있어요",
      "소리와 발음을 다듬고 있어요",
      "성씨와의 조화를 보고 있어요",
      "수리격을 계산하고 있어요",
    ],
  },
  {
    title: "전문가 최종 검토",
    desc: "이름마다 풀이를 쓰고 순위를 매겨요",
    at: 55,
    messages: [
      "이름마다 풀이를 쓰고 있어요",
      "담긴 의미를 다시 새기고 있어요",
      "좋은 순서대로 순위를 매기고 있어요",
    ],
  },
  {
    title: "결과 정리 및 제공",
    desc: "20개의 이름 결과를 정리해요",
    at: 85,
    messages: ["20개의 이름을 정리하고 있어요", "곧 결과를 보여드릴게요"],
  },
] as const;

/** 화면에 순환 노출할 '현재 분석 중인 요소' 태그. */
export const ANALYZING_TAGS = [
  "이름 의미 해석",
  "음양 조화 분석",
  "발음 조화 분석",
  "한자 후보 탐색",
  "선호도 데이터 반영",
] as const;

/** 태그가 다음 항목으로 넘어가는 주기(초). */
const TAG_ROTATE_SEC = 6;

/**
 * 게이지 위 문구가 바뀌는 주기(초).
 * 태그 주기(6초)와 다른 값을 써서 둘이 동시에 바뀌지 않게 한다.
 */
const MESSAGE_ROTATE_SEC = 5;

/** 평균을 넘겼을 때 전환할 문구와 시점 — 무료(75s)보다 늦게 잡는다. */
export const OVERRUN_AT_SEC = 120;
export const OVERRUN_LABEL = "조금 더 꼼꼼히 살펴보고 있어요...";

/** 생성 완료 문구. 게이지가 100%까지 찬 뒤 결과 페이지로 이동한다. */
export const DONE_LABEL = "분석이 완료됐어요!";

/**
 * 100%까지 차오르는 애니메이션을 위해 이동 전 대기하는 시간(ms).
 * 게이지 transition(300ms)보다 길어야 100% 도달이 실제로 보인다.
 */
export const DONE_HOLD_MS = 400;

export type PremiumStepStatus = "done" | "active" | "pending";

/** 경과 시간(초)에 해당하는 진행 중 단계 인덱스 (0부터). */
export function activeStepIndexAt(elapsedSec: number): number {
  let index = 0;
  // 뒤에서부터 찾아 첫 번째로 통과한 단계를 쓴다 (단방향 보장)
  for (let i = PREMIUM_STEPS.length - 1; i >= 0; i -= 1) {
    if (elapsedSec >= PREMIUM_STEPS[i].at) {
      index = i;
      break;
    }
  }
  return index;
}

/** 단계별 표시 상태. `isDone`이면 전부 완료로 본다. */
export function stepStatusAt(
  stepIndex: number,
  elapsedSec: number,
  isDone: boolean,
): PremiumStepStatus {
  if (isDone) return "done";

  const activeIndex = activeStepIndexAt(elapsedSec);
  if (stepIndex < activeIndex) return "done";
  if (stepIndex === activeIndex) return "active";
  return "pending";
}

/** 지금 강조할 태그 인덱스 — TAG_ROTATE_SEC마다 순환한다. */
export function activeTagIndexAt(elapsedSec: number): number {
  if (elapsedSec <= 0) return 0;
  return Math.floor(elapsedSec / TAG_ROTATE_SEC) % ANALYZING_TAGS.length;
}

/**
 * 게이지 위 문구.
 *
 * 현재 단계의 `messages` 안에서만 순환한다 — 타임라인이 "이름 후보 분석"인데
 * 문구가 "순위를 매기고 있어요"로 나오는 식의 모순을 막기 위해서다.
 */
export function progressLabelAt(elapsedSec: number, isDone: boolean): string {
  if (isDone) return DONE_LABEL;
  if (elapsedSec >= OVERRUN_AT_SEC) return OVERRUN_LABEL;

  const { messages } = PREMIUM_STEPS[activeStepIndexAt(elapsedSec)];
  const tick = Math.floor(Math.max(elapsedSec, 0) / MESSAGE_ROTATE_SEC);

  return messages[tick % messages.length];
}

/** 경과 시간(초) → 진행률(%). 완료 시에만 100%. */
export function premiumProgressAt(elapsedSec: number, isDone: boolean): number {
  return isDone ? 100 : asymptoticProgress(elapsedSec, PROGRESS);
}
