---
version: 1.1
name: 이름담다
description: >
  아기자기하고 따뜻한 감성의 AI 아기 이름 추천 서비스.
  라벤더 퍼플(#7C6FCD)을 브랜드 컬러로, 연한 라벤더 배경 위에
  흰색 카드가 떠있는 구조. 3D 캐릭터 포인트와 명확한 정보 계층으로
  예비 부모에게 신뢰감과 따뜻함을 동시에 전달하는 모바일 전용(390px) 앱.

colors:
  # Brand
  primary: "#7C6FCD"
  primary-light: "#9B8FDB"
  primary-pale: "#EAE7F8"
  primary-muted: "#C4BEDB"

  # Accent (느낌별 포인트)
  accent-yellow: "#F5C842"
  accent-yellow-pale: "#FFF8DC"
  accent-pink: "#FF8FAB"
  accent-pink-pale: "#FFF0F3"
  accent-blue: "#7EB8F7"
  accent-blue-pale: "#EEF6FF"
  accent-warm: "#FFB347"
  accent-warm-pale: "#FFF4E0"

  # Danger
  danger: "#F04438"
  danger-pale: "#FEF3F2"

  # Surface & Background
  background: "#F9F7F9"
  surface: "#FFFFFF"
  surface-section: "#F5F3FA"

  # Text
  ink: "#2D2540"
  ink-muted: "#8B849E"
  ink-light: "#C4BEDB"

  # Utility
  divider: "#EEEBF8"
  on-primary: "#FFFFFF"

typography:
  page-title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.4px
  hero:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: -0.5px
  hero-accent:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: -0.5px
    color: "{colors.primary}"
  section-title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  name-featured:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.5px
  name-side:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.3px
  stat-number:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.3px
    color: "{colors.primary}"
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: -0.1px
  body-strong:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: -0.1px
  caption:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  caption-strong:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0px
  tag:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0px
  button:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: -0.1px
  nav-label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0px

rounded:
  xs: 6px
  sm: 10px
  md: 14px
  lg: 18px
  xl: 22px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  section: 48px

shadows:
  card: "0px 2px 12px rgba(124, 111, 205, 0.08)"
  card-md: "0px 4px 16px rgba(124, 111, 205, 0.12)"
  card-featured: "0px 8px 32px rgba(124, 111, 205, 0.18)"
  button: "0px 4px 16px rgba(124, 111, 205, 0.35)"
  bottom-nav: "0px -1px 12px rgba(0, 0, 0, 0.06)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    shadow: "{shadows.button}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
    border: "1.5px solid {colors.primary}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    border: "1px solid {colors.divider}"
  section-badge:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary}"
    typography: "{typography.tag}"
    rounded: "{rounded.full}"
    size: "22px"
  stat-card:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  list-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "14px 0"
    borderBottom: "1px solid {colors.divider}"
  list-row-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    typography: "{typography.body-strong}"
    padding: "14px 0"
  card-section:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
    shadow: "{shadows.card}"
  name-card-featured:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px 20px"
    shadow: "{shadows.card-featured}"
  name-card-side:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px 16px"
    shadow: "{shadows.card}"
    opacity: "0.85"
  mood-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px 12px"
    shadow: "{shadows.card}"
  mood-card-selected:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "16px 12px"
    border: "2px solid {colors.primary}"
  filter-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.tag}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    border: "1px solid {colors.divider}"
  filter-chip-selected:
    backgroundColor: "{colors.primary-pale}"
    textColor: "{colors.primary}"
    typography: "{typography.tag}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    border: "1.5px solid {colors.primary}"
  hashtag:
    textColor: "{colors.ink-muted}"
    typography: "{typography.tag}"
  hashtag-featured:
    textColor: "{colors.primary}"
    typography: "{typography.tag}"
    fontWeight: 600
  top-nav:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    height: "52px"
    padding: "0 20px"
  bottom-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    activeColor: "{colors.primary}"
    height: "64px"
    shadow: "{shadows.bottom-nav}"
  pagination-dot:
    inactiveColor: "{colors.ink-light}"
    activeColor: "{colors.primary}"
    inactiveSize: "6px"
    activeWidth: "18px"
    rounded: "{rounded.pill}"
  avatar:
    backgroundColor: "{colors.primary-pale}"
    iconColor: "{colors.primary-muted}"
    size: "52px"
    rounded: "{rounded.full}"

