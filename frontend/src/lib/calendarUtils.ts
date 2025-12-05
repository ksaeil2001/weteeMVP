/**
 * Calendar Utilities - WeTee MVP
 * Feature: F-003 수업 일정 관리
 *
 * Based on:
 * - F-003_수업_일정_관리.md
 * - UX_UI_설계서.md (S-012: 달력 메인 화면)
 *
 * 역할:
 * - Schedule 타입을 CalendarEvent 형식으로 변환
 * - 달력 이벤트 색상 관리
 * - 날짜 범위 계산 유틸리티
 */

import type { Schedule, ScheduleType, ScheduleStatus, CalendarEvent } from '@/types/schedule';

/**
 * 일정 타입별 색상 정의
 * Based on: UX_UI_설계서.md 디자인 토큰
 */
export const SCHEDULE_TYPE_COLORS: Record<ScheduleType, { bg: string; text: string }> = {
  REGULAR: { bg: '#3B82F6', text: '#FFFFFF' },   // blue-500 (정규 수업)
  MAKEUP: { bg: '#F59E0B', text: '#FFFFFF' },    // amber-500 (보강)
  EXAM: { bg: '#8B5CF6', text: '#FFFFFF' },      // purple-500 (시험)
  HOLIDAY: { bg: '#6B7280', text: '#FFFFFF' },   // gray-500 (휴강)
  OTHER: { bg: '#10B981', text: '#FFFFFF' },     // green-500 (기타)
};

/**
 * 일정 상태별 색상 정의 (상태가 우선시되는 경우)
 */
export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, { bg: string; text: string }> = {
  SCHEDULED: { bg: '#3B82F6', text: '#FFFFFF' },  // blue-500 (예정)
  CONFIRMED: { bg: '#3B82F6', text: '#FFFFFF' },  // blue-500 (확정)
  DONE: { bg: '#10B981', text: '#FFFFFF' },       // green-500 (완료)
  CANCELED: { bg: '#EF4444', text: '#FFFFFF' },   // red-500 (취소)
  RESCHEDULED: { bg: '#F59E0B', text: '#FFFFFF' }, // amber-500 (변경됨)
};

/**
 * Schedule → CalendarEvent 변환
 *
 * @param schedule 백엔드에서 받은 일정 데이터
 * @returns 달력에 표시할 이벤트 객체
 */
export function scheduleToCalendarEvent(schedule: Schedule): CalendarEvent {
  // 취소되거나 완료된 일정은 상태 기반 색상 사용
  const useStatusColor = schedule.status === 'CANCELED' || schedule.status === 'DONE';
  const colors = useStatusColor
    ? SCHEDULE_STATUS_COLORS[schedule.status]
    : SCHEDULE_TYPE_COLORS[schedule.type];

  return {
    id: schedule.scheduleId,
    title: schedule.title || schedule.groupName || '수업',
    start: new Date(schedule.startAt),
    end: new Date(schedule.endAt),
    type: schedule.type,
    status: schedule.status,
    color: colors.bg,
    textColor: colors.text,
    metadata: schedule,
  };
}

/**
 * Schedule 배열 → CalendarEvent 배열 변환
 *
 * @param schedules 일정 배열
 * @returns 달력 이벤트 배열
 */
export function schedulesToCalendarEvents(schedules: Schedule[]): CalendarEvent[] {
  return schedules.map(scheduleToCalendarEvent);
}

/**
 * 특정 월의 시작일과 종료일 계산
 *
 * @param date 기준 날짜
 * @returns { start: Date, end: Date }
 */
export function getMonthDateRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

/**
 * 특정 주의 시작일과 종료일 계산 (일요일 시작)
 *
 * @param date 기준 날짜
 * @returns { start: Date, end: Date }
 */
export function getWeekDateRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 *
 * @param date Date 객체
 * @returns YYYY-MM-DD 문자열
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * react-big-calendar 이벤트 스타일 getter
 * 일정 타입/상태에 따른 스타일을 반환
 *
 * @param event CalendarEvent
 * @returns CSSProperties 객체
 */
export function getEventStyle(event: CalendarEvent): React.CSSProperties {
  return {
    backgroundColor: event.color,
    color: event.textColor,
    borderRadius: '4px',
    border: 'none',
    opacity: event.status === 'CANCELED' ? 0.6 : 1,
    fontSize: '0.875rem',
    padding: '2px 4px',
  };
}
