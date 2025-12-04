# 구현 프롬프트 #02: 달력 뷰 (react-big-calendar) ⭐⭐

**우선순위**: 높음
**예상 소요 시간**: 2-3일
**난이도**: 중간-높음
**담당 기능**: F-003 수업 일정 관리

---

## 1. 목표

현재 리스트 뷰만 있는 `/schedule` 페이지에 **달력 뷰**를 추가하여, 사용자가 월간/주간 형태로 수업 일정을 시각적으로 확인할 수 있도록 합니다.

**핵심 요구사항**:
- 월간 달력 뷰 (기본)
- 주간 달력 뷰
- 일별 수업 일정 표시
- 수업 클릭 시 상세 화면 이동
- 뷰 전환 토글 (달력 ↔ 리스트)

---

## 2. 관련 문서

**필수 참조**:
- `/F-003_수업_일정_관리.md` (시나리오 1-3: 달력에서 일정 조회)
- `/UX_UI_설계서_v2.0_개발자용.md` (S-012: 달력 메인 화면)
- `/API_명세서.md` (GET /api/v1/schedules)
- `/데이터베이스_설계서.md` (schedules 테이블)

---

## 3. 라이브러리 선택

### 3.1 react-big-calendar 설치

```bash
cd /home/user/weteeMVP/frontend
npm install react-big-calendar date-fns
npm install --save-dev @types/react-big-calendar
```

**선택 이유**:
- ✅ 월간/주간/일간 뷰 모두 지원
- ✅ 커스터마이징 가능
- ✅ Next.js와 호환 잘됨
- ✅ 한국어 로케일 지원

**대안**:
- FullCalendar (유료 기능 많음, 무거움)
- react-calendar (단순하지만 일정 표시 기능 약함)

---

## 4. 파일 구조

### 4.1 수정할 파일
```
frontend/src/app/(main)/schedule/page.tsx  (기존 파일 수정)
```

### 4.2 새로 만들 파일
```
frontend/src/components/calendar/CalendarView.tsx
frontend/src/components/calendar/EventCard.tsx
frontend/src/lib/calendarUtils.ts
```

---

## 5. UI 요구사항

### 5.1 페이지 레이아웃

```tsx
// /schedule/page.tsx

<div className="min-h-screen bg-gray-50">
  {/* 헤더 */}
  <header className="bg-white border-b border-gray-200 p-4">
    <h1 className="text-2xl font-bold">수업 일정</h1>
  </header>

  {/* 뷰 전환 토글 */}
  <div className="bg-white border-b border-gray-200 p-4">
    <div className="flex gap-2">
      <button
        className={`flex-1 py-2 rounded-lg ${
          viewMode === 'calendar'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
        onClick={() => setViewMode('calendar')}
      >
        📅 달력 뷰
      </button>
      <button
        className={`flex-1 py-2 rounded-lg ${
          viewMode === 'list'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-700'
        }`}
        onClick={() => setViewMode('list')}
      >
        📋 리스트 뷰
      </button>
    </div>
  </div>

  {/* 컨텐츠 */}
  <div className="p-4">
    {viewMode === 'calendar' ? (
      <CalendarView
        schedules={schedules}
        onSelectEvent={handleSelectEvent}
        onNavigate={handleNavigate}
      />
    ) : (
      <ScheduleList schedules={schedules} />
    )}
  </div>

  {/* 플로팅 버튼 - 일정 추가 */}
  <button
    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg"
    onClick={() => router.push('/schedule/new')}
  >
    <span className="text-2xl">+</span>
  </button>
</div>
```

### 5.2 달력 뷰 컴포넌트

```tsx
// components/calendar/CalendarView.tsx

'use client';

import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useState } from 'react';

// 한국어 로케일 설정
const locales = {
  ko: ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ko }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    studentName: string;
    groupName: string;
    status: 'pending' | 'completed' | 'cancelled';
    type: 'regular' | 'makeup' | 'trial';
  };
}

interface CalendarViewProps {
  schedules: any[]; // API에서 받은 일정 데이터
  onSelectEvent: (event: CalendarEvent) => void;
  onNavigate: (date: Date) => void;
}