---

## Overview

이름담다는 **아기자기하고 따뜻한 감성**의 AI 아기 이름 추천 서비스입니다.

**전체 페이지 공통 컨셉:**
- 배경: 연한 라벤더 그레이(`#F9F7F9`) — 차갑지 않고 포근한 인상
- 카드: 흰색(`#FFFFFF`) + 퍼플 틴트 그림자로 배경 위에 살짝 떠있는 느낌
- 브랜드 컬러: 라벤더 퍼플(`#7C6FCD`) 단일 계열로 모든 인터랙티브 요소 통일
- 3D 캐릭터/이모지: 페이지 헤드라인, 섹션 포인트에 활용해 귀엽고 감성적인 분위기
- 정보 구조: 섹션 번호 뱃지(①②③) + 카드 단위 그룹핑으로 명확한 계층
- 모바일 전용 390px, 하단 고정 탭 네비게이션 4종

---

## Colors

### Brand
- **Primary** (`#7C6FCD`): 버튼, 강조 텍스트, 활성 탭, 선택 상태 테두리. 모든 "클릭 가능" 시그널.
- **Primary Light** (`#9B8FDB`): 호버/포커스 변형.
- **Primary Pale** (`#EAE7F8`): 선택된 카드/칩 배경, 스탯 카드 배경, 섹션 번호 뱃지 배경.
- **Primary Muted** (`#C4BEDB`): 비활성 아이콘, 아바타 아이콘 컬러.

### Accent (느낌별 포인트 — 랜딩/이름 추천 영역에서만 사용)
- **Yellow** (`#F5C842`) / Pale(`#FFF8DC`): 별 아이콘, 따뜻한 느낌 카드
- **Pink** (`#FF8FAB`) / Pale(`#FFF0F3`): 하트 아이콘, 부드러운 느낌 카드
- **Blue** (`#7EB8F7`) / Pale(`#EEF6FF`): 달 아이콘, 차분한 느낌 카드
- **Warm** (`#FFB347`) / Pale(`#FFF4E0`): 태양 아이콘, 따뜻한 느낌 카드

### Danger
- **Danger** (`#F04438`): 계정 삭제 등 위험 액션 텍스트/아이콘 전용.
- **Danger Pale** (`#FEF3F2`): 위험 액션 배경(필요 시).

### Surface & Background
- **Background** (`#F9F7F9`): 전체 페이지 배경. 연한 라벤더 계열. 모든 페이지 공통.
- **Surface** (`#FFFFFF`): 카드, 바텀 네비, 입력 필드.
- **Surface Section** (`#F5F3FA`): 스탯 카드, 인라인 강조 영역의 배경.
- **Divider** (`#EEEBF8`): 리스트 행 구분선, 비활성 칩 테두리.

### Text
- **Ink** (`#2D2540`): 모든 주요 텍스트. 딥 퍼플 계열로 따뜻한 인상.
- **Ink Muted** (`#8B849E`): 서브 텍스트, 날짜, 비활성 탭, 보조 설명.
- **Ink Light** (`#C4BEDB`): 비활성 페이지네이션 도트, 플레이스홀더.

---

## Typography

### Font Family
- 전 페이지 단일 폰트: `Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif`
- `next/font/local`로 `PretendardVariable.woff2` 로컬 로드. CSS 변수 `--font-pretendard`.
- Weight ladder: **400 / 500 / 600 / 700** — 500은 태그/레이블 한정, 본문은 400, 강조는 600, 헤드라인은 700.

### Principles
- 헤드라인은 항상 **700** — 귀엽고 따뜻한 톤에 얇은 폰트는 어울리지 않음
- 이름 텍스트가 페이지에서 가장 큰 요소 (36px/700)
- 숫자 강조(`stat-number`)는 primary 컬러 + 700 weight
- 네거티브 레터스페이싱 -0.3~-0.5px으로 헤드라인 단단하게
- 본문은 15px (14px보다 가독성, 16px보다 아기자기한 느낌)

