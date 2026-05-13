# AI Naming Project

AI 작명 서비스 — 무료 체험 → 유료 전환 퍼널 구조의 웹 애플리케이션.

> ⚠️ **주의:** 이 문서는 *현재 시점*의 프로젝트 상태를 기준으로 작성되었습니다.
> 프로젝트 진행에 따라 구조·스택·스크립트가 바뀔 수 있으며,
> **변경 시 이 README.md도 함께 업데이트**해 주세요.
> 코드와 문서가 어긋날 경우 **코드를 진실로** 봅니다.

## 기술 스택

- **Framework:** Next.js 16 (App Router, `src/proxy.ts`)
- **Runtime:** React 19, TypeScript 5
- **Styling:** Tailwind CSS v4, Pretendard Variable
- **Package Manager:** pnpm (workspace)

## 시작하기

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인.

## 스크립트

| 명령 | 설명 |
|---|---|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 빌드 결과 실행 |
| `pnpm lint` | ESLint 실행 |

## 폴더 구조 (요약)

```
src/app/
├── (funnel)/    # 비로그인 퍼널 (랜딩 → 입력 → 무료 결과)
├── (upgrade)/   # 무료 → 유료 전환 (이메일 → 결제 → 유료 결과)
├── (auth)/      # 매직링크 로그인
├── (account)/   # 로그인 영역 (마이페이지)
└── api/         # 서버 엔드포인트 (naming, auth, checkout)
```

상세 라우팅 설계는 [`docs/architecture.md`](./docs/architecture.md) 참고.

## 문서

- [`docs/architecture.md`](./docs/architecture.md) — 라우팅 / 퍼널 흐름 설계
- [`DESIGN.md`](./DESIGN.md) — 디자인 시스템 (컬러, 타이포, 컴포넌트)
- [`AGENTS.md`](./AGENTS.md) — AI 코딩 에이전트 협업 규칙
