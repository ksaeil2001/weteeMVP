/**
 * Schedule Page - WeTee MVP
 * Screen: S-012 (달력 메인 화면)
 * Route: /schedule
 *
 * Based on:
 * - F-003_수업_일정_관리.md
 * - UX_UI_설계서.md (S-012: 달력 메인 화면)
 *
 * 역할:
 * - 수업 일정 조회 (달력/리스트 뷰)
 * - 선생님: 정규 수업, 보강 수업 등록/수정/삭제
 * - 학생/학부모: 일정 조회 (읽기 전용)
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PageHeader from '@/components/common/PageHeader';
import { fetchSchedules } from '@/lib/api/schedules';
import { getMonthDateRange, formatDateToISO } from '@/lib/calendarUtils';
import type { Schedule, CalendarViewType } from '@/types/schedule';
import { ScheduleCardSkeleton } from '@/components/ui/Skeleton';

// CalendarView를 동적 임포트 (SSR 비활성화 - react-big-calendar는 클라이언트 전용)
const CalendarView = dynamic(
  () => import('@/components/calendar/CalendarView'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div
          className="flex items-center justify-center bg-gray-50 rounded-lg"
          style={{ height: '600px' }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">달력을 불러오는 중...</p>
          </div>
        </div>
      </div>
    ),
  }
);

/**
 * 날짜 포맷 헬퍼
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

/**
 * 일정 타입별 배지 색상
 */
function getScheduleTypeColor(type: string): string {
  switch (type) {
    case 'REGULAR':
      return 'bg-blue-100 text-blue-700';
    case 'MAKEUP':
      return 'bg-amber-100 text-amber-700';
    case 'EXAM':
      return 'bg-purple-100 text-purple-700';
    case 'HOLIDAY':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-green-100 text-green-700';
  }
}

function getScheduleTypeLabel(type: string): string {
  switch (type) {
    case 'REGULAR':
      return '정규';
    case 'MAKEUP':
      return '보강';
    case 'EXAM':
      return '시험';
    case 'HOLIDAY':
      return '휴강';
    default:
      return '기타';
  }
}

/**
 * 뷰 모드 저장/복원 (localStorage)
 */
function getSavedViewMode(): CalendarViewType {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('scheduleViewMode');
    if (saved && ['calendar', 'list', 'month', 'week'].includes(saved)) {
      // 'calendar'는 'month'로 매핑
      return saved === 'calendar' ? 'month' : (saved as CalendarViewType);
    }
  }
  return 'month'; // 기본값: 달력 뷰 (월간)
}

function saveViewMode(viewMode: CalendarViewType): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('scheduleViewMode', viewMode);
  }
}

