/**
 * Student Attendance History Page - WeTee MVP
 * Screen: S-022 (학생별 출결 히스토리)
 * Route: /students/[studentId]/attendance
 *
 * Based on:
 * - F-004_출결_관리.md (시나리오 4, 5)
 * - UX_UI_설계서.md (S-022)
 * - API_명세서.md (6.4.3 출결 조회 및 통계)
 *
 * 역할:
 * - 학생의 출결 히스토리 표시
 * - 출석률 통계 표시
 * - 기간별 필터
 * - 선생님/학생/학부모 모두 조회 가능
 *
 * TODO (향후 디버깅/연결 단계):
 * - 실제 학생 출결 히스토리 API 연동
 * - 출석률 차트 표시
 * - 페이지네이션
 * - PDF 다운로드 기능
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  fetchStudentAttendanceStats,
  fetchStudentAttendanceHistory,
} from '@/lib/api/attendance';
import type {
  StudentAttendanceStats,
  AttendanceHistoryItem,
} from '@/types/attendance';
import {
  ATTENDANCE_STATUS_COLORS,
  ATTENDANCE_STATUS_ICONS,
} from '@/types/attendance';

export default function StudentAttendanceHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.studentId as string;

  const { currentRole, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<StudentAttendanceStats | null>(null);
  const [history, setHistory] = useState<AttendanceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 기간 필터 (최근 30일 기본)
  const [period, setPeriod] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // 출결 통계 및 히스토리 로드
  useEffect(() => {
    const loadData = async () => {
      if (!studentId) return;

      try {
        setIsLoading(true);
        setError(null);

        // 통계 로드
        const statsData = await fetchStudentAttendanceStats({
          groupId: 'group-1', // TODO: 실제 그룹 ID
          studentId,
          startDate: period.startDate,
          endDate: period.endDate,
        });
        setStats(statsData);

        // 히스토리 로드
        const historyData = await fetchStudentAttendanceHistory(studentId, {
          startDate: period.startDate,
          endDate: period.endDate,
        });
        setHistory(historyData);
      } catch (err) {
        console.error('Failed to load attendance data:', err);
        setError('출결 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [studentId, period]);

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
          <h1 className="text-2xl font-bold text-gray-900">출결 기록</h1>
          {stats && (
            <p className="text-gray-600 mt-1">
              {stats.studentName}
              {stats.groupName && ` · ${stats.groupName}`}
            </p>
          )}
        </div>

        {/* Stats Card */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              출석 통계
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">전체 수업</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.stats.totalSessions}회
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">출석률</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.stats.attendanceRate}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">출석</p>
                <p className="text-xl font-semibold text-green-700">
                  {stats.stats.present}회
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">지각/결석</p>
                <p className="text-xl font-semibold text-gray-700">
                  {stats.stats.late + stats.stats.absent}회
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(stats.stats.attendanceRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

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

        {/* History List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">출결 내역</h2>

          {history.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">이 기간에는 출결 기록이 없습니다.</p>
            </div>
          ) : (
            history.map((item) => {
              const colorConfig = ATTENDANCE_STATUS_COLORS[item.status];

              return (
                <div
                  key={item.attendanceId}
                  className="bg-white rounded-lg shadow p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {item.date}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        {item.groupName} · {item.subject}
                      </p>

                      {/* Status Badge */}
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${colorConfig.bg} ${colorConfig.text}`}
                        >
                          <span className="text-lg">
                            {ATTENDANCE_STATUS_ICONS[item.status]}
                          </span>
                          {colorConfig.label}
                        </span>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">메모:</span>{' '}
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Export Button (TODO) */}
        {history.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => alert('PDF 다운로드 기능은 곧 추가됩니다.')}
              className="w-full md:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              📄 출결 기록 PDF 다운로드
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
