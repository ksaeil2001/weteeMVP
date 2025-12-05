/**
 * CalendarView Component - WeTee MVP
 * Screen: S-012 (달력 메인 화면)
 * Feature: F-003 수업 일정 관리
 *
 * Based on:
 * - F-003_수업_일정_관리.md
 * - UX_UI_설계서.md (S-012: 달력 메인 화면)
 *
 * 역할:
 * - react-big-calendar를 사용한 월간/주간 달력 뷰
 * - 일정 표시 및 클릭 이벤트 처리
 * - 한국어 로케일 및 커스텀 툴바
 */

'use client';

import { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, ToolbarProps } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import type { Schedule, CalendarViewType, CalendarEvent } from '@/types/schedule';
import {
  schedulesToCalendarEvents,
  getEventStyle,
  SCHEDULE_TYPE_COLORS,
} from '@/lib/calendarUtils';

// date-fns localizer 설정 (한국어)
const locales = {
  ko: ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }), // 일요일 시작
  getDay,
  locales,
});

interface CalendarViewProps {
  /**
   * 일정 데이터 배열
   */
  schedules: Schedule[];
  /**
   * 현재 선택된 뷰 타입
   */
  viewType: CalendarViewType;
  /**
   * 뷰 타입 변경 핸들러
   */
  onViewChange: (view: CalendarViewType) => void;
  /**
   * 날짜 변경 핸들러 (달력 네비게이션)
   */
  onNavigate: (date: Date) => void;
  /**
   * 이벤트 클릭 핸들러
   */
  onSelectEvent: (scheduleId: string) => void;
  /**
   * 날짜 슬롯 클릭 핸들러 (새 일정 추가)
   */
  onSelectSlot?: (date: Date) => void;
  /**
   * 현재 표시 중인 날짜
   */
  currentDate: Date;
  /**
   * 로딩 상태
   */
  isLoading?: boolean;
}

/**
 * 커스텀 툴바 컴포넌트
 */
function CustomToolbar({
  label,
  onNavigate,
  onView,
  view,
}: ToolbarProps<CalendarEvent, object>) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-4 bg-white rounded-lg border border-gray-200">
      {/* 네비게이션 버튼 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="이전"
        >
          <span className="text-gray-700">←</span>
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg font-medium transition-colors"
        >
          오늘
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label="다음"
        >
          <span className="text-gray-700">→</span>
        </button>
      </div>

      {/* 현재 날짜 라벨 */}
      <div className="text-lg font-semibold text-gray-900">{label}</div>

      {/* 뷰 전환 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => onView('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'month'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          월
        </button>
        <button
          onClick={() => onView('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'week'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          주
        </button>
      </div>
    </div>
  );
}

/**
 * 범례 컴포넌트
 */
function CalendarLegend() {
  const legendItems = [
    { label: '정규 수업', color: SCHEDULE_TYPE_COLORS.REGULAR.bg },
    { label: '보강', color: SCHEDULE_TYPE_COLORS.MAKEUP.bg },
    { label: '시험', color: SCHEDULE_TYPE_COLORS.EXAM.bg },
    { label: '완료', color: '#10B981' },
    { label: '취소', color: '#EF4444' },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-4 p-4 bg-white rounded-lg border border-gray-200">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-gray-700">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * 달력 뷰 메인 컴포넌트
 */
export default function CalendarView({
  schedules,
  viewType,
  onViewChange,
  onNavigate,
  onSelectEvent,
  onSelectSlot,
  currentDate,
  isLoading = false,
}: CalendarViewProps) {
  // Schedule → CalendarEvent 변환 (메모이제이션)
  const events = useMemo(() => {
    return schedulesToCalendarEvents(schedules);
  }, [schedules]);

  // 이벤트 스타일 getter
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: getEventStyle(event),
    };
  }, []);

  // 이벤트 클릭 핸들러
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      onSelectEvent(event.id);
    },
    [onSelectEvent]
  );

  // 날짜 슬롯 클릭 핸들러 (새 일정 추가)
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date }) => {
      if (onSelectSlot) {
        onSelectSlot(slotInfo.start);
      }
    },
    [onSelectSlot]
  );

  // 뷰 변경 핸들러
  const handleViewChange = useCallback(
    (view: View) => {
      // react-big-calendar View → CalendarViewType 변환
      const viewTypeMap: Record<View, CalendarViewType> = {
        month: 'month',
        week: 'week',
        day: 'day',
        agenda: 'list',
        work_week: 'week',
      };
      onViewChange(viewTypeMap[view] || 'month');
    },
    [onViewChange]
  );

  // CalendarViewType → react-big-calendar View 변환
  const rbcView: View = viewType === 'list' ? 'month' : viewType === 'day' ? 'day' : viewType;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <CalendarLegend />
        <div
          className="flex items-center justify-center bg-gray-50 rounded-lg"
          style={{ height: '600px' }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">일정을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* 범례 */}
      <CalendarLegend />

      {/* 달력 */}
      <div style={{ height: '600px' }}>
        <Calendar<CalendarEvent>
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          style={{ height: '100%' }}
          view={rbcView}
          date={currentDate}
          onNavigate={onNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
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
            showMore: (count) => `+${count}개 더보기`,
          }}
          formats={{
            dayHeaderFormat: (date) => format(date, 'M/d (E)', { locale: ko }),
            dayRangeHeaderFormat: ({ start, end }) =>
              `${format(start, 'M/d', { locale: ko })} - ${format(end, 'M/d', { locale: ko })}`,
            monthHeaderFormat: (date) => format(date, 'yyyy년 M월', { locale: ko }),
            weekdayFormat: (date) => format(date, 'E', { locale: ko }),
            timeGutterFormat: (date) => format(date, 'HH:mm', { locale: ko }),
            eventTimeRangeFormat: ({ start, end }) =>
              `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`,
          }}
          popup
          tooltipAccessor={(event) =>
            `${event.title}\n${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}`
          }
        />
      </div>
    </div>
  );
}
