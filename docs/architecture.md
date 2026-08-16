# 프로젝트 라우팅 구조

> **참고용 문서입니다.** 이 문서는 현재 구현을 기준으로 정리한 *참고 사항*이며,
> 프로젝트 진행 상황·요구사항 변화에 따라 언제든 바뀔 수 있습니다.
> 코드와 이 문서가 어긋날 경우 **코드를 진실로 보고**, 문서를 업데이트하세요.

## 전체 흐름

비로그인 퍼널 → (유료 전환 시) 이메일 OTP 인증 → 결제 → 유료 결과
재방문 유저는 `/login`(OTP)을 통해 `/mypage`로 진입.

```
랜딩 → 5단계 입력(단일 페이지) → 무료 AI 로딩 → 무료 결과
                                              ↓ (유료 전환 클릭)
                          이메일 입력 → OTP 6자리 입력 → 세션 발급
                                              ↓
                            결제(Toss) → 유료 AI 로딩 → 유료 결과

(재방문 유저)  /login → OTP → /mypage
```

## 폴더 구조

```
src/app/
├── layout.tsx                       # 루트 레이아웃 (html/body, 폰트, providers)
├── page.tsx                         # / 랜딩
├── privacy/ · terms/                # 약관 페이지
│
├── (funnel)/                        # 비로그인 퍼널 — 미니멀 레이아웃
│   ├── layout.tsx
│   ├── naming/new/                  # 5단계 입력 — 단일 페이지 (URL에 step 없음)
│   │   ├── page.tsx                 # /naming/new
│   │   ├── _components/steps/       # step-last-name … step-avoid (5단계)
│   │   ├── _hooks/use-funnel.tsx    # useState 기반 스텝 전환
│   │   ├── _hooks/use-survey-form.ts# react-hook-form + zod
│   │   └── _lib/                    # schema.ts, survey-mapper.ts
│   ├── naming/generating/           # /naming/generating?requestId=… (무료 AI 로딩)
│   ├── results/[id]/                # /results/abc  무료 결과
│   └── free-limit/                  # 무료 사용 횟수 초과 안내
│
├── (upgrade)/                       # 무료→유료 전환 (비로그인 진입 가능)
│   └── upgrade/[resultId]/
│       ├── page.tsx                 # 이메일 입력 + OTP 인증 (로그인 상태면 즉시 리다이렉트)
│       ├── checkout/                # Toss 결제
│       ├── generating/              # 결제 후 유료 AI 로딩
│       ├── result/                  # 유료 결과 (인증 + 결제완료 검사)
│       └── result/[nameId]/         # 이름별 상세
│
├── (auth)/
│   └── login/page.tsx               # /login — 이메일 입력 → OTP 6자리 입력 (한 페이지)
│
├── (account)/                       # 로그인 필수 영역 (layout.tsx에서 세션 검사)
│   ├── mypage/                      # 마이페이지 허브
│   │   ├── results/ · results/[id]/ · results/[id]/detail/[nameId]/
│   │   ├── orders/ · coupons/ · inquiries/
│   │   └── _components/
│   └── bookmarks/                   # 북마크한 이름 목록
│
└── api/
    ├── naming/
    │   ├── free/route.ts            # 설문 검증 → naming_requests/naming_surveys 저장 → requestId 반환
    │   └── [requestId]/
    │       ├── _lib.ts              # AI 호출 핵심 로직 전부 (OpenAI/Anthropic 직접 fetch)
    │       ├── free/route.ts        # 무료 생성 실행 (maxDuration 300, 캐시 시 재호출 안전)
    │       └── premium/route.ts     # 유료 생성 실행 (결제 검증 포함)
    ├── auth/
    │   ├── otp/route.ts             # signInWithOtp — OTP 메일 발송
    │   └── verify/route.ts          # verifyOtp — 세션 발급 + resultId 귀속
    ├── checkout/
    │   ├── prepare/route.ts         # 주문 생성 (결제 전)
    │   ├── confirm/route.ts         # Toss 승인 API 호출
    │   ├── webhook/route.ts         # 결제 상태 webhook
    │   └── refund/route.ts          # 환불
    ├── account/delete/route.ts      # 회원 탈퇴
    ├── internal/generation-failed/  # 리퍼(pg_cron)가 호출하는 실패 처리 (x-internal-job-secret 헤더 인증)
    ├── jobs/[id]/route.ts           # ⚠ 스텁 (미구현)
    └── naming/premium/route.ts      # ⚠ 스텁 (미구현)

src/proxy.ts                         # ⚠ Next.js 16에서 middleware.ts → proxy.ts
src/lib/{auth,payments,supabase,free-usage,result,mypage,bookmarks,loading}/
src/components/{home,layout,result}/
supabase/
├── functions/premium-email/         # Edge Function — 유료 완료/실패 메일 (별도 배포 필요)
└── migrations/                      # 최근 변경분만 — 전체 스키마의 진실은 Supabase에 있음
```

## 설계 원칙 (WHY)

### 1. Route Group 4개로 영역 분리
`(funnel)` `(upgrade)` `(auth)` `(account)` — URL에는 안 보이지만 **레이아웃이 완전히 다릅니다**.
랜딩은 풀 헤더/푸터, 퍼널은 집중 모드, 결제는 이탈 방지 UI, 마이페이지는 앱 셸.
그룹마다 `layout.tsx`로 분리.

