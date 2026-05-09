# 프로젝트 라우팅 구조

> **참고용 문서입니다.** 이 문서는 현재 시점의 설계 방향을 정리한 *참고 사항*이며,
> 프로젝트 진행 상황·요구사항 변화에 따라 언제든 바뀔 수 있습니다.
> 코드와 이 문서가 어긋날 경우 **코드를 진실로 보고**, 문서를 업데이트하세요.

## 전체 흐름

비로그인 퍼널 → (옵션) 매직링크 인증 → 결제 → 유료 결과
유료 결제자만 재방문 시 `/login`을 통해 `/mypage`로 진입.

```
랜딩 → 5단계 입력 → 무료 AI 로딩 → 무료 결과
                                    ↓ (유료 전환 클릭)
                               이메일 입력 → 매직링크 발송
                                    ↓ (메일의 링크 클릭)
                              결제 → 유료 AI 로딩 → 유료 결과

(유료 결제자 재방문)  /login → 매직링크 → /mypage
```

## 폴더 구조

```
src/app/
├── layout.tsx                       # 루트 레이아웃 (html/body, 폰트, providers)
├── page.tsx                         # / 랜딩
├── globals.css
│
├── (funnel)/                        # 비로그인 퍼널 — 미니멀 레이아웃
│   ├── layout.tsx
│   │
│   ├── naming/new/                  # 5단계 입력
│   │   ├── page.tsx                 # /naming/new        → step 1로 redirect
│   │   ├── [step]/page.tsx          # /naming/new/2 …    (1~5)
│   │   ├── _components/
│   │   │   ├── step-form.tsx
│   │   │   └── progress-bar.tsx
│   │   └── _lib/
│   │       ├── schema.ts            # zod 스키마 (step별)
│   │       └── store.ts             # 입력값 임시 저장
│   │
│   ├── naming/generating/
│   │   └── page.tsx                 # /naming/generating?jobId=… (무료 AI 로딩)
│   │
│   └── results/[id]/
│       ├── page.tsx                 # /results/abc       무료 결과
│       └── _components/
│           └── upgrade-cta.tsx
│
├── (upgrade)/                       # 무료→유료 전환 (비로그인 가능)
│   ├── layout.tsx                   # 결제 흐름 전용 레이아웃
│   └── upgrade/[resultId]/
│       ├── page.tsx                 # /upgrade/abc            이메일 입력
│       ├── sent/page.tsx            # /upgrade/abc/sent       "메일 확인하세요"
│       ├── checkout/page.tsx        # /upgrade/abc/checkout   결제
│       ├── generating/page.tsx      # /upgrade/abc/generating 결제 후 AI 로딩
│       └── result/page.tsx          # /upgrade/abc/result     유료 결과
│
├── (auth)/                          # 인증 진입점
│   ├── login/page.tsx               # /login  (재방문 매직링크 요청)
│   └── login/sent/page.tsx          # /login/sent
│
├── (account)/                       # 로그인 필수 영역
│   ├── layout.tsx                   # 세션 검사 (없으면 /login 으로)
│   └── mypage/
│       ├── page.tsx                 # /mypage
│       ├── results/[id]/page.tsx    # /mypage/results/abc  과거 결과 재열람
│       └── _components/
│
└── api/                             # 서버 엔드포인트
    ├── naming/
    │   ├── free/route.ts            # 무료 생성 시작 → jobId
    │   └── premium/route.ts         # 결제 검증 후 유료 생성
    ├── jobs/[id]/route.ts           # 생성 상태 폴링/스트리밍
    ├── auth/
    │   ├── magic-link/route.ts      # 매직링크 메일 발송
    │   └── verify/route.ts          # 토큰 검증 + 세션 발급 + redirect
    └── checkout/
        ├── route.ts                 # 결제 세션 생성
        └── webhook/route.ts         # 결제 완료 webhook (진실 공급원)

src/proxy.ts                         # ⚠ Next.js 16에서 middleware.ts → proxy.ts
src/lib/{auth,ai,payments,db}/
src/components/ui/
```