---

## Layout

### 기준
- **모바일 단일 컬럼 390px**, 좌우 패딩 20px
- 섹션 간 여백 `{spacing.section}` 48px
- 상단 네비 52px 고정, 하단 탭 64px 고정 → 콘텐츠 영역 하단 패딩 64px 필수

### 카드 레이아웃 패턴
두 페이지에서 공통으로 나타나는 레이아웃 패턴:

**패턴 A — 스탯 + 링크 행 (마이페이지 섹션 카드)**
```
┌─────────────────────────────────┐
│ ① 섹션 제목                      │
│ ┌──────────┐  결과 보러가기    >  │
│ │ 아이콘    │  분석 이력 전체보기 > │
│ │ 3개 이름  │                     │
│ └──────────┘                     │
└─────────────────────────────────┘
```
좌: `stat-card` (pale 배경, 아이콘+숫자+날짜)
우: `list-row` 링크 행 2~3개

**패턴 B — 가로 3버튼 행 (고객 지원)**
```
[📢 공지사항 >]  [? FAQ >]  [✉ 문의 >]
```
균등 3분할, 각각 아이콘 + 텍스트 + `>` 화살표

**패턴 C — 단순 리스트 행**
```
[아이콘] 이용약관                    >
[아이콘] 개인정보처리방침             >
[아이콘] 환불 정책                   >
```
아이콘(24px) + 텍스트 + 우측 `>` 화살표, 하단 divider

---

## Elevation & Depth

| 레벨 | Shadow | 사용처 |
|---|---|---|
| Flat | 없음 | 배경, 리스트 행 내부 |
| Card | `0px 2px 12px rgba(124,111,205,0.08)` | 일반 섹션 카드 |
| Card MD | `0px 4px 16px rgba(124,111,205,0.12)` | 중간 강조 카드 |
| Card Featured | `0px 8px 32px rgba(124,111,205,0.18)` | 캐러셀 중앙 이름 카드 |
| Button | `0px 4px 16px rgba(124,111,205,0.35)` | Primary CTA 버튼 |
| Bottom Nav | `0px -1px 12px rgba(0,0,0,0.06)` | 하단 탭 바 |

**핵심 규칙**: 그림자는 항상 퍼플 틴트(`rgba(124,111,205,...)`) 사용. 회색 그림자 금지.

---

## Shapes

| Token | Value | 사용처 |
|---|---|---|
| `{rounded.xs}` | 6px | 인라인 뱃지, 태그 |
| `{rounded.sm}` | 10px | 작은 칩, 소형 버튼 |
| `{rounded.md}` | 14px | 스탯 카드, 인라인 강조 박스 |
| `{rounded.lg}` | 18px | 섹션 카드, 사이드 이름 카드, 무드 카드 |
| `{rounded.xl}` | 22px | Featured 이름 카드 |
| `{rounded.pill}` | 9999px | CTA 버튼, 필터 칩, 검색 입력, 고스트 버튼 |
| `{rounded.full}` | 9999px | 아바타, 섹션 번호 뱃지, 페이지네이션 도트 |

---

## Components

### Top Navigation (`top-nav`)
배경 `{colors.background}`, 높이 52px, 좌우 패딩 20px.
- **랜딩**: 좌측 로고(별 아이콘 + "이름담다")
- **내부 페이지**: 좌측 페이지 제목(`{typography.page-title}`) + 이모지, 우측 알림 아이콘
- 스크롤 시 배경 유지, 그림자 없음

### Section Badge (`section-badge`)
섹션 번호 표시용 원형 뱃지. `{colors.primary-pale}` 배경, `{colors.primary}` 텍스트, 22px 원형.
마이페이지처럼 여러 섹션이 있는 페이지에서 ①②③④⑤⑥ 형태로 사용.

