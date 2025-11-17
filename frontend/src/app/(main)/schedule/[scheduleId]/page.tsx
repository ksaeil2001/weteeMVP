/**
 * Schedule Detail Page - WeTee MVP
 * Screen: S-014 (일정 상세 화면)
 * Route: /schedule/[scheduleId]
 *
 * Based on:
 * - F-003_수업_일정_관리.md
 * - UX_UI_설계서.md (S-014: 일정 상세 화면)
 *
 * 역할:
 * - 수업 일정 상세 정보 표시
 * - 일정 수정/삭제 기능 (선생님만)
 * - 보강 신청 기능 (학생/학부모)
 *
 * TODO (향후):
 * - 실제 API 연동
 * - 권한별 접근 제어
 * - 일정 수정 시 히스토리 표시
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { fetchScheduleById, deleteSchedule } from '@/lib/api/schedules';
import type { Schedule } from '@/types/schedule';

/**
 * 날짜/시간 포맷 헬퍼
 */
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 일정 타입 레이블 및 색상
 */
function getScheduleTypeInfo(type: string): {
  label: string;
  color: string;
} {
  switch (type) {
    case 'REGULAR':
      return { label: '정규 수업', color: 'bg-blue-100 text-blue-700' };
    case 'MAKEUP':
      return { label: '보강 수업', color: 'bg-amber-100 text-amber-700' };
    case 'EXAM':
      return { label: '시험', color: 'bg-purple-100 text-purple-700' };
    case 'HOLIDAY':
      return { label: '휴강', color: 'bg-gray-100 text-gray-700' };
    default:
      return { label: '기타', color: 'bg-green-100 text-green-700' };
  }
}

function getStatusInfo(status: string): { label: string; color: string } {
  switch (status) {
    case 'SCHEDULED':
      return { label: '예정', color: 'bg-blue-100 text-blue-700' };
    case 'DONE':
      return { label: '완료', color: 'bg-green-100 text-green-700' };
    case 'CANCELED':
      return { label: '취소됨', color: 'bg-red-100 text-red-700' };
    case 'RESCHEDULED':
      return { label: '일정 변경됨', color: 'bg-amber-100 text-amber-700' };
    default:
      return { label: '알 수 없음', color: 'bg-gray-100 text-gray-700' };
  }
}

