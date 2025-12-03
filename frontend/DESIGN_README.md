# WeTee Design System v2.0

## 🎨 개요

WeTee 프로젝트의 공식 디자인 시스템입니다. **Bento Grid 레이아웃**과 **Apple 스타일의 미니멀리즘**을 결합한 웹 기반 디자인을 채택하고 있습니다.

## 📚 관련 문서

- **[DESIGN_STYLE_GUIDE.md](../DESIGN_STYLE_GUIDE.md)**: 전체 디자인 시스템 가이드
- **[UX_UI_설계서_v2.0_개발자용.md](../UX_UI_설계서_v2.0_개발자용.md)**: 화면별 상세 명세

## 🎯 핵심 컨셉

### Bento Grid Layout
일본 도시락(Bento)처럼 화면을 여러 카드로 나누어 구성하는 레이아웃 방식입니다.

**특징:**
- 40px 큰 둥근 모서리 (`rounded-bento`)
- 부드럽고 자연스러운 그림자
- 유연한 그리드 배치
- 인터랙티브한 호버 효과

### Apple-style Minimalism
Apple의 디자인 철학을 따라 깔끔하고 직관적인 인터페이스를 제공합니다.

## 🏗️ 구조

```
src/
├── components/
│   ├── ui/
│   │   ├── BentoCard.tsx      # 핵심 카드 컴포넌트
│   │   ├── BentoGrid.tsx      # 그리드 레이아웃
│   │   ├── Button.tsx         # 업데이트된 버튼
│   │   ├── Input.tsx          # 업데이트된 입력 필드
│   │   └── Badge.tsx          # 상태 배지
│   └── layout/
│       └── PageBackground.tsx # Aurora 배경 효과
├── styles/
│   ├── design-tokens.css      # 디자인 토큰 (변수)
│   └── globals.css            # 전역 스타일
└── lib/
    └── utils.ts               # 유틸리티 함수

tailwind.config.ts             # Tailwind 설정
```

## 🎨 색상 팔레트

### Primary (Dodger Blue)
```css
--color-primary-500: #007AFF  /* Main brand color */
```

### Accent Colors
- **Purple** (`#A855F7`): AI/Intelligence
- **Green** (`#10B981`): Success/Growth
- **Amber** (`#F59E0B`): Warning/Attention
- **Red** (`#EF4444`): Error/Absence

### Gray Scale
- **50-900**: 완전한 회색 스케일 팔레트

## 🔤 타이포그래피

### Pretendard Font
한글과 영문 모두 잘 어울리는 깔끔한 Sans-serif 폰트입니다.

```tsx
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Font Sizes
- **Display**: 48px, 40px, 36px
- **Heading**: 32px (h1), 24px (h2), 20px (h3)
- **Body**: 18px (large), 16px (default), 14px (small)
- **Caption**: 12px

## 📦 컴포넌트 사용법

### BentoCard

```tsx
import BentoCard from '@/components/ui/BentoCard';

<BentoCard size="medium" interactive onClick={handleClick}>
  <h3>카드 제목</h3>
  <p>카드 내용</p>
</BentoCard>
```

**Props:**
- `size`: 'small' | 'medium' | 'large'
- `interactive`: 호버 효과 활성화
- `glass`: Glassmorphism 효과
- `gradient`: 'purple' | 'blue' | 'green' | 'none'

### BentoGrid

```tsx
import BentoGrid from '@/components/ui/BentoGrid';

<BentoGrid cols={3} gap="medium">
  <BentoCard>Card 1</BentoCard>
  <BentoCard>Card 2</BentoCard>
  <BentoCard>Card 3</BentoCard>
</BentoGrid>
```

**Props:**
- `cols`: 1 | 2 | 3 | 4 (데스크톱 기준)
- `gap`: 'small' | 'medium' | 'large'

### PageBackground

```tsx
import PageBackground from '@/components/layout/PageBackground';

<PageBackground aurora={true}>
  {/* Your content */}
</PageBackground>
```

**Props:**
- `aurora`: Aurora 그라데이션 효과 활성화

### Button

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" size="medium" onClick={handleClick}>
  클릭
</Button>
```

**Variants:**
- `primary`: 주요 액션 (파란색)
- `secondary`: 보조 액션 (흰색 + 테두리)
- `outline`: 아웃라인
- `text`: 텍스트만
- `ghost`: 투명 배경
- `danger`: 위험한 액션 (빨간색)

### Badge

```tsx
import Badge from '@/components/ui/Badge';

<Badge variant="success">출석</Badge>
<Badge variant="warning">지각</Badge>
<Badge variant="error">결석</Badge>
```