export default function SchedulePage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // 클라이언트에서만 저장된 뷰 모드 복원
  useEffect(() => {
    const saved = getSavedViewMode();
    setViewType(saved);
  }, []);

  // 날짜 범위 계산 (월간 기준)
  const dateRange = useMemo(() => {
    return getMonthDateRange(currentDate);
  }, [currentDate]);

  // 일정 데이터 로드
  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  async function loadSchedules() {
    try {
      setLoading(true);
      setError(null);

      const from = formatDateToISO(dateRange.start);
      const to = formatDateToISO(dateRange.end);

      const data = await fetchSchedules({ from, to });
      setSchedules(data);
    } catch (error) {
      console.error('일정 로드 실패:', error);
      setError(
        error instanceof Error
          ? error.message
          : '일정을 불러오는 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  }

  // 뷰 타입 변경 핸들러
  const handleViewTypeChange = useCallback((newViewType: CalendarViewType) => {
    setViewType(newViewType);
    saveViewMode(newViewType);
  }, []);

  // 달력 네비게이션 핸들러
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // 이벤트 선택 핸들러
  const handleSelectEvent = useCallback(
    (scheduleId: string) => {
      router.push(`/schedule/${scheduleId}`);
    },
    [router]
  );

  // 날짜 슬롯 선택 핸들러 (새 일정 추가)
  const handleSelectSlot = useCallback(
    (date: Date) => {
      const dateParam = formatDateToISO(date);
      router.push(`/schedule/new?date=${dateParam}`);
    },
    [router]
  );

  // 달력 뷰인지 확인
  const isCalendarView = viewType === 'month' || viewType === 'week';

  // 오늘 일정 필터링 (리스트 뷰용)
  const todaySchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.startAt).toDateString();
      const today = new Date().toDateString();
      return scheduleDate === today && schedule.status === 'SCHEDULED';
    });
  }, [schedules]);

  // 이번 주 일정 필터링 (리스트 뷰용)
  const thisWeekSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.startAt);
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return scheduleDate >= weekStart && scheduleDate <= weekEnd;
    });
  }, [schedules]);

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <PageHeader
        title="수업 일정"
        subtitle="수업 일정을 달력 또는 리스트로 확인하고 관리합니다."
        actions={
          <button
            type="button"
            onClick={() => router.push('/schedule/new')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            aria-label="새 수업 일정 추가"
          >
            + 일정 추가
          </button>
        }
      />

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="font-semibold text-red-900 mb-1">
            일정 로드 실패
          </p>
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={loadSchedules}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 뷰 전환 토글 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleViewTypeChange('month')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              isCalendarView
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="달력 보기로 전환"
            aria-pressed={isCalendarView}
          >
            달력 뷰
          </button>
          <button
            onClick={() => handleViewTypeChange('list')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              viewType === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="리스트 보기로 전환"
            aria-pressed={viewType === 'list'}
          >
            리스트 뷰
          </button>
        </div>
      </div>

      {/* 달력 뷰 */}
      {isCalendarView && (
        <CalendarView
          schedules={schedules}
          viewType={viewType}
          onViewChange={handleViewTypeChange}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          currentDate={currentDate}
          isLoading={loading}
        />
      )}

      {/* 리스트 뷰 */}
      {viewType === 'list' && (
        <>
          {/* 오늘의 일정 요약 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              오늘의 일정 ({loading ? '...' : todaySchedules.length}개)
            </h2>
            {loading ? (
              <div className="space-y-3" role="status" aria-label="일정 로딩 중">
                <ScheduleCardSkeleton />
                <ScheduleCardSkeleton />
              </div>
            ) : todaySchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                오늘 예정된 수업이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedules.map((schedule) => (
                  <div
                    key={schedule.scheduleId}
                    onClick={() => router.push(`/schedule/${schedule.scheduleId}`)}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatTime(schedule.startAt)} -{' '}
                            {formatTime(schedule.endAt)}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {schedule.groupName || schedule.title}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getScheduleTypeColor(
                              schedule.type
                            )}`}
                          >
                            {getScheduleTypeLabel(schedule.type)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {schedule.studentNames?.join(', ')} ·{' '}
                          {schedule.location || '장소 미정'}
                        </p>
                        {schedule.memo && (
                          <p className="text-xs text-gray-500 mt-1">
                            {schedule.memo}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        aria-label={`${schedule.title} 일정 상세 보기`}
                      >
                        상세 보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 이번 주 일정 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              이번 주 일정 ({loading ? '...' : thisWeekSchedules.length}개)
            </h2>
            {loading ? (
              <div className="space-y-2" role="status" aria-label="주간 일정 로딩 중">
                <ScheduleCardSkeleton />
                <ScheduleCardSkeleton />
                <ScheduleCardSkeleton />
              </div>
            ) : thisWeekSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                이번 주에 예정된 수업이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {thisWeekSchedules.map((schedule) => (
                  <div
                    key={schedule.scheduleId}
                    onClick={() => router.push(`/schedule/${schedule.scheduleId}`)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">
                          {formatDate(schedule.startAt)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatTime(schedule.startAt)} -{' '}
                          {formatTime(schedule.endAt)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {schedule.title}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${getScheduleTypeColor(
                            schedule.type
                          )}`}
                        >
                          {getScheduleTypeLabel(schedule.type)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {schedule.studentNames?.join(', ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
