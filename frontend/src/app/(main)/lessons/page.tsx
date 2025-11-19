/**
 * Lessons Page - WeTee MVP
 * Screen: S-022, S-023 (수업 기록 관리 화면)
 * Route: /lessons
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * 역할:
 * - 선생님의 수업 기록 목록 조회
 * - 수업별 내용, 진도, 숙제 기록 확인
 * - 새로운 수업 기록 작성
 *
 * 권한: TEACHER 전용 (조회는 학생/학부모도 가능)
 *
 * 실제 API 연동:
 * - GET /api/v1/schedules (일정 목록)
 * - GET /api/v1/lesson-records/{lesson_record_id} (수업 기록 조회)
 * - POST /api/v1/lesson-records/schedules/{schedule_id} (수업 기록 작성)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchSchedules } from '@/lib/api/schedules';
import type { Schedule } from '@/types/schedule';
import type { LessonRecord } from '@/types/lesson';

/**
 * UI용 스케줄+수업기록 복합 타입
 */
interface ScheduleWithLessonRecord extends Schedule {
  lessonRecord?: LessonRecord;
  hasLessonRecord: boolean; // 수업 기록이 있는지 여부
}

export default function LessonsPage() {
  const router = useRouter();
  const { isAuthenticated, currentRole } = useAuth();

  // 월 선택 상태
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 데이터 상태
  const [schedules, setSchedules] = useState<ScheduleWithLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 월 선택 옵션 생성 (현재 월 기준 ±6개월)
  function getMonthOptions() {
    const options: string[] = [];
    const now = new Date();
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.push(month);
    }
    return options;
  }

  // 일정 및 수업 기록 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadLessonData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, isAuthenticated]);

  async function loadLessonData() {
    try {
      setLoading(true);
      setError(null);

      // 선택된 월의 시작일과 종료일 계산
      const [year, month] = selectedMonth.split('-').map(Number);
      const fromDate = new Date(year, month - 1, 1);
      const toDate = new Date(year, month, 0); // 해당 월의 마지막 날

      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = toDate.toISOString().split('T')[0];

      // 1. 일정 목록 조회 (선택된 월 범위)
      const fetchedSchedules = await fetchSchedules({
        from: fromStr,
        to: toStr,
        status: 'CONFIRMED', // 확정된 일정만
      });

      // 2. 각 일정에 대해 수업 기록 조회 시도
      // TODO(v2): 백엔드에 일정 목록 조회 시 lesson_record_id를 포함하도록 개선하여 N+1 문제 해결
      const schedulesWithLessonRecords: ScheduleWithLessonRecord[] = await Promise.all(
        fetchedSchedules.map(async (schedule) => {
          // 참고: 현재 백엔드 API에는 schedule_id로 lesson_record를 직접 조회하는 엔드포인트가 없음
          // 대신 각 schedule에 연결된 lesson_record_id가 있다면 조회 가능
          // 임시로 수업 기록 없음으로 처리
          return {
            ...schedule,
            lessonRecord: undefined,
            hasLessonRecord: false,
          };
        })
      );

      // 날짜순 정렬 (최신순)
      schedulesWithLessonRecords.sort((a, b) =>
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
      );

      setSchedules(schedulesWithLessonRecords);
    } catch (err) {
      console.error('수업 기록 데이터 로딩 실패:', err);
      setError('수업 기록 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 수업 기록 작성 페이지로 이동
  function handleCreateLessonRecord(scheduleId: string) {
    router.push(`/lessons/create/${scheduleId}`);
  }

  // 수업 기록 상세 페이지로 이동
  function handleViewLessonRecord(lessonRecordId: string) {
    router.push(`/lessons/${lessonRecordId}`);
  }

  // 권한 체크
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // 과거 수업인지 확인
  function isPastLesson(startAt: string): boolean {
    return new Date(startAt) < new Date();
  }

  return (
    <div className="space-y-6">
      {/* 1) 페이지 헤더 */}
      <PageHeader
        title="수업 기록 관리"
        subtitle="수업 내용, 진도, 숙제를 기록하고 관리합니다."
        actions={
          currentRole === 'teacher' ? (
            <button
              type="button"
              onClick={() => router.push('/lessons/textbooks')}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
            >
              📚 교재 관리
            </button>
          ) : null
        }
      />

      {/* 2) 월 선택 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <label
          htmlFor="month-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          조회 월 선택
        </label>
        <select
          id="month-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {getMonthOptions().map((month) => (
            <option key={month} value={month}>
              {month.replace('-', '년 ')}월
            </option>
          ))}
        </select>
      </div>

      {/* 3) 로딩 상태 */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600">수업 기록을 불러오는 중...</p>
        </div>
      )}

      {/* 4) 에러 상태 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadLessonData}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 5) 수업별 기록 리스트 */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              수업 기록 목록 ({schedules.length}개)
            </h2>
          </div>

          {schedules.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-2">
                {selectedMonth.replace('-', '년 ')}월에 예정된 수업이 없습니다.
              </p>
              <p className="text-sm text-gray-500">
                수업 일정을 먼저 등록해주세요.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {schedules.map((schedule) => {
                const past = isPastLesson(schedule.startAt);

                return (
                  <div
                    key={schedule.scheduleId}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 날짜 & 시간 */}
                        <div className="text-sm text-gray-500 mb-1">
                          {new Date(schedule.startAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          })}{' '}
                          {new Date(schedule.startAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {new Date(schedule.endAt).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>

                        {/* 수업 제목 & 그룹명 */}
                        <div className="text-base font-semibold text-gray-900 mb-2">
                          {schedule.title}
                          {schedule.groupName && (
                            <span className="ml-2 text-sm font-normal text-gray-600">
                              · {schedule.groupName}
                            </span>
                          )}
                        </div>

                        {/* 수업 기록 현황 */}
                        {schedule.hasLessonRecord && schedule.lessonRecord ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                ✓ 기록 완료
                              </span>
                              {schedule.lessonRecord.isShared && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  학부모 공유됨
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {schedule.lessonRecord.content}
                            </p>
                            {schedule.lessonRecord.homework && (
                              <p className="text-sm text-orange-600">
                                📝 숙제: {schedule.lessonRecord.homework.substring(0, 50)}
                                {schedule.lessonRecord.homework.length > 50 ? '...' : ''}
                              </p>
                            )}
                            {schedule.lessonRecord.progressRecords &&
                              schedule.lessonRecord.progressRecords.length > 0 && (
                                <p className="text-sm text-gray-600">
                                  📖 진도:{' '}
                                  {schedule.lessonRecord.progressRecords
                                    .map(
                                      (pr) =>
                                        `${pr.textbook.name} ${pr.pageStart}-${pr.pageEnd}쪽`
                                    )
                                    .join(', ')}
                                </p>
                              )}
                          </div>
                        ) : (
                          <div className="text-sm text-yellow-600">
                            {past
                              ? '⚠️ 수업 기록이 아직 작성되지 않았습니다'
                              : '수업 기록 대기 중'}
                          </div>
                        )}

                        {schedule.location && (
                          <div className="text-sm text-gray-500 mt-1">
                            📍 {schedule.location}
                          </div>
                        )}
                      </div>

                      {/* 우측 액션 버튼 */}
                      <div className="ml-4 flex flex-col gap-2">
                        {schedule.hasLessonRecord && schedule.lessonRecord ? (
                          <>
                            <button
                              onClick={() =>
                                handleViewLessonRecord(schedule.lessonRecord!.lessonRecordId)
                              }
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap"
                            >
                              상세 보기
                            </button>
                            {currentRole === 'teacher' && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/lessons/${schedule.lessonRecord!.lessonRecordId}/edit`
                                  )
                                }
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
                              >
                                수정
                              </button>
                            )}
                          </>
                        ) : (
                          currentRole === 'teacher' && (
                            <button
                              onClick={() => handleCreateLessonRecord(schedule.scheduleId)}
                              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors whitespace-nowrap"
                            >
                              기록 작성
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6) 안내 섹션 */}
      {!loading && !error && schedules.length > 0 && currentRole === 'teacher' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-semibold text-blue-900 mb-1">
            💡 수업 기록 작성 안내
          </p>
          <ul className="text-blue-800 space-y-1 list-disc list-inside">
            <li>각 수업의 &quot;기록 작성&quot; 버튼을 클릭하여 수업 내용, 진도, 숙제를 기록할 수 있습니다.</li>
            <li>작성 후 30일 이내에는 수정 가능하며, 24시간 이내에는 삭제도 가능합니다.</li>
            <li>최대 5개의 교재에 대한 진도를 동시에 기록할 수 있습니다.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
