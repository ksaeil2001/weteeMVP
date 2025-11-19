/**
 * Group Attendance Dashboard Page - WeTee MVP
 * Screen: S-020 (그룹별 출결 대시보드)
 * Route: /groups/[groupId]/attendance
 *
 * Based on:
 * - F-004_출결_관리.md
 * - UX_UI_설계서.md (S-020)
 * - API_명세서.md (6.4 F-004)
 *
 * 역할:
 * - 그룹의 출결 요약 목록 표시 (날짜별/수업별)
 * - 선생님: 출결 체크 버튼 표시
 * - 학생/학부모: 조회만 가능
 * - 날짜/기간 필터
 * - 출석률 요약 표시
 *
 * TODO (향후 디버깅/연결 단계):
 * - 실제 그룹 출결 요약 API 연동
 * - 날짜 필터 기능 구현
 * - 출석률 차트 표시
 * - 페이지네이션
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchGroupById } from '@/lib/api/groups';
import { fetchGroupAttendanceSummaries } from '@/lib/api/attendance';
import type { Group } from '@/types/group';
import type { LessonAttendanceSummary } from '@/types/attendance';
import { ATTENDANCE_STATUS_COLORS } from '@/types/attendance';

export default function GroupAttendanceDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;

  const { currentRole } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [summaries, setSummaries] = useState<LessonAttendanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 기간 필터 (현재 월 기준)
  const [period, setPeriod] = useState({
    startDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // 그룹 정보 및 출결 요약 로드
  useEffect(() => {
    const loadData = async () => {
      if (!groupId) return;

      try {
        setIsLoading(true);
        setError(null);

        // 그룹 정보 로드
        const groupData = await fetchGroupById(groupId);
        setGroup(groupData);

        // 출결 요약 로드
        const summariesData = await fetchGroupAttendanceSummaries(
          groupId,
          period
        );
        setSummaries(summariesData);
      } catch (err) {
        console.error('Failed to load attendance data:', err);
        setError('출결 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [groupId, period]);

  // 전체 통계 계산
  const overallStats = React.useMemo(() => {
    const totalLessons = summaries.length;
    const totalPresent = summaries.reduce((sum, s) => sum + s.presentCount, 0);
    const totalLate = summaries.reduce((sum, s) => sum + s.lateCount, 0);
    const totalAbsent = summaries.reduce((sum, s) => sum + s.absentCount, 0);
    const totalStudents =
      summaries.length > 0 ? summaries[0].totalStudents : 0;
    const totalPossible = totalLessons * totalStudents;
    const attendanceRate =
      totalPossible > 0
        ? Math.round(((totalPresent + totalLate) / totalPossible) * 100)
        : 0;

    return {
      totalLessons,
      totalPresent,
      totalLate,
      totalAbsent,
      attendanceRate,
    };
  }, [summaries]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">오류 발생</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-3 text-sm underline"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 선생님 여부
  const isTeacher = currentRole === 'teacher';

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 text-sm mb-2"
          >
            ← 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">출결 관리</h1>
          {group && (
            <p className="text-gray-600 mt-1">
              {group.name} · {group.subject}
            </p>
          )}
        </div>

        {/* Overall Stats Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            이번 달 출석률 요약
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">전체 수업</p>
              <p className="text-2xl font-bold text-gray-900">
                {overallStats.totalLessons}회
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">출석률</p>
              <p className="text-2xl font-bold text-green-600">
                {overallStats.attendanceRate}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">출석</p>
              <p className="text-xl font-semibold text-green-700">
                {overallStats.totalPresent}회
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">지각/결석</p>
              <p className="text-xl font-semibold text-gray-700">
                {overallStats.totalLate + overallStats.totalAbsent}회
              </p>
            </div>
          </div>
        </div>

        {/* Period Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            조회 기간
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={period.startDate}
              onChange={(e) =>
                setPeriod((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <span className="self-center text-gray-500">~</span>
            <input
              type="date"
              value={period.endDate}
              onChange={(e) =>
                setPeriod((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* Lesson Summaries List */}
        <div className="space-y-3">
          {summaries.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">이 기간에는 출결 기록이 없습니다.</p>
            </div>
          ) : (
            summaries.map((summary) => (
              <div
                key={summary.scheduleId}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (isTeacher) {
                    router.push(
                      `/groups/${groupId}/attendance/${summary.scheduleId}`
                    );
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {summary.date}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {summary.startTime} - {summary.endTime}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${ATTENDANCE_STATUS_COLORS.PRESENT.bg} ${ATTENDANCE_STATUS_COLORS.PRESENT.text}`}
                      >
                        출석 {summary.presentCount}
                      </span>
                      {summary.lateCount > 0 && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${ATTENDANCE_STATUS_COLORS.LATE.bg} ${ATTENDANCE_STATUS_COLORS.LATE.text}`}
                        >
                          지각 {summary.lateCount}
                        </span>
                      )}
                      {summary.absentCount > 0 && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${ATTENDANCE_STATUS_COLORS.ABSENT.bg} ${ATTENDANCE_STATUS_COLORS.ABSENT.text}`}
                        >
                          결석 {summary.absentCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {summary.attendanceRate}%
                    </p>
                    <p className="text-xs text-gray-500">출석률</p>
                  </div>
                </div>

                {isTeacher && (
                  <div className="mt-3 pt-3 border-t">
                    <button className="text-sm text-blue-600 hover:underline">
                      출결 상세 보기 →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick Actions (선생님만) */}
        {isTeacher && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 Tip: 수업 카드를 클릭하면 출결을 체크하거나 수정할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