**Variants:**
- `default`: 기본 (회색)
- `success`: 성공 (녹색)
- `warning`: 경고 (주황색)
- `error`: 오류 (빨간색)
- `info`: 정보 (파란색)
- `purple`: 특별 (보라색)

### Input

```tsx
import Input from '@/components/ui/Input';

const [value, setValue] = useState('');

<Input
  type="text"
  label="이름"
  placeholder="이름을 입력하세요"
  value={value}
  onChange={setValue}
  required
/>
```

## 🌈 Aurora 배경 효과

부드러운 푸른색과 보라색 그라데이션이 페이지 배경에 자연스럽게 녹아듭니다.

```tsx
<PageBackground aurora={true}>
  {/* Content with aurora effect */}
</PageBackground>
```

## 🔍 Glassmorphism

반투명 배경과 블러 효과로 유리 같은 질감을 표현합니다.

```tsx
<BentoCard glass>
  {/* Glass card content */}
</BentoCard>
```

또는 Tailwind 클래스로 직접 적용:

```tsx
<div className="bg-white/60 backdrop-blur-lg border border-white/20">
  {/* Content */}
</div>
```

## 📱 반응형 디자인

모든 컴포넌트는 반응형으로 설계되었습니다:

- **Mobile**: 1 column
- **Tablet** (md): 2 columns
- **Desktop** (lg): 3-4 columns

```tsx
<BentoGrid cols={3}>
  {/* 모바일: 1열, 태블릿: 2열, 데스크톱: 3열 */}
</BentoGrid>
```

## 🎭 애니메이션

### 기본 트랜지션
```tsx
transition-all duration-300 ease-smooth
```

### 호버 효과
```tsx
hover:-translate-y-1 hover:shadow-bento-hover
```

### 클릭 효과
```tsx
active:scale-95
```

## 🧪 데모 페이지

디자인 시스템의 모든 컴포넌트를 확인할 수 있는 데모 페이지를 제공합니다:

```bash
npm run dev
```

브라우저에서 `/design-demo` 경로로 이동하세요.

## 🛠️ 개발 가이드

### 새로운 컴포넌트 만들기

1. `src/components/ui/` 폴더에 파일 생성
2. 디자인 토큰(CSS 변수)과 Tailwind 클래스 사용
3. TypeScript 인터페이스 정의
4. 접근성 고려 (ARIA, 키보드 네비게이션)

### 색상 사용 규칙

- **Primary Blue**: 모든 주요 액션
- **Green**: 긍정적 결과 (출석, 완료)
- **Amber**: 주의 필요 (지각, 대기)
- **Red**: 부정적 결과 (결석, 오류)
- **Purple**: 특별한 기능 (AI, 프리미엄)
- **Gray**: 비활성, 보조 정보

### Border Radius 규칙

- **Input/작은 요소**: `rounded-xl` (12px)
- **Button**: `rounded-2xl` (16px)
- **Bento Card**: `rounded-bento` (40px)
- **Badge**: `rounded-full` (완전한 원형)

## 📋 체크리스트

새로운 화면을 구현할 때 확인하세요:

- [ ] Bento 카드는 `rounded-bento` 적용
- [ ] 카드 그림자는 `shadow-bento` 사용
- [ ] 배경색은 `bg-[#F5F7FA]` 또는 `PageBackground` 컴포넌트 사용
- [ ] Primary 색상은 `#007AFF`
- [ ] Pretendard 폰트 적용 확인
- [ ] 모든 간격은 4의 배수
- [ ] 호버 애니메이션 적용
- [ ] 접근성: focus-visible 스타일 적용
- [ ] 반응형: 모바일/태블릿/데스크톱 모두 테스트

## 🔗 참고 자료

- [Tailwind CSS](https://tailwindcss.com)
- [Pretendard Font](https://github.com/orioncactus/pretendard)
- [Apple Design Resources](https://developer.apple.com/design/)
- [Bento Grids](https://bentogrids.com)

## 📝 변경 이력

### v2.0 (2025-12-03)
- ✅ Bento Grid 레이아웃 시스템 도입
- ✅ Apple 스타일 미니멀리즘 적용
- ✅ Pretendard 폰트 적용
- ✅ Aurora 배경 효과 추가
- ✅ Glassmorphism 지원
- ✅ 모든 컴포넌트 웹 기반으로 전환
- ✅ 40px 큰 둥근 모서리 적용

### v1.0 (2024-11-20)
- 초기 React Native 기반 디자인 시스템

---

**WeTee Design System v2.0** - 깔끔하고, 직관적이며, 사용하기 쉬운 디자인 시스템