## 설계 원칙 (WHY)

### 1. Route Group 4개로 영역 분리
`(funnel)` `(upgrade)` `(auth)` `(account)` — URL에는 안 보이지만 **레이아웃이 완전히 다릅니다**.
랜딩은 풀 헤더/푸터, 퍼널은 집중 모드, 결제는 이탈 방지 UI, 마이페이지는 앱 셸.
그룹마다 `layout.tsx`로 분리.

### 2. 5단계 입력은 `[step]` 동적 세그먼트 (현재 결정)
`/naming/new/2` 처럼 URL에 단계가 박혀야 **뒤로가기 / 새로고침 / 이탈 후 복귀**가 자연스럽습니다.
입력값은 sessionStorage(또는 zustand persist 등)에 임시 저장 — 매 단계마다 서버 저장 불필요.

> **추후 변경 가능**: 단계 수가 줄거나, 한 화면에서 모두 처리하는 UX로 바뀌면
> 단일 `/naming/new` + 내부 상태 방식으로 갈 수 있습니다.
> 그때는 라우팅보다 폼 상태 라이브러리(예: react-hook-form) 의존도가 더 커집니다.

### 3. 결과는 `id` 기반, 무료/유료는 *상태*로 관리
`results/[id]`(무료) ↔ `upgrade/[resultId]/result`(유료)는 같은 `id`를 공유.
DB 테이블에 `paid: boolean`, `paidGeneratedAt` 같은 필드로 상태 표현.
"이 결과의 유료 버전을 산다"가 자연스럽게 표현됩니다.

### 4. AI 로딩 페이지는 `loading.tsx`가 아닌 별도 `page.tsx`
`loading.tsx`는 *navigation/data fetching 중* 잠깐 보여주는 Suspense fallback.
AI 생성처럼 **수십 초 걸리고 jobId로 폴링/스트리밍해야 하는 작업**은
일반 페이지로 만들어 폴링하다가 완료되면 `router.replace('/results/[id]')`.

### 5. 매직링크는 `/login`과 `/upgrade/[id]`에서 재사용
- **첫 결제 유저**: `/upgrade/[id]` → 이메일 입력 → 매직링크 → `/api/auth/verify`
  → 세션 생성 → `/upgrade/[id]/checkout`로 redirect
- **재방문 유료 유저**: `/login` → 매직링크 → `/api/auth/verify` → `/mypage`로 redirect
- `verify`는 `redirect_to` 쿼리로 분기. 인증 코어는 동일, 진입점만 다름.

### 6. `proxy.ts`(구 middleware) 역할은 최소로
`(account)` 영역만 세션 체크 + redirect. 나머지는 layout/server component에서 처리.
> Next.js 16부터 파일명이 `middleware.ts` → `proxy.ts`로 변경됨.

### 7. 결제 webhook은 별도 `route.ts`
사용자 브라우저가 결제 후 돌아오는 경로(`/upgrade/[id]/generating`)와
결제사 서버가 호출하는 webhook(`/api/checkout/webhook`)은 **반드시 분리**.
**webhook이 진실 공급원**이고, 클라이언트 redirect는 UX용. webhook이 도착해야 `premium` 생성을 트리거.

## 빠뜨리기 쉬운 디테일

- 무료 결과 생성 시 익명 `result.id`를 발급하고, 매직링크 인증 시 해당 `result`를 유저 계정에
  **귀속**시키는 단계가 필요. (`verify` 시 `?resultId=`를 함께 넘기거나 결제 시 묶기)
- 매직링크 만료 시간은 짧게(10~15분), **1회용**.
- `upgrade/[id]/result`는 인증 + 결제완료 둘 다 검사.
- `mypage/results/[id]`는 본인 소유 검사 필수.

## 도메인이 더 늘어나면

회사명 작명·펫 이름 등 도메인이 4~5개로 확장되면 `src/features/<domain>/` 레이어 도입을 검토.
지금은 평탄한 구조가 더 빠릅니다.