export default function ScheduleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params?.scheduleId as string;

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (scheduleId) {
      loadSchedule();
    }
  }, [scheduleId]);

  async function loadSchedule() {
    try {
      setLoading(true);
      const data = await fetchScheduleById(scheduleId);
      setSchedule(data);
    } catch (error) {
      console.error('일정 로드 실패:', error);
      alert('일정을 찾을 수 없습니다.');
      router.push('/schedule');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        '이 일정을 삭제하시겠습니까?\n삭제된 일정은 복구할 수 없습니다.'
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      await deleteSchedule(scheduleId);
      alert('일정이 삭제되었습니다.');
      router.push('/schedule');
    } catch (error) {
      console.error('일정 삭제 실패:', error);
      alert('일정 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="일정 상세" backLink="/schedule" />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="space-y-6">
        <PageHeader title="일정 상세" backLink="/schedule" />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">일정을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const typeInfo = getScheduleTypeInfo(schedule.type);
  const statusInfo = getStatusInfo(schedule.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="일정 상세"
        backLink="/schedule"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/schedule/${scheduleId}/edit`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {deleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        }
      />

      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {schedule.title}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-sm font-medium rounded-lg ${typeInfo.color}`}
            >
              {typeInfo.label}
            </span>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-lg ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
        </div>

        {/* 그룹 정보 */}
        {schedule.groupName && (
          <div className="flex items-center gap-2 text-gray-600">
            <span className="font-medium">그룹:</span>
            <span>{schedule.groupName}</span>
          </div>
        )}
      </div>

      {/* 일정 상세 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">일정 정보</h2>

        <div className="space-y-3">
          {/* 날짜 및 시간 */}
          <div className="flex items-start gap-3">
            <div className="w-24 text-sm font-medium text-gray-500">
              날짜/시간
            </div>
            <div className="flex-1">
              <p className="text-gray-900 font-medium">
                {formatDateTime(schedule.startAt)}
              </p>
              <p className="text-sm text-gray-600">
                {formatTime(schedule.startAt)} - {formatTime(schedule.endAt)}
              </p>
            </div>
          </div>

          {/* 선생님 */}
          {schedule.teacherName && (
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">
                선생님
              </div>
              <div className="flex-1 text-gray-900">{schedule.teacherName}</div>
            </div>
          )}

          {/* 학생 */}
          {schedule.studentNames && schedule.studentNames.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">학생</div>
              <div className="flex-1 text-gray-900">
                {schedule.studentNames.join(', ')}
              </div>
            </div>
          )}

          {/* 장소 */}
          {schedule.location && (
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">장소</div>
              <div className="flex-1 text-gray-900">{schedule.location}</div>
            </div>
          )}

          {/* 메모 */}
          {schedule.memo && (
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">메모</div>
              <div className="flex-1 text-gray-900 whitespace-pre-wrap">
                {schedule.memo}
              </div>
            </div>
          )}

          {/* 원래 일정 (보강인 경우) */}
          {schedule.originalScheduleId && (
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">
                원래 일정
              </div>
              <div className="flex-1">
                <button
                  onClick={() =>
                    router.push(`/schedule/${schedule.originalScheduleId}`)
                  }
                  className="text-primary-600 hover:text-primary-700 hover:underline"
                >
                  원래 일정 보기 →
                </button>
              </div>
            </div>
          )}

          {/* 취소/변경 사유 */}
          {schedule.cancelReason && (
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">
                취소 사유
              </div>
              <div className="flex-1 text-red-700">{schedule.cancelReason}</div>
            </div>
          )}
          {schedule.rescheduleReason && (
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">
                변경 사유
              </div>
              <div className="flex-1 text-amber-700">
                {schedule.rescheduleReason}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 반복 규칙 (정규 수업인 경우) */}
      {schedule.type === 'REGULAR' && schedule.recurrenceRule && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">반복 규칙</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">빈도</div>
              <div className="flex-1 text-gray-900">
                {schedule.recurrenceRule.frequency === 'weekly' && '매주'}
                {schedule.recurrenceRule.frequency === 'biweekly' && '격주'}
                {schedule.recurrenceRule.frequency === 'daily' && '매일'}
                {schedule.recurrenceRule.frequency === 'monthly' && '매월'}
              </div>
            </div>
            {schedule.recurrenceRule.daysOfWeek &&
              schedule.recurrenceRule.daysOfWeek.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="w-24 text-sm font-medium text-gray-500">
                    요일
                  </div>
                  <div className="flex-1 text-gray-900">
                    {schedule.recurrenceRule.daysOfWeek
                      .map((d) => {
                        const days = ['', '월', '화', '수', '목', '금', '토', '일'];
                        return days[d];
                      })
                      .join(', ')}
                  </div>
                </div>
              )}
            <div className="flex items-start gap-3">
              <div className="w-24 text-sm font-medium text-gray-500">
                시작일
              </div>
              <div className="flex-1 text-gray-900">
                {schedule.recurrenceRule.startDate}
              </div>
            </div>
            {schedule.recurrenceRule.endDate && (
              <div className="flex items-start gap-3">
                <div className="w-24 text-sm font-medium text-gray-500">
                  종료일
                </div>
                <div className="flex-1 text-gray-900">
                  {schedule.recurrenceRule.endDate}
                </div>
              </div>
            )}
            {schedule.recurrenceRule.endCount && (
              <div className="flex items-start gap-3">
                <div className="w-24 text-sm font-medium text-gray-500">
                  총 횟수
                </div>
                <div className="flex-1 text-gray-900">
                  {schedule.recurrenceRule.endCount}회
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 생성/수정 정보 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>생성일: {new Date(schedule.createdAt).toLocaleString('ko-KR')}</span>
          {schedule.updatedAt && (
            <span>
              수정일: {new Date(schedule.updatedAt).toLocaleString('ko-KR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
