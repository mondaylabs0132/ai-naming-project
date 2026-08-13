# 유료 AI 이름 생성 구조 (v1)

> **참고용 문서입니다.** 코드와 어긋나면 코드를 진실로 보고 문서를 업데이트하세요.
> 기준 코드: `src/app/api/naming/[requestId]/premium/route.ts`, `src/app/api/naming/[requestId]/_lib.ts`
> 작성일: 2026-08-13

## 한눈에 보기

```
결제 완료 (confirm 또는 webhook)
  → completeOrder()                          src/lib/payments/complete.ts
      status → PREMIUM_GENERATING
      after()로 생성 API 트리거 (10초 타임아웃, 던지고 빠짐)
  → POST /api/naming/[requestId]/premium     ← 실제 생성 (maxDuration 300초)
      ① 이름 수집  collectNames()            gpt-4o-mini, 순차 라운드 최대 4회
      ② 해설 생성  generateDetailedReason()  gpt-4o, 5개 배치 병렬 + 누락분 병렬 재시도
      ③ DB 저장    무료 행 UPDATE + 유료 행 INSERT
      status → PREMIUM_RESULT_READY
  → DB 트리거 → Edge Function premium-email  결과 링크 이메일 발송
```

완주 보장은 앱이 아니라 **DB 리퍼**(`reap_stuck_generations`, pg_cron 매분)가 맡는다.
브라우저의 로딩 화면은 `naming_requests.status`를 2초마다 폴링할 뿐이며,
**창을 닫아도 생성은 서버에서 계속되고 완료 시 이메일이 간다.**

## 상태 머신

```
FREE_ACTIVE / FREE_EXPIRED
  → (결제 완료) PREMIUM_GENERATING
  → (생성 성공) PREMIUM_RESULT_READY   ← 이메일 웹훅 발동 지점
  → (리퍼가 재시도 소진 확정) FAILED   ← 실패 이메일 + 자동 환불
```

- `generation_started_at`: 리퍼가 "멈췄는지" 판단하는 유일한 기준점. 생성 시작 전 반드시 갱신.
- `generation_attempts`: 리퍼가 올린다. 3회 소진하면 `/api/internal/generation-failed` 호출 → FAILED 확정 + 환불.
- `generation_failure_reason`: 실패 지점마다 기록. FAILED 확정 시 환불 사유가 된다.

## 트리거 경로 (3가지)

| 경로 | 인증 | 비고 |
|---|---|---|
| 결제 직후 서버 트리거 | `x-internal-job-secret` 헤더 | `completeOrder`의 `after()`. 10초 타임아웃으로 던지기만 하고, 타임아웃은 정상(생성 시작됨)으로 본다 |
| DB 리퍼 재시도 | 같은 헤더 (Vault의 `internal_job_secret`) | `PREMIUM_GENERATING`인데 `generation_started_at`이 5분 이상 과거인 건. 최대 3회 |
| 사용자 "다시 시도" 버튼 | 세션 + 주문 소유권 | 실패 화면에서 브라우저가 직접 POST |

같은 요청이 중복 실행돼도, 라우트 초입의 **캐시 확인**(sort_order>0 행 존재 시 즉시 반환)이 이중 생성을 막는다.
단, "첫 실행이 아직 돌고 있는데 5분이 지나 리퍼가 또 트리거"하는 경계 케이스는 남아 있다
(리퍼 `stale_after` 5분 vs 실측 최대 4~5분 — 아래 [시간 예산] 참고).

## ① 이름 수집 — `collectNames()`

- **모델**: `gpt-4o-mini` (env `AI_MODEL_NAME_GEN`). 후보는 "많이 뽑고 코드로 거르는" 대상이라 저가 모델로 충분.
- **목표**: `TARGET_NAMES - 1 = 19개` (무료 이름 1개 제외). 하한 `MIN_DELIVERABLE_NAMES = 12` 미달이면 실패 처리.
- **라운드 구조**: 순차 while 루프, 최대 `maxAttempts = 4`회.
  - 첫 라운드는 **`generateNames` 2회 병렬 호출**(후보 120개)로 시작해 재라운드 확률을 낮춘다.
  - 이후 라운드는 1회씩(60개). 호출당 출력 상한 `NAMES_MAX_TOKENS = 12,000` (예상치 5,400의 2배 여유 — 잘리면 라운드 전체가 0건이 되므로).
- **필터** (탈락 사유 순서대로):
  1. 이미 쓴 이름 (`usedNames` — 무료 이름 + 이전 라운드 통과분)
  2. 두 글자 아님 / 같은 글자 반복
  3. 기피 한글 글자 (형제 이름 글자 포함, 돌림자는 예외)
  4. 기피 한자 (NFKC 정규화 + 이체자 전이 확장까지)
  5. 블랙리스트 이름
  6. 한자 DB에 없는 글자
  7. **독음 불일치** (hangul ↔ hanja 독음 검증. AI가 자주 틀리는 지점)
  8. 사격 길흉 `isTwoGood` 미달
