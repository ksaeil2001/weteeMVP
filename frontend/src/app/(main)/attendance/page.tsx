/**
 * Attendance Page - WeTee MVP
 * Screen: S-051 (출결 관리 화면)
 * Route: /attendance
 *
 * Step 7: 출결 관리 기본 스켈레톤 페이지 (mock 데이터, UI 구조만)
 *
 * TODO (향후):
 * - 실제 출결 API 연동 (GET /api/attendance/summary, /logs 등)
 * - 달력 컴포넌트 연동 (월간/주간 뷰)
 * - 출결 상태 수정/토글 기능
 * - 학생/그룹/과목별 필터
 * - 'use client'로 전환 (useAuth, 클라이언트 상호작용 추가 시)
 */

import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import AttendanceSummaryCard from '@/components/attendance/AttendanceSummaryCard';
import AttendanceStatusBadge from '@/components/attendance/AttendanceStatusBadge';
import type {
  AttendanceSummaryCounts,
  AttendanceChangeLogItem,
} from '@/types/attendance';

export default function AttendancePage() {
  // Mock 데이터: 오늘 출결 요약
  const mockTodaySummary: AttendanceSummaryCounts = {
    totalStudents: 7,
    present: 5,
    late: 1,
    absent: 1,
    makeup: 0,
    excused: 0,
  };

  // Mock 데이터: 최근 출결 변경 내역
  const mockAttendanceChanges: AttendanceChangeLogItem[] = [
    {
      id: 'log-1',
      date: '2025-11-12',
      studentName: '김수학',
      groupName: '고3 수학반',
      previousStatus: 'absent',
      currentStatus: 'present',
      reason: '결석 처리 오기 정정',
    },
    {
      id: 'log-2',
      date: '2025-11-11',
      studentName: '이영어',
      groupName: '고2 영어반',
      previousStatus: 'present',
      currentStatus: 'late',
      reason: '지각 처리 (10분 지각)',
    },
    {
      id: 'log-3',
      date: '2025-11-10',
      studentName: '박과학',
      groupName: '중3 과학반',
      previousStatus: 'late',
      currentStatus: 'absent',
      reason: '지각에서 결석으로 변경',
    },
  ];

  // Mock 데이터: 달력 날짜 (간단한 더미)
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
  const mockCalendarDates = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* 1) 페이지 헤더 */}
      <PageHeader
        title="출결 관리"
        subtitle="학생들의 출석 상태를 달력과 리스트로 한눈에 확인합니다."
        actions={
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            출석 수기 입력
          </button>
        }
      />

      {/* 2) 섹션 1: 오늘 출결 요약 */}
      <div>
        <AttendanceSummaryCard
          title="오늘 출결 요약"
          summary={mockTodaySummary}
        />
      </div>

      {/* 3) 섹션 2: 이번 달 출결 달력 (목업) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          이번 달 출결 달력 (목업)
        </h2>

        {/* 요일 헤더 + 날짜 셀 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {/* 요일 헤더 */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}

          {/* 날짜 셀 */}
          {mockCalendarDates.map((date) => {
            // 몇 개 날짜에만 간단한 출석 정보 표시 (더미)
            const hasAttendance = date % 7 === 0 || date % 11 === 0;
            const attendanceCount = hasAttendance
              ? `${Math.floor(Math.random() * 5 + 3)}/7`
              : null;

            return (
              <div
                key={date}
                className="border border-gray-200 rounded p-2 min-h-[60px] hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="text-sm font-medium text-gray-700">{date}</div>
                {attendanceCount && (
                  <div className="text-xs text-green-600 mt-1">
                    출석 {attendanceCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* TODO: 실제 달력 컴포넌트 및 출결 데이터 연동 예정 */}
        <div className="mt-4 text-sm text-gray-500 italic">
          * 향후 실제 달력 라이브러리 및 출결 데이터를 연동할 예정입니다.
        </div>
      </div>

      {/* 4) 섹션 3: 최근 출결 변경 내역 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* 섹션 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            최근 출결 변경 내역
          </h2>
        </div>

        {/* 변경 내역 리스트 */}
        <div className="divide-y divide-gray-200">
          {mockAttendanceChanges.map((log) => (
            <div
              key={log.id}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between">
                {/* 좌측: 변경 내역 정보 */}
                <div className="flex-1">
                  {/* 날짜 */}
                  <div className="text-sm text-gray-500 mb-1">{log.date}</div>

                  {/* 학생 이름 · 그룹 이름 */}
                  <div className="text-base font-semibold text-gray-900 mb-2">
                    {log.studentName} · {log.groupName}
                  </div>

                  {/* 상태 변경: 이전 → 현재 */}
                  <div className="flex items-center gap-2 mb-2">
                    <AttendanceStatusBadge status={log.previousStatus} />
                    <span className="text-gray-400">→</span>
                    <AttendanceStatusBadge status={log.currentStatus} />
                  </div>

                  {/* 변경 사유 */}
                  {log.reason && (
                    <div className="text-sm text-gray-600">{log.reason}</div>
                  )}
                </div>

                {/* 우측: 상세 보기 버튼 */}
                <div className="ml-4">
                  <button
                    type="button"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    상세 보기 →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5) 개발 안내 섹션 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-1">
          ℹ️ Step 7 완료: 출결 관리 페이지 스켈레톤
        </p>
        <p className="text-blue-800">
          현재 mock 데이터로 표시 중입니다. 실제 출결 API 및 달력 연동 시
          데이터가 동적으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