### 2. 5단계 입력은 단일 페이지 + `useFunnel` 훅
초기 설계는 `/naming/new/[step]` 동적 세그먼트였으나, 현재는 **`/naming/new` 한 페이지**에서
`useFunnel` 훅(`useState` 기반)으로 스텝을 전환합니다. 폼 상태는 `react-hook-form` +
`FormProvider`가 전 스텝에 걸쳐 유지하고, zod 스키마(`_lib/schema.ts`)로 검증합니다.
새로고침 시 입력값이 사라지는 트레이드오프를 감수하고 라우팅 복잡도를 줄인 선택입니다.

### 3. 결과는 `id` 기반, 무료/유료는 *상태*로 관리
`results/[id]`(무료) ↔ `upgrade/[resultId]/result`(유료)는 같은 id(= `naming_requests.id`)를 공유.
`naming_requests.status`(`FREE_ACTIVE` 등)로 상태를 표현.
"이 결과의 유료 버전을 산다"가 자연스럽게 표현됩니다.

### 4. AI 생성은 2단계 API로 분리
1. `POST /api/naming/free` — 설문 검증 후 DB 행만 만들고 `requestId` 반환 (AI 호출 없음, 빠름)
2. `POST /api/naming/[requestId]/free|premium` — 실제 AI 생성. `maxDuration = 300`,
   이미 생성된 `name_candidates`가 있으면 캐시 반환이라 재호출해도 안전합니다.

로딩 화면(`/naming/generating?requestId=…`, `/upgrade/[id]/generating`)은 `loading.tsx`가 아닌
일반 페이지입니다. 2단계 API를 클라이언트에서 호출하고 완료되면 결과 페이지로 이동합니다.
AI 핵심 로직은 `api/naming/[requestId]/_lib.ts` 한 파일에 모여 있습니다
(모델·타임아웃은 `AI_MODEL_*`, `AI_DEADLINE_MS` 등 env로 제어).

### 5. 인증은 이메일 OTP, `/login`과 `/upgrade/[id]`에서 재사용
매직링크가 아니라 **6자리 OTP 코드** 방식입니다 (`signInWithOtp` → `verifyOtp`).
- **첫 결제 유저**: `/upgrade/[id]` → 이메일 입력 → OTP 입력 → `/api/auth/verify`
  → 세션 발급 + 해당 result를 유저에게 귀속 → checkout으로 이동
- **재방문 유저**: `/login` → OTP → `redirect_to` 쿼리(검증된 상대경로만) 또는 `/mypage`
- 로그인 상태로 무료 생성을 시작하면 처음부터 본인 소유로 귀속되어 재인증이 필요 없습니다.

### 6. `proxy.ts`(구 middleware) 역할은 최소로
전 경로에서 두 가지만 합니다: ① Supabase 세션 갱신, ② 무료 사용량 추적용
`visitor_id` 쿠키(httpOnly UUID) 부여. 세션 검사·소유권 검사는 layout/page에서 처리.
무료 사용 제한은 이 쿠키 + IP 해시(`FREE_TRIAL_IP_PEPPER`) 기반 — `src/lib/free-usage/`.

### 7. 결제는 prepare → Toss SDK → confirm, webhook은 별도
`/api/checkout/prepare`(주문 생성) → 클라이언트 Toss 결제창 → `/api/checkout/confirm`(승인)
→ 유료 생성 트리거. `/api/checkout/webhook`은 결제사 서버가 호출하는 별도 경로로 유지.
서버 로직은 `src/lib/payments/`.

### 8. 멈춘 생성은 DB 쪽 리퍼가 수습
유료 생성이 중간에 죽으면(타임아웃·배포 등) 클라이언트만으로는 복구할 수 없으므로,
Supabase의 `pg_cron`이 `reap_stuck_generations()`를 주기 실행해 오래 멈춘 건을 찾아
`/api/internal/generation-failed`를 호출합니다(`x-internal-job-secret` 헤더로 인증).
실패 시 환불 처리와 안내 메일(Edge Function `premium-email`)로 이어집니다.

## 빠뜨리기 쉬운 디테일

- 무료 생성 실행 라우트는 `consumeFreeUsage` → 실패 시 `rollbackFreeUsage` 패턴 필수.
  실패 경로에서 롤백을 빠뜨리면 사용자가 무료 1회를 그냥 잃습니다.
- `verify`는 `resultId`를 함께 받아 익명 생성 결과를 유저 계정에 **귀속**시킵니다.
- `redirect_to`는 `/`로 시작하고 `//`로 시작하지 않는 상대경로만 허용 (open redirect 방지).
- `upgrade/[id]/result`는 인증 + 결제완료 둘 다 검사. `mypage/results/[id]`는 본인 소유 검사 필수.
- 이름 후보는 요청당 **20개 고정** — `name_candidates.sort_order` CHECK 제약과 묶여 있음.
- Edge Function은 Vercel 배포에 실리지 않음 — `supabase functions deploy premium-email` 별도 실행.

## 도메인이 더 늘어나면

회사명 작명·펫 이름 등 도메인이 4~5개로 확장되면 `src/features/<domain>/` 레이어 도입을 검토.
지금은 평탄한 구조가 더 빠릅니다.
