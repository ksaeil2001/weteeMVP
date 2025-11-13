/**
 * Schedule Page - WeTee MVP
 * Screen: S-031 (수업 일정 화면)
 * Route: /schedule
 *
 * Based on:
 * - F-003_수업_일정_관리.md
 * - UX_UI_설계서.md (달력 메인 화면)
 *
 * 역할:
 * - 수업 일정 조회 (달력/리스트 뷰)
 * - 선생님: 정규 수업, 보강 수업 등록/수정/삭제
 * - 학생/학부모: 일정 조회 (읽기 전용)
 *
 * Step 6: 스켈레톤 페이지 (mock 데이터, UI 구조만)
 *
 * TODO (향후):
 * - 실제 달력 컴포넌트 연동 (react-calendar 또는 커스텀)
 * - 일정 등록/수정 모달
 * - 일정 API 연동 (GET/POST/PUT/DELETE /api/schedules)
 * - 월간/주간/일간 뷰 전환
 * - 일정 필터 (그룹별, 과목별)
 * - 보강 수업 특별 표시
 */

import React from 'react';
import PageHeader from '@/components/common/PageHeader';

// Mock 데이터 (Step 6)
const mockTodaySchedule = [
  {
    id: 'schedule-1',
    time: '15:00 - 17:00',
    subject: '수학',
    group: '고3 수학반',
    student: '김수학',
    type: '정규',
  },
  {
    id: 'schedule-2',
    time: '19:00 - 21:00',
    subject: '영어',
    group: '고2 영어반',
    student: '이영어',
    type: '정규',
  },
];

const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <PageHeader
        title="수업 일정"
        subtitle="오늘과 이번 주의 수업 일정을 확인하고 보강 일정을 조정합니다."
        actions={
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            + 일정 추가
          </button>
        }
      />

      {/* 오늘의 일정 요약 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          오늘의 일정 ({mockTodaySchedule.length}개)
        </h2>
        <div className="space-y-3">
          {mockTodaySchedule.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {item.time}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {item.subject}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.student} · {item.group}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  상세 보기 →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 주간 일정 (목업) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          이번 주 일정 (목업)
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className="border border-gray-200 rounded-lg p-3 min-h-[120px]"
            >
              <div className="text-sm font-semibold text-gray-700 mb-2 text-center">
                {day}
              </div>
              <div className="space-y-1">
                {/* 목업 일정 표시 (월, 수, 금만) */}
                {index % 2 === 0 && (
                  <div className="text-xs bg-blue-50 text-blue-700 p-1 rounded">
                    15:00 수학
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 개발 안내 (Step 6) */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-1">
          ℹ️ Step 6 완료: 수업 일정 페이지 스켈레톤
        </p>
        <p className="text-blue-800">
          현재 mock 데이터로 표시 중입니다. 실제 달력 컴포넌트 및 일정 API 연동 시 동적으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
