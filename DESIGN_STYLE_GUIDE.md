# WeTee Design Style Guide
**Version**: 2.0
**Last Updated**: 2025-12-03
**Platform**: Web (Next.js + Tailwind CSS)
**Design Philosophy**: Modern, Clean, Minimalist with Bento Grid Layout

---

## 📑 목차

1. [디자인 철학](#1-디자인-철학)
2. [핵심 비주얼 스타일](#2-핵심-비주얼-스타일)
3. [색상 시스템](#3-색상-시스템)
4. [타이포그래피](#4-타이포그래피)
5. [간격 및 레이아웃](#5-간격-및-레이아웃)
6. [컴포넌트 스타일](#6-컴포넌트-스타일)
7. [애니메이션 및 인터랙션](#7-애니메이션-및-인터랙션)
8. [Glassmorphism 적용](#8-glassmorphism-적용)
9. [다크 모드 (추후 확장)](#9-다크-모드-추후-확장)
10. [구현 가이드](#10-구현-가이드)

---

## 1. 디자인 철학

### 1.1 핵심 컨셉
**"Bento Grid Layout with Apple-style Minimalism"**

WeTee는 과외 관리의 복잡함을 시각적으로 단순하게 정리하는 플랫폼입니다.
마치 도시락(Bento)처럼 각 기능을 깔끔한 카드로 나누어 제공하며, Apple의 위젯 요약 스타일처럼 한눈에 정보를 파악할 수 있도록 합니다.

### 1.2 디자인 원칙
1. **Visual Hierarchy**: 중요한 정보를 먼저 보여줍니다
2. **Consistency**: 모든 화면에서 일관된 경험을 제공합니다
3. **Clarity**: 불필요한 장식 없이 명확하게 전달합니다
4. **Trust**: 깔끔한 디자인으로 전문성과 신뢰를 줍니다
5. **Efficiency**: 사용자가 빠르게 목표를 달성할 수 있도록 돕습니다

### 1.3 타깃 감성
- **Clean**: 깔끔하고 정돈된 느낌
- **Professional**: 전문적이고 믿음직한 느낌
- **Modern**: 최신 트렌드를 반영한 세련된 느낌
- **Friendly**: 부담스럽지 않고 친근한 느낌
- **Premium**: 고급스러우면서도 과하지 않은 느낌

---

## 2. 핵심 비주얼 스타일

### 2.1 Bento Grid Layout

**개념**: 일본 도시락(Bento)처럼 화면을 여러 카드로 나누어 구성하는 레이아웃 방식

#### 특징:
- **Grid 기반**: CSS Grid를 활용한 유연한 배치
- **다양한 크기**: 1x1, 1x2, 2x1, 2x2 등 다양한 카드 크기 지원
- **간격 통일**: 모든 카드 간 간격은 16px (--spacing-l) 또는 24px (--spacing-xl)
- **반응형**: 화면 크기에 따라 자동으로 재배치

#### 레이아웃 패턴:
```
┌─────────────┬─────────────┬─────────────┐
│             │             │             │
│   Card 1    │   Card 2    │   Card 3    │
│   (1x1)     │   (1x1)     │   (1x1)     │
│             │             │             │
├─────────────┴─────────────┼─────────────┤
│                           │             │
│       Card 4 (2x1)        │   Card 5    │
│                           │   (1x2)     │
│                           │             │
├───────────────────────────┼─────────────┤
│                           │             │
│       Card 6 (2x2)        │             │
│                           │             │
└───────────────────────────┴─────────────┘
```

#### Tailwind 구현 예시:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  <BentoCard size="1x1">Card 1</BentoCard>
  <BentoCard size="1x1">Card 2</BentoCard>
  <BentoCard size="1x2" className="lg:col-span-2">Card 3</BentoCard>
</div>
```

### 2.2 카드 스타일 (Core Visual Element)

#### 기본 사양:
- **모서리**: 매우 큰 둥근 모서리 `rounded-[2.5rem]` (40px)
- **배경**: 흰색 `bg-white`
- **그림자**: 부드럽고 자연스러운 그림자 `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`
- **테두리**: 없음 (선택적으로 매우 얇은 테두리 가능)
- **패딩**: 내부 여백 24px~32px

#### 시각적 레이어링:
```
Layer 1 (배경): Light Grey (#F5F7FA)
           ↓
Layer 2 (오로라 효과): Soft Blue & Purple Gradient (mix-blend-multiply)
           ↓
Layer 3 (카드): White Cards with 40px border-radius
           ↓
Layer 4 (콘텐츠): Text, Icons, Charts
```

#### 카드 상태별 스타일:
```css
/* Default State */
.bento-card {
  background: white;
  border-radius: 2.5rem;
  box-shadow: 0 8px 30px rgb(0 0 0 / 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hover State (클릭 가능한 카드) */
.bento-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.08);
}

/* Active State */
.bento-card:active {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.06);
}

/* Focus State (접근성) */
.bento-card:focus-visible {
  outline: 3px solid #007AFF;
  outline-offset: 4px;
}
```

### 2.3 배경 스타일

#### Base Background:
- **색상**: Light Grey `#F5F7FA` (약간 푸른기가 도는 회색)
- **대안**: `#FAFBFC` (더 밝은 회색)

#### Aurora Effect (오로라 그라데이션):
배경에 부드러운 색상 효과를 추가하여 생동감을 부여합니다.

```css
.page-background {
  position: relative;
  background: #F5F7FA;
  overflow: hidden;
}

/* Aurora Gradient Overlay */
.page-background::before,
.page-background::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  mix-blend-mode: multiply;
  pointer-events: none;
}

/* Blue Aurora */
.page-background::before {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%);
  top: -100px;
  left: -100px;
}

/* Purple Aurora */
.page-background::after {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%);
  bottom: -150px;
  right: -150px;
}
```

#### Tailwind 구현:
```tsx
<div className="relative min-h-screen bg-gray-50 overflow-hidden">
  {/* Aurora Effects */}
  <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[80px] opacity-60 mix-blend-multiply pointer-events-none" />
  <div className="absolute -bottom-36 -right-36 w-[500px] h-[500px] bg-purple-400/25 rounded-full blur-[80px] opacity-60 mix-blend-multiply pointer-events-none" />

  {/* Content */}
  <div className="relative z-10">
    {/* Your Bento Cards Here */}
  </div>
</div>
```

---

## 3. 색상 시스템

### 3.1 Primary Colors (주 색상)

#### Dodger Blue (Primary Brand Color)
```css
--color-primary-50: #E3F2FD;   /* 매우 밝은 배경 */
--color-primary-100: #BBDEFB;  /* 밝은 배경 */
--color-primary-200: #90CAF9;  /* 연한 강조 */
--color-primary-300: #64B5F6;  /* 중간 강조 */
--color-primary-400: #42A5F5;  /* 중간 */
--color-primary-500: #007AFF;  /* ★ Main (Apple Blue) */
--color-primary-600: #0066CC;  /* 진한 강조 */
--color-primary-700: #0056B3;  /* 호버 상태 */
--color-primary-800: #004799;  /* 액티브 상태 */
--color-primary-900: #003A75;  /* 가장 진한 */
```

**사용 용도**:
- 주요 버튼 (CTA)
- 링크 색상
- 중요한 아이콘
- 진행률 바
- 선택된 상태

### 3.2 Accent Colors (강조 색상)

#### Purple (AI/Intelligence)
```css
--color-purple-500: #A855F7;  /* AI 추천, 고급 기능 */
--color-purple-600: #9333EA;  /* 호버 */
--color-purple-700: #7E22CE;  /* 액티브 */
```

**사용 용도**: AI 분석, 인사이트, 프리미엄 기능

#### Green (Success/Growth)
```css
--color-green-500: #10B981;   /* 성공, 완료, 성장 */
--color-green-600: #059669;   /* 호버 */
--color-green-700: #047857;   /* 액티브 */
```

**사용 용도**: 출석 완료, 결제 완료, 긍정적 지표

#### Amber (Warning/Attention)
```css
--color-amber-500: #F59E0B;   /* 주의, 대기 */
--color-amber-600: #D97706;   /* 호버 */
--color-amber-700: #B45309;   /* 액티브 */
```

**사용 용도**: 지각, 보강 필요, 알림

#### Red (Error/Absence)
```css
--color-red-500: #EF4444;     /* 에러, 결석 */
--color-red-600: #DC2626;     /* 호버 */
--color-red-700: #B91C1C;     /* 액티브 */
```

**사용 용도**: 결석, 에러 메시지, 삭제 버튼

### 3.3 Neutral Colors (회색조)

```css
--color-gray-50: #FAFAFA;     /* 매우 밝은 배경 */
--color-gray-100: #F5F5F5;    /* 밝은 배경 */
--color-gray-200: #EEEEEE;    /* 구분선, 비활성 배경 */
--color-gray-300: #E0E0E0;    /* 테두리 */
--color-gray-400: #BDBDBD;    /* Placeholder */
--color-gray-500: #9E9E9E;    /* 보조 텍스트 */
--color-gray-600: #757575;    /* 서브 텍스트 */
--color-gray-700: #616161;    /* 본문 텍스트 */
--color-gray-800: #424242;    /* 진한 텍스트 */
--color-gray-900: #212121;    /* 제목, 강조 텍스트 */
```

### 3.4 Semantic Colors (의미 색상)

```css
--color-success: #10B981;     /* 성공 */
--color-warning: #F59E0B;     /* 경고 */
--color-error: #EF4444;       /* 오류 */
--color-info: #3B82F6;        /* 정보 */
```

### 3.5 Background & Surface

```css
--color-background-base: #F5F7FA;      /* 페이지 배경 */
--color-background-alt: #FFFFFF;       /* 카드 배경 */
--color-surface: #FFFFFF;              /* 카드, 모달 */
--color-overlay: rgba(0, 0, 0, 0.5);   /* 모달 백드롭 */
```

### 3.6 색상 사용 규칙

1. **Primary Blue**: 모든 주요 액션 (로그인, 저장, 확인 등)
2. **Green**: 긍정적 결과 (출석, 완료, 성공)
3. **Amber**: 주의 필요 (지각, 대기 중)
4. **Red**: 부정적 결과 또는 위험 (결석, 삭제, 오류)
5. **Purple**: 특별한 기능 (AI, 프리미엄)
6. **Gray**: 비활성, 보조 정보

---

## 4. 타이포그래피

### 4.1 폰트 패밀리

#### Primary Font: **Pretendard**
- **라이선스**: SIL Open Font License
- **특징**: 한글과 영문 모두 잘 어울리는 깔끔한 Sans-serif
- **Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

:root {
  --font-family-base: 'Pretendard', -apple-system, BlinkMacSystemFont,
                      'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}
```

#### Monospace Font (선택적, 코드용):
```css
--font-family-mono: 'SF Mono', 'Monaco', 'Cascadia Code', 'Consolas', monospace;
```

### 4.2 폰트 크기 (Scale)

```css
/* Display (큰 제목) */
--font-size-display-lg: 48px;   /* 3rem */
--font-size-display-md: 40px;   /* 2.5rem */
--font-size-display-sm: 36px;   /* 2.25rem */

/* Heading (제목) */
--font-size-h1: 32px;           /* 2rem */
--font-size-h2: 24px;           /* 1.5rem */
--font-size-h3: 20px;           /* 1.25rem */
--font-size-h4: 18px;           /* 1.125rem */

/* Body (본문) */
--font-size-body-lg: 18px;      /* 1.125rem */
--font-size-body-md: 16px;      /* 1rem - Base */
--font-size-body-sm: 14px;      /* 0.875rem */

/* Small (작은 텍스트) */
--font-size-caption: 12px;      /* 0.75rem */
--font-size-overline: 10px;     /* 0.625rem */
```

### 4.3 폰트 굵기 (Weight)

```css
--font-weight-regular: 400;     /* 일반 텍스트 */
--font-weight-medium: 500;      /* 강조 텍스트 */
--font-weight-semibold: 600;    /* 서브 타이틀 */
--font-weight-bold: 700;        /* 제목 */
--font-weight-extrabold: 800;   /* 강한 제목 (선택적) */
```

### 4.4 행간 (Line Height)

```css
--line-height-tight: 1.25;      /* 125% - 제목용 */
--line-height-normal: 1.5;      /* 150% - 본문용 */
--line-height-relaxed: 1.75;    /* 175% - 긴 본문용 */
```

### 4.5 타이포그래피 스케일 (사용 예시)

| Element     | Size | Weight | Line Height | Use Case                  |
|-------------|------|--------|-------------|---------------------------|
| Display-LG  | 48px | 700    | 1.2         | 랜딩 페이지 메인 타이틀      |
| H1          | 32px | 700    | 1.25        | 페이지 제목                |
| H2          | 24px | 600    | 1.25        | 섹션 제목                  |
| H3          | 20px | 600    | 1.3         | 카드 제목                  |
| Body-LG     | 18px | 400    | 1.5         | 중요한 본문                |
| Body-MD     | 16px | 400    | 1.5         | 일반 본문 (기본)           |
| Body-SM     | 14px | 400    | 1.5         | 보조 정보                 |
| Caption     | 12px | 400    | 1.5         | 메타 정보, 라벨            |

### 4.6 텍스트 색상

```css
--text-primary: var(--color-gray-900);      /* 제목, 중요 텍스트 */
--text-secondary: var(--color-gray-600);    /* 보조 텍스트 */
--text-tertiary: var(--color-gray-500);     /* 부가 정보 */
--text-disabled: var(--color-gray-400);     /* 비활성 텍스트 */
--text-link: var(--color-primary-500);      /* 링크 */
--text-error: var(--color-red-600);         /* 에러 메시지 */
--text-success: var(--color-green-600);     /* 성공 메시지 */
--text-on-primary: #FFFFFF;                 /* Primary 배경 위 텍스트 */
```

---

## 5. 간격 및 레이아웃

### 5.1 간격 시스템 (4pt Grid)

모든 간격은 4의 배수를 사용합니다.

```css
--spacing-0: 0px;
--spacing-1: 4px;      /* 0.25rem */
--spacing-2: 8px;      /* 0.5rem */
--spacing-3: 12px;     /* 0.75rem */
--spacing-4: 16px;     /* 1rem */
--spacing-5: 20px;     /* 1.25rem */
--spacing-6: 24px;     /* 1.5rem */
--spacing-8: 32px;     /* 2rem */
--spacing-10: 40px;    /* 2.5rem */
--spacing-12: 48px;    /* 3rem */
--spacing-16: 64px;    /* 4rem */
--spacing-20: 80px;    /* 5rem */
--spacing-24: 96px;    /* 6rem */
```

### 5.2 컴포넌트별 간격 가이드

```css
/* Card */
--card-padding: 24px;              /* 카드 내부 패딩 */
--card-gap: 16px;                  /* 카드 간 간격 */
--card-header-gap: 12px;           /* 카드 헤더 내부 간격 */

/* Layout */
--layout-padding-mobile: 16px;     /* 모바일 화면 좌우 패딩 */
--layout-padding-desktop: 32px;    /* 데스크톱 화면 좌우 패딩 */
--section-gap: 48px;               /* 섹션 간 간격 */

/* Form */
--form-field-gap: 16px;            /* 폼 필드 간 간격 */
--form-label-gap: 8px;             /* 라벨-입력 간 간격 */

/* Button */
--button-padding-x: 24px;          /* 버튼 좌우 패딩 */
--button-padding-y: 12px;          /* 버튼 상하 패딩 */
--button-gap: 12px;                /* 버튼 간 간격 */
```

### 5.3 Border Radius (둥근 모서리)

```css
--radius-xs: 4px;                  /* 작은 요소 (Badge) */
--radius-sm: 8px;                  /* 작은 카드, Input */
--radius-md: 12px;                 /* 일반 카드 */
--radius-lg: 16px;                 /* 큰 카드 */
--radius-xl: 24px;                 /* 매우 큰 카드 */
--radius-2xl: 32px;                /* 특별한 카드 */
--radius-bento: 40px;              /* ★ Bento 카드 전용 */
--radius-full: 9999px;             /* 완전한 원형 */
```

**Bento Card 기본값**: `--radius-bento: 40px` (2.5rem)

### 5.4 Shadows (그림자)

```css
/* Elevation Levels */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.12);
--shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.14);

/* ★ Bento Card Shadow (부드럽고 자연스러운 그림자) */
--shadow-bento: 0 8px 30px rgba(0, 0, 0, 0.04);
--shadow-bento-hover: 0 12px 40px rgba(0, 0, 0, 0.08);
```

### 5.5 Z-Index (레이어)

```css
--z-base: 0;                       /* 기본 레이어 */
--z-dropdown: 1000;                /* 드롭다운 */
--z-sticky: 1020;                  /* Sticky 헤더 */
--z-fixed: 1030;                   /* Fixed 요소 */
--z-modal-backdrop: 1040;          /* 모달 배경 */
--z-modal: 1050;                   /* 모달 */
--z-popover: 1060;                 /* 팝오버 */
--z-tooltip: 1070;                 /* 툴팁 */
--z-notification: 1080;            /* 알림 토스트 */
```

---

## 6. 컴포넌트 스타일

### 6.1 BentoCard (핵심 컴포넌트)

#### 기본 스타일:
```tsx
<div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300">
  {/* Content */}
</div>
```

#### 크기 변형:
- **Small**: `p-4` (16px padding)
- **Medium**: `p-6` (24px padding) - **기본값**
- **Large**: `p-8` (32px padding)

#### 인터랙티브 변형:
```tsx
{/* Clickable Card */}
<div className="... hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 cursor-pointer">
  {/* Content */}
</div>
```

### 6.2 Button (버튼)

#### Primary Button:
```tsx
<button className="
  px-6 py-3
  bg-primary-500 hover:bg-primary-600 active:bg-primary-700
  text-white font-semibold text-base
  rounded-2xl
  shadow-md hover:shadow-lg
  transition-all duration-200
  focus:outline-none focus:ring-4 focus:ring-primary-200
">
  로그인
</button>
```

#### Secondary Button:
```tsx
<button className="
  px-6 py-3
  bg-white hover:bg-gray-50 active:bg-gray-100
  text-gray-700 font-semibold text-base
  border-2 border-gray-300
  rounded-2xl
  transition-all duration-200
  focus:outline-none focus:ring-4 focus:ring-gray-200
">
  취소
</button>
```

#### Ghost Button:
```tsx
<button className="
  px-6 py-3
  bg-transparent hover:bg-gray-100 active:bg-gray-200
  text-gray-700 font-medium text-base
  rounded-2xl
  transition-all duration-200
">
  건너뛰기
</button>
```

### 6.3 Input (입력 필드)

```tsx
<input
  type="text"
  className="
    w-full px-4 py-3
    bg-white border-2 border-gray-200
    focus:border-primary-500 focus:ring-4 focus:ring-primary-100
    rounded-xl
    text-base text-gray-900
    placeholder:text-gray-400
    transition-all duration-200
    outline-none
  "
  placeholder="이메일을 입력하세요"
/>
```

#### Error State:
```tsx
<input
  className="... border-red-500 focus:border-red-500 focus:ring-red-100"
/>
<p className="mt-2 text-sm text-red-600">이메일 형식이 올바르지 않습니다</p>
```

### 6.4 Badge (배지)

```tsx
{/* Success Badge */}
<span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
  출석
</span>

{/* Warning Badge */}
<span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
  지각
</span>

{/* Error Badge */}
<span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
  결석
</span>
```

### 6.5 Navigation & Header

#### Top Navigation:
```tsx
<header className="
  sticky top-0 z-sticky
  bg-white/80 backdrop-blur-md
  border-b border-gray-200
  px-6 py-4
">
  {/* Nav Content */}
</header>
```

### 6.6 Widget Cards (Dashboard)

#### Calendar Widget:
```tsx
<BentoCard className="lg:col-span-2">
  <h3 className="text-xl font-bold text-gray-900 mb-4">이번 주 일정</h3>
  {/* Calendar Component */}
</BentoCard>
```

#### Revenue Chart Widget:
```tsx
<BentoCard>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">이번 달 수익</h3>
    <span className="text-2xl font-bold text-primary-500">₩1,200,000</span>
  </div>
  {/* Bar Chart */}
</BentoCard>
```

#### AI Analysis Widget:
```tsx
<BentoCard className="bg-gradient-to-br from-purple-50 to-blue-50">
  <div className="flex items-center gap-2 mb-3">
    <span className="text-2xl">🤖</span>
    <h3 className="text-lg font-semibold text-gray-900">AI 인사이트</h3>
  </div>
  <p className="text-sm text-gray-600">
    지난 달 대비 출석률이 15% 상승했습니다
  </p>
</BentoCard>
```

---

## 7. 애니메이션 및 인터랙션

### 7.1 Timing Functions (이징)

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);  /* Material Design */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* Spring effect */
```

### 7.2 Duration (지속 시간)

```css
--duration-fast: 150ms;        /* 빠른 전환 */
--duration-normal: 200ms;      /* 일반 전환 */
--duration-slow: 300ms;        /* 느린 전환 */
--duration-slower: 500ms;      /* 매우 느린 전환 */
```

### 7.3 Card Hover Animation

```tsx
<div className="
  transition-all duration-300 ease-smooth
  hover:-translate-y-1 hover:shadow-xl
">
  {/* Card Content */}
</div>
```

### 7.4 Page Transition

```tsx
// app/layout.tsx or page transitions
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
>
  {children}
</motion.div>
```

### 7.5 Micro-interactions

#### Button Press:
```tsx
<button className="
  active:scale-95
  transition-transform duration-150
">
  클릭
</button>
```

#### Ripple Effect (선택적):
```css
.button-ripple {
  position: relative;
  overflow: hidden;
}

.button-ripple::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.button-ripple:active::after {
  width: 300px;
  height: 300px;
}
```

---

## 8. Glassmorphism 적용

### 8.1 개념
Glassmorphism은 반투명한 배경에 블러 효과를 적용하여 유리 같은 질감을 만드는 디자인 트렌드입니다.

### 8.2 기본 Glassmorphism 스타일

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### 8.3 사용 예시

#### Glass Navigation:
```tsx
<nav className="
  fixed top-0 w-full z-sticky
  bg-white/70 backdrop-blur-md
  border-b border-white/30
">
  {/* Nav Items */}
</nav>
```

#### Glass Modal:
```tsx
<div className="
  fixed inset-0 z-modal
  bg-gray-900/50 backdrop-blur-sm
">
  <div className="
    bg-white/90 backdrop-blur-xl
    rounded-[2.5rem] shadow-2xl
    p-8 max-w-md mx-auto mt-20
  ">
    {/* Modal Content */}
  </div>
</div>
```

#### Glass Card (Accent):
```tsx
<div className="
  bg-white/60 backdrop-blur-lg
  border border-white/20
  rounded-[2.5rem] shadow-xl
  p-6
">
  {/* Special Content */}
</div>
```

### 8.4 주의사항
- **성능**: `backdrop-filter`는 성능 비용이 큽니다. 과도하게 사용하지 마세요
- **브라우저 지원**: 모든 브라우저에서 지원되지 않으므로 fallback 제공
- **가독성**: 배경이 복잡한 경우 텍스트 가독성이 떨어질 수 있습니다

---

## 9. 다크 모드 (추후 확장)

현재는 라이트 모드만 지원하며, 다크 모드는 2단계에서 구현할 예정입니다.

### 9.1 다크 모드 색상 (참고용)

```css
[data-theme="dark"] {
  --color-background-base: #0F1419;
  --color-background-alt: #1A1F28;
  --color-surface: #242A35;

  --text-primary: #E8EAED;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
}
```

---

## 10. 구현 가이드

### 10.1 Tailwind Config 확장

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          500: '#007AFF',
          600: '#0066CC',
          700: '#0056B3',
          900: '#003A75',
        },
        // ... 나머지 색상
      },
      fontFamily: {
        sans: ['Pretendard', 'var(--font-family-base)'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.2', fontWeight: '700' }],
        'display-md': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        // ... 나머지
      },
      spacing: {
        '18': '72px',
        '22': '88px',
      },
      borderRadius: {
        'bento': '2.5rem', // 40px
        '4xl': '2rem',
      },
      boxShadow: {
        'bento': '0 8px 30px rgb(0 0 0 / 0.04)',
        'bento-hover': '0 12px 40px rgb(0 0 0 / 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 10.2 BentoCard 컴포넌트 예시

```tsx
// components/ui/BentoCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface BentoCardProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  size = 'medium',
  interactive = false,
  className,
  onClick,
}) => {
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-[2.5rem] shadow-bento',
        'transition-all duration-300 ease-smooth',
        sizeClasses[size],
        interactive && 'hover:-translate-y-1 hover:shadow-bento-hover cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
```

### 10.3 페이지 레이아웃 예시

```tsx
// app/(main)/dashboard/page.tsx
import { BentoCard } from '@/components/ui/BentoCard';

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden">
      {/* Aurora Background Effects */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] bg-blue-400/30 rounded-full blur-[80px] opacity-60 mix-blend-multiply pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-[500px] h-[500px] bg-purple-400/25 rounded-full blur-[80px] opacity-60 mix-blend-multiply pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">대시보드</h1>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BentoCard>
            <h3 className="text-xl font-bold mb-2">이번 주 일정</h3>
            {/* Calendar Widget */}
          </BentoCard>

          <BentoCard interactive onClick={() => console.log('clicked')}>
            <h3 className="text-xl font-bold mb-2">출석 현황</h3>
            {/* Attendance Summary */}
          </BentoCard>

          <BentoCard className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-2">수익 분석</h3>
            {/* Revenue Chart */}
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
```

### 10.4 디자인 체크리스트

구현 시 다음 항목들을 확인하세요:

- [ ] Bento 카드는 `rounded-[2.5rem]` 적용
- [ ] 카드 그림자는 `shadow-bento` 또는 커스텀 그림자 사용
- [ ] 배경색은 `bg-gray-50` 또는 `bg-[#F5F7FA]`
- [ ] Aurora 효과 (선택적) 적용
- [ ] Primary 색상은 `#007AFF` (Apple Blue)
- [ ] Pretendard 폰트 로드 및 적용
- [ ] 모든 간격은 4의 배수
- [ ] 호버 애니메이션은 `-translate-y-1` + `shadow` 변화
- [ ] 접근성: focus-visible 스타일 적용
- [ ] 반응형: 모바일/태블릿/데스크톱 모두 고려

---

## 11. 참고 자료

### 11.1 영감 및 레퍼런스
- **Apple Design**: https://developer.apple.com/design/
- **Bento Grid Examples**: https://bentogrids.com
- **Glassmorphism**: https://glassmorphism.com
- **Tailwind UI**: https://tailwindui.com

### 11.2 관련 문서
- `UX_UI_설계서_v2.0_개발자용.md`: 전체 화면 구조 및 플로우
- `design-tokens.css`: CSS 변수 정의
- `CLAUDE.md`: 프로젝트 개발 규칙

---

## 12. 변경 이력

| 버전 | 날짜       | 작성자     | 변경 내용                          |
|------|-----------|-----------|----------------------------------|
| 2.0  | 2025-12-03| Claude    | 웹 기반 Bento Grid 디자인 시스템 확립 |
| 1.0  | 2024-11-20| Team      | 초기 모바일 디자인 시스템          |

---

**이 문서는 WeTee 프로젝트의 공식 디자인 가이드입니다.**
모든 디자인 및 개발 작업은 이 가이드를 기준으로 진행됩니다.