### Card Section (`card-section`)
흰 배경, `{rounded.lg}`, 패딩 20px, 퍼플 틴트 그림자. 섹션 단위 컨테이너.
내부: 상단 `section-badge` + 섹션 제목, 하단 콘텐츠.

### Stat Card (`stat-card`)
`{colors.surface-section}` 배경(pale), `{rounded.md}`, 패딩 16px.
구성: 좌측 아이콘(퍼플 계열) + 라벨 텍스트 + 숫자(`{typography.stat-number}`, primary 컬러) + 날짜/서브텍스트.

### List Row (`list-row`)
아이콘(24px, `{colors.primary}` 또는 `{colors.ink-muted}`) + 텍스트 + 우측 `>` 화살표(`{colors.ink-light}`).
하단 `{colors.divider}` 1px 구분선. 패딩 14px 상하.

### List Row Danger (`list-row-danger`)
`list-row`와 동일한 구조이나 텍스트와 아이콘을 `{colors.danger}`로. 계정 삭제 등 위험 액션 전용.

### Avatar (`avatar`)
`{colors.primary-pale}` 배경 원형, 52px, 내부 구름/사람 아이콘 `{colors.primary-muted}`.

### Ghost Button (`button-ghost`)
흰 배경, `{colors.ink-muted}` 텍스트, `{colors.divider}` 테두리, `{rounded.pill}`. 로그아웃 같은 비주요 액션.

### Bottom Navigation (`bottom-nav`)
흰 배경, 높이 64px, 상단 연한 그림자. 4개 탭:
- 추천 이름 (별 아이콘)
- 보관함 (하트 아이콘)
- 공유 관리 (사람 그룹 아이콘)
- 마이페이지 (사람 아이콘)

활성 탭: 아이콘 fill + 레이블 모두 `{colors.primary}`.
비활성 탭: `{colors.ink-muted}`, outline 아이콘.

---

## Do's and Don'ts

### Do
- 모든 페이지 배경은 `{colors.background}` (#F9F7F9) — 연한 라벤더 유지
- 카드는 항상 흰 배경 + 퍼플 틴트 그림자
- 섹션이 여러 개인 페이지는 `section-badge`로 번호 부여
- 리스트 행 우측에 항상 `>` 화살표로 이동 가능함을 표시
- 위험 액션(삭제 등)은 반드시 `{colors.danger}` 단독 사용
- 숫자/수치 강조는 `{typography.stat-number}` + `{colors.primary}`
- 버튼은 `{rounded.pill}` — 서비스 전체 시그니처
- 그림자는 항상 퍼플 틴트(`rgba(124,111,205,...)`)

### Don't
- 회색 계열 그림자 사용 금지
- 배경을 흰색(`#FFFFFF`)으로 사용 금지 — 카드 안만 흰색
- 헤드라인 fontWeight 400/500 금지 — 최소 600, 주요 헤드라인 700
- `danger` 컬러를 일반 텍스트나 장식에 사용 금지 — 위험 액션 전용
- 하단 탭 위 콘텐츠 겹치기 금지 — 하단 패딩 64px 필수
- accent 컬러(노랑/핑크/블루)를 마이페이지 등 유틸리티 페이지에 사용 금지 — 이름 추천 영역 전용

---

## Quick Color Reference
```
Primary:          #7C6FCD  (버튼, 강조, 활성 탭, 링크)
Primary Pale:     #EAE7F8  (선택 배경, 스탯 카드, 섹션 뱃지)
Background:       #F9F7F9  (전체 페이지 배경 — 모든 페이지 공통)
Surface:          #FFFFFF  (카드, 바텀 네비)
Ink:              #2D2540  (주요 텍스트)
Ink Muted:        #8B849E  (보조 텍스트, 비활성)
Danger:           #F04438  (위험 액션 전용)
Accent Yellow:    #F5C842  (별, 이름 추천 영역)
Accent Pink:      #FF8FAB  (하트, 이름 추천 영역)
Accent Blue:      #7EB8F7  (달, 이름 추천 영역)
Accent Warm:      #FFB347  (태양, 이름 추천 영역)
```