export default function CalendarView({
  schedules,
  onSelectEvent,
  onNavigate,
}: CalendarViewProps) {
  const [view, setView] = useState<View>('month'); // 'month' | 'week' | 'day'

  // API 데이터를 Calendar 이벤트 형식으로 변환
  const events: CalendarEvent[] = schedules.map((schedule) => ({
    id: schedule.id,
    title: `${schedule.subject} - ${schedule.studentName}`,
    start: new Date(schedule.startTime),
    end: new Date(schedule.endTime),
    resource: {
      studentName: schedule.studentName,
      groupName: schedule.groupName,
      status: schedule.status,
      type: schedule.type,
    },
  }));

  // 이벤트 스타일 커스터마이징
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad'; // 기본 파란색

    // 상태에 따른 색상
    if (event.resource.status === 'completed') {
      backgroundColor = '#10b981'; // 초록색 (완료)
    } else if (event.resource.status === 'cancelled') {
      backgroundColor = '#ef4444'; // 빨간색 (취소)
    }

    // 수업 타입에 따른 색상
    if (event.resource.type === 'makeup') {
      backgroundColor = '#f59e0b'; // 주황색 (보강)
    } else if (event.resource.type === 'trial') {
      backgroundColor = '#8b5cf6'; // 보라색 (체험)
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontSize: '0.875rem',
        padding: '2px 4px',
      },
    };
  };

  // 커스텀 툴바 (선택사항)
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = toolbar.date;
      return (
        <span className="text-lg font-semibold">
          {format(date, 'yyyy년 M월', { locale: ko })}
        </span>
      );
    };

    return (
      <div className="flex justify-between items-center mb-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={goToBack}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            ←
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
          >
            오늘
          </button>
          <button
            onClick={goToNext}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            →
          </button>
        </div>

        <div>{label()}</div>

        <div className="flex gap-2">
          <button
            onClick={() => toolbar.onView('month')}
            className={`px-4 py-2 rounded-lg ${
              view === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            월
          </button>
          <button
            onClick={() => toolbar.onView('week')}
            className={`px-4 py-2 rounded-lg ${
              view === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            주
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4" style={{ height: '700px' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={onSelectEvent}
        onNavigate={onNavigate}
        onView={(newView) => setView(newView)}
        view={view}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar,
        }}
        messages={{
          next: '다음',
          previous: '이전',
          today: '오늘',
          month: '월',
          week: '주',
          day: '일',
          agenda: '일정',
          date: '날짜',
          time: '시간',
          event: '일정',
          noEventsInRange: '이 기간에 일정이 없습니다.',
        }}
        formats={{
          dayHeaderFormat: (date) => format(date, 'M/d (E)', { locale: ko }),
          dayRangeHeaderFormat: ({ start, end }) =>
            `${format(start, 'M/d', { locale: ko })} - ${format(end, 'M/d', { locale: ko })}`,
          monthHeaderFormat: (date) => format(date, 'yyyy년 M월', { locale: ko }),
        }}
      />
    </div>
  );
}
```

---

## 6. 상태 관리

### 6.1 Schedule Page 상태

```tsx
// app/(main)/schedule/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CalendarView from '@/components/calendar/CalendarView';
import ScheduleList from '@/components/schedule/ScheduleList';

