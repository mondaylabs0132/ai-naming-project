# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 명령어

패키지 매니저는 **pnpm** (workspace).

```bash
pnpm dev      # 개발 서버 (localhost:3000)
pnpm build    # 프로덕션 빌드
pnpm lint     # ESLint
```

테스트 스위트는 없다. Supabase Edge Function은 Vercel 배포에 실리지 않으므로 별도 배포 필요: `supabase functions deploy premium-email`.

## 스택

Next.js 16 (App Router, `src/proxy.ts` — middleware.ts 아님) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (DB/Auth) · Toss Payments · 모바일 전용 390px UI (디자인 토큰은 `DESIGN.md`).

## 아키텍처 — 문서와 다르거나 문서에 없는 실제 동작

라우팅/퍼널 설계는 `docs/architecture.md` 참고. 단, 코드가 진실이며 아래가 현재 구현이다.

### AI 생성 파이프라인 (2단계)

1. `POST /api/naming/free` — 설문 검증 후 `naming_requests` + `naming_surveys` 행만 생성, `requestId` 반환. AI 호출 없음.
2. `POST /api/naming/[requestId]/free` (또는 `/premium`) — 실제 AI 생성. `runtime = "nodejs"`, `maxDuration = 300`. 이미 생성된 `name_candidates`가 있으면 캐시로 반환(재호출 안전).

핵심 로직은 전부 `src/app/api/naming/[requestId]/_lib.ts` 한 파일에 있다: OpenAI/Anthropic을 SDK 없이 fetch로 직접 호출하고, 모델명이 `claude`로 시작하면 Anthropic으로 라우팅. 모델·타임아웃은 `AI_MODEL_NAME_GEN`, `AI_MODEL_DETAIL`, `AI_MODEL_BRIEF`, `AI_TIMEOUT_MS`, `AI_DEADLINE_MS`, `AI_MAX_ATTEMPTS` env로 제어. `AI_DEADLINE_MS`는 **AI 호출 1건당** 예산이라 라우트 최악 소요가 `maxDuration`을 넘을 수 있음(해당 파일 상단 주석 참고).

### 인증 · 무료 사용량

- 인증은 **이메일 OTP** (`/api/auth/otp` → `/api/auth/verify`). architecture.md의 "매직링크"는 구식 표현.
- `src/proxy.ts`가 모든 요청에 `visitor_id` 쿠키(httpOnly, UUID)를 부여하고 Supabase 세션을 갱신. 무료 사용 제한은 이 쿠키 + IP 해시(`FREE_TRIAL_IP_PEPPER`) 기반 — `src/lib/free-usage/`.
- 무료 생성 라우트는 `consumeFreeUsage` → 실패 시 `rollbackFreeUsage` 패턴을 지킨다. 실패 경로에서 롤백을 빠뜨리면 사용자가 무료 1회를 그냥 잃는다.
- **제한은 무료 AI 생성 지점에만 건다.** 랜딩·설문 페이지에서 막으면 비용은 안 줄고(AI는 생성 라우트에서만 호출) 결제 경로만 사라진다 — 결제는 `requestId`(설문)가 있어야 가능하기 때문. 소진된 사용자는 설문을 끝까지 작성한 뒤 `/free-limit?requestId=…` → `/upgrade/[requestId]`로 유료 전환한다.
- 한도: 방문자 1회 / 30일, IP 5회 / 24시간. 결제 이력이 있는 사용자는 IP 제한만 면제(`ipLimitBypass`) — 공유 IP(통신사 NAT) 오탐 방지용이고 방문자 제한은 그대로다.
- 무료 결과 없이 곧바로 결제한 요청은 유료 생성이 이름 20개를 `sort_order` 0부터 채운다. `name_candidates`에 `CHECK (is_free_visible = (sort_order = 0))` 제약이 있어 0번 행만 `is_free_visible = true`여야 한다.

### 결제 (Toss Payments)

`/api/checkout/prepare` → 클라이언트 결제 → `/api/checkout/confirm` + `/api/checkout/webhook`(진실 공급원) → `/api/naming/[requestId]/premium` 트리거. 환불은 `/api/checkout/refund` + `supabase/migrations/*_generation_tracking_and_refund.sql` 참고. 서버 로직은 `src/lib/payments/`.

### Supabase 규칙

- **스키마의 진실은 Supabase에 있다.** 저장소의 `supabase/migrations/`는 최근 변경분만 담고 있어 전체 스키마를 대변하지 않는다. RLS는 private 스키마 헬퍼 함수로 구현돼 있다.
- 새 테이블 생성 시 `authenticated`·`service_role` 양쪽에 **GRANT를 명시**해야 한다. 빠뜨리면 에러 없이 조용히 빈 결과가 나온다.
- 이름 후보는 요청당 **20개 고정** — `name_candidates.sort_order`에 CHECK 제약이 있어 개수를 바꾸려면 스키마도 함께 수정해야 한다.
- 클라이언트 구분: `src/lib/supabase/server.ts`(세션 기반, RLS 적용) vs `admin.ts`(service role, RLS 우회). API 라우트에서 소유권 검사 없이 admin 클라이언트를 쓰지 말 것.