- 통과한 후보에 점수(`calcScore`)·발음오행(`calcSoundScore`)을 붙여 `RichName`으로 완성.

## ② 해설 생성 — `generateDetailedReason()`

- **모델**: `gpt-4o` (env `AI_MODEL_DETAIL`). 해설 자체가 판매 상품이므로 상위 모델.
- **입력**: 무료 이름 1 + 유료 이름 19 = 최대 20건. 오행·획수·길흉·점수는 이미 계산된 값을 프롬프트에 명시해 AI가 추측하지 못하게 한다.
- **1차**: 5개씩 배치(`BATCH = 5`) → 최대 4배치를 `Promise.allSettled`로 **병렬** 실행. 배치당 출력 상한 16,384 토큰.
- **2차**: 누락(배치 실패·파싱 실패)·태그 부족(<2) 이름을 **개별 호출로 병렬 재시도** (상한 8,192 토큰).
  429 등 일시 오류는 `callAI` 내부 재시도(최대 3회, 데드라인 150초)가 흡수한다.
- 끝내 못 받은 이름은 빈 상세로 나가되 로그에 남긴다 (라우트를 500으로 떨어뜨리지 않는다).

## ③ DB 저장과 완료

1. 무료 행(sort_order 0)에 detail 관련 컬럼 UPDATE (`detailed_explanation`, `detail_body`, `categories`, `tags`)
2. 유료 행(sort_order 1~19) INSERT — `toDbRow`
3. `status → PREMIUM_RESULT_READY` → DB 트리거(`20260806140000_failure_email.sql`)가 Edge Function `premium-email` 호출 → 결과 링크 이메일

## 시간 예산 (실측 기준 추정)

| 구간 | 정상 | 나쁜 날 | 지연 원인 |
|---|---|---|---|
| ① 이름 수집 | 20~40초 (1라운드) | 1~2분 (3~4라운드) | 필터 통과율 저하, 응답 잘림(→상한 12,000으로 완화) |
| ② 해설 1차 | 60~90초 | ~2분 | 배치 중 최장 응답 |
| ② 해설 2차 재시도 | 0초 (누락 없음) | 30~60초 (병렬화 후) | 순차였을 때는 누락 5개 × 30~60초 = 2~5분이었다 |
| 합계 | **1.5~2.5분** | **3~5분** | |

- 라우트 `maxDuration = 300초`. 이를 넘기면 흔적 없이 죽고 리퍼가 5분 후 재시도한다.
- **주의**: 리퍼 `stale_after`(5분)와 나쁜 날 소요(4~5분)가 겹친다. 정상 진행 중인 생성을
  리퍼가 중복 트리거할 수 있는 경계 — `stale_after`를 7분으로 늘리는 마이그레이션이 후속 과제.

## 실패와 환불

- 라우트 안에서 실패해도 status는 `PREMIUM_GENERATING`에 남긴다 (실패 확정은 리퍼 전담).
- 리퍼가 3회 재시도를 소진하면 `/api/internal/generation-failed` 호출 →
  FAILED 확정 + 자동 환불(토스 취소) + 실패 안내 이메일.
- 사용자는 실패 화면에서 "다시 시도" 또는 "지금 환불받기"를 직접 누를 수도 있다.

## 로딩 화면 (`(upgrade)/upgrade/[resultId]/generating`)

- 완료 판정은 `naming_requests.status` 폴링(2초 간격, 상한 25분).
- 진행률·단계·문구는 서버가 보고하는 값이 아니라 **경과 시간 기반 추정**이다
  (`_lib/premium-stages.ts`). 단계 경계(0/10/70/160초)와 진행률 곡선(tau 64)은
  실측 소요 2~5분에 맞춰져 있다.
- 문구는 5초마다 순환하며, 120초 이후에는 시간대별 묶음(`OVERRUN_BANDS` —
  120/180/300초)으로 갈아타 끝까지 순환을 유지한다. 90초부터는 안심 카드
  (이메일 발송·자동 환불 안내)가 표시된다. 이 문구들은 전부 실제 동작에 근거한다.

## 관련 상수 모음

| 상수 | 값 | 위치 |
|---|---|---|
| `NAMES_PER_CALL` / `NAMES_MAX_TOKENS` | 60 / 12,000 | `_lib.ts` |
| `TARGET_NAMES` / `MIN_DELIVERABLE_NAMES` | 20 / 12 | `_lib.ts` |
| `MODEL_NAME_GEN` / `MODEL_DETAIL` | gpt-4o-mini / gpt-4o | `_lib.ts` (env로 교체 가능) |
| `AI_TIMEOUT_MS` / `AI_MAX_ATTEMPTS` / `AI_DEADLINE_MS` | 60초 / 3회 / 150초 | `_lib.ts` (env로 교체 가능) |
| 라우트 `maxDuration` | 300초 | `premium/route.ts` |
| 리퍼 `stale_after` / `max_attempts` | 5분 / 3회 | `20260806130000_reap_stuck_generations.sql` |
| 폴링 간격 / 상한 | 2초 / 25분 | `generating-client.tsx` |