export default function SchedulePage() {
  const router = useRouter();

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // 일정 데이터
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 현재 표시 중인 날짜 범위
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  // 일정 데이터 로드
  useEffect(() => {
    fetchSchedules();
  }, [dateRange]);

  const fetchSchedules = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        start_date: dateRange.start.toISOString(),
        end_date: dateRange.end.toISOString(),
      });

      const response = await fetch(`/api/v1/schedules?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('일정을 불러오는 데 실패했습니다');
      }

      const data = await response.json();
      setSchedules(data.schedules);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 이벤트 클릭 핸들러
  const handleSelectEvent = (event: any) => {
    router.push(`/schedule/${event.id}`);
  };

  // 달력 네비게이션 핸들러
  const handleNavigate = (date: Date) => {
    setCurrentDate(date);

    // 해당 월의 시작일과 종료일 계산
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    setDateRange({ start, end });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold">수업 일정</h1>
      </header>

      {/* 뷰 전환 토글 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            className={`flex-1 py-2 rounded-lg font-medium ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setViewMode('calendar')}
          >
            📅 달력 뷰
          </button>
          <button
            className={`flex-1 py-2 rounded-lg font-medium ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setViewMode('list')}
          >
            📋 리스트 뷰
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : errorMessage ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{errorMessage}</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView
            schedules={schedules}
            onSelectEvent={handleSelectEvent}
            onNavigate={handleNavigate}
          />
        ) : (
          <ScheduleList schedules={schedules} />
        )}
      </div>

      {/* 플로팅 버튼 */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        onClick={() => router.push('/schedule/new')}
        aria-label="일정 추가"
      >
        <span className="text-2xl">+</span>
      </button>
    </div>
  );
}
```

---

## 7. 스타일링

### 7.1 react-big-calendar 커스텀 CSS

```css
/* app/globals.css 또는 별도 CSS 파일 */

/* 달력 전체 스타일 */
.rbc-calendar {
  font-family: inherit;
}

/* 헤더 스타일 */
.rbc-header {
  padding: 12px 4px;
  font-weight: 600;
  color: #374151;
  background-color: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

/* 오늘 날짜 강조 */
.rbc-today {
  background-color: #dbeafe !important;
}

/* 이벤트 스타일 */
.rbc-event {
  padding: 2px 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.rbc-event:hover {
  opacity: 0.8;
}

/* 선택된 이벤트 */
.rbc-event.rbc-selected {
  background-color: #1d4ed8 !important;
}

/* 주말 배경색 */
.rbc-day-bg:nth-child(1),
.rbc-day-bg:nth-child(7) {
  background-color: #fef2f2;
}

/* 비활성 날짜 (다른 달) */
.rbc-off-range-bg {
  background-color: #f9fafb;
}

/* 시간 슬롯 */
.rbc-time-slot {
  min-height: 40px;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .rbc-calendar {
    font-size: 0.75rem;
  }

  .rbc-header {
    padding: 8px 2px;
  }

  .rbc-event {
    font-size: 0.625rem;
    padding: 1px 2px;
  }
}
```

---

## 8. 추가 기능

### 8.1 범례 (Legend)

```tsx
// 달력 위에 추가
<div className="flex gap-4 mb-4 p-4 bg-white rounded-lg border border-gray-200">
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-blue-600 rounded"></div>
    <span className="text-sm">정규 수업</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-orange-500 rounded"></div>
    <span className="text-sm">보강</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-purple-600 rounded"></div>
    <span className="text-sm">체험</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-green-600 rounded"></div>
    <span className="text-sm">완료</span>
  </div>
  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-red-600 rounded"></div>
    <span className="text-sm">취소</span>
  </div>
</div>
```

### 8.2 그룹 필터

```tsx
// 상단에 그룹 필터 추가
const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

<select
  value={selectedGroup || ''}
  onChange={(e) => setSelectedGroup(e.target.value || null)}
  className="px-4 py-2 border border-gray-300 rounded-lg"
>
  <option value="">전체 그룹</option>
  {groups.map((group) => (
    <option key={group.id} value={group.id}>
      {group.name}
    </option>
  ))}
</select>
```

### 8.3 날짜 클릭 시 일정 추가

```tsx
// Calendar 컴포넌트에 추가
<Calendar
  // ... 기존 props
  selectable
  onSelectSlot={(slotInfo) => {
    router.push(
      `/schedule/new?date=${slotInfo.start.toISOString()}`
    );
  }}
/>
```

---

## 9. API 연동

### 9.1 일정 조회 API

```tsx
// GET /api/v1/schedules?start_date=2024-01-01&end_date=2024-01-31

interface Schedule {
  id: string;
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;
  subject: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  status: 'pending' | 'completed' | 'cancelled';
  type: 'regular' | 'makeup' | 'trial';
  repeatRule?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    endDate: string;
  };
}
```

---

## 10. 성능 최적화

### 10.1 메모이제이션

```tsx
import { useMemo } from 'react';

const events = useMemo(() => {
  return schedules.map((schedule) => ({
    id: schedule.id,
    title: `${schedule.subject} - ${schedule.studentName}`,
    start: new Date(schedule.startTime),
    end: new Date(schedule.endTime),
    resource: {
      studentName: schedule.studentName,
      groupName: schedule.groupName,
      status: schedule.status,
      type: schedule.type,
    },
  }));
}, [schedules]);
```

### 10.2 뷰 모드 localStorage 저장

```tsx
useEffect(() => {
  const savedViewMode = localStorage.getItem('scheduleViewMode');
  if (savedViewMode) {
    setViewMode(savedViewMode as 'calendar' | 'list');
  }
}, []);

useEffect(() => {
  localStorage.setItem('scheduleViewMode', viewMode);
}, [viewMode]);
```

---

## 11. 검증 방법

### 11.1 기능 테스트
1. `/schedule` 페이지 접근
2. "달력 뷰" 버튼 클릭 → 달력 표시 확인
3. 월간 뷰에서 일정 표시 확인
4. 일정 클릭 → 상세 페이지 이동 확인
5. "주" 버튼 클릭 → 주간 뷰 전환 확인
6. 이전/다음 버튼으로 월 이동 확인
7. "오늘" 버튼 클릭 → 현재 월로 이동 확인

### 11.2 반응형 테스트
1. 모바일 크기로 축소 → 레이아웃 깨짐 없는지 확인
2. 터치 이벤트 작동 확인

### 11.3 성능 테스트
1. 100개 이상 일정 표시 시 렌더링 속도 확인
2. 월 이동 시 API 호출 횟수 확인 (불필요한 중복 호출 방지)

---

## 12. 완료 기준 (Definition of Done)

- [ ] react-big-calendar 라이브러리 설치
- [ ] CalendarView 컴포넌트 구현
- [ ] /schedule 페이지에 달력 뷰 통합
- [ ] 월간/주간 뷰 전환 기능
- [ ] 일정 표시 (색상 구분)
- [ ] 일정 클릭 시 상세 페이지 이동
- [ ] 한국어 로케일 적용
- [ ] 커스텀 툴바 구현
- [ ] 범례 (Legend) 추가
- [ ] 그룹 필터 기능 (선택)
- [ ] 모바일 반응형 확인
- [ ] 성능 최적화 (메모이제이션)
- [ ] 실제 데이터로 테스트 완료

---

**구현 시작 전 확인사항**:
1. F-003_수업_일정_관리.md 전체 읽기
2. react-big-calendar 공식 문서 확인 (https://jquense.github.io/react-big-calendar)
3. 백엔드 일정 조회 API 준비 상태 확인
4. 기존 ScheduleList 컴포넌트 위치 확인
