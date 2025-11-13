/**
 * Main Dashboard Page - WeTee MVP
 * Screen: S-012 (달력 메인 화면 - 홈)
 *
 * Based on: UX_UI_설계서.md Section 4.2 (달력 메인 화면)
 *
 * 변경 이력:
 * - Step 2: 레이아웃 테스트용 임시 페이지
 * - Step 5: 실제 대시보드 스켈레톤 구현 (mock 데이터 기반)
 *
 * TODO (향후):
 * - 실제 달력 컴포넌트 추가 (react-calendar 또는 커스텀)
 * - 오늘의 수업 API 연동 (GET /api/schedules/today)
 * - 최근 수업 기록 API 연동 (GET /api/lessons/recent)
 * - 정산 요약 API 연동 (GET /api/payments/summary)
 * - 클릭 이벤트 핸들러 (각 카드 클릭 시 상세 페이지 이동)
 */

'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock 데이터
const mockTodayLessons = [
  {
    id: 1,
    time: '15:00 - 17:00',
    subject: '수학',
    student: '김수학',
    status: '예정',
    group: '고3 수학반',
  },
  {
    id: 2,
    time: '19:00 - 21:00',
    subject: '영어',
    student: '이영어',
    status: '예정',
    group: '고2 영어반',
  },
];

const mockRecentLessons = [
  {
    id: 1,
    date: '2025-11-12',
    subject: '수학',
    student: '김수학',
    content: '이차방정식의 판별식 학습',
  },
  {
    id: 2,
    date: '2025-11-11',
    subject: '영어',
    student: '이영어',
    content: '관계대명사 복습 및 예문 작성',
  },
  {
    id: 3,
    date: '2025-11-10',
    subject: '수학',
    student: '박수학',
    content: '이차함수 그래프 그리기',
  },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          안녕하세요, {currentUser?.name}님! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          오늘도 좋은 하루 되세요
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 오늘의 수업 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              📅 오늘의 수업
            </h3>
            <span className="text-2xl font-bold text-blue-600">
              {mockTodayLessons.length}
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            {mockTodayLessons.length}개의 수업이 예정되어 있습니다
          </p>
        </div>

        {/* 활성 그룹 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              👥 활성 그룹
            </h3>
            <span className="text-2xl font-bold text-green-600">3</span>
          </div>
          <p className="text-gray-600 text-sm">
            3개의 그룹을 관리하고 있습니다
          </p>
        </div>

        {/* 이번 달 정산 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              💰 이번 달 수업
            </h3>
            <span className="text-2xl font-bold text-purple-600">12</span>
          </div>
          <p className="text-gray-600 text-sm">
            12건의 수업이 완료되었습니다
          </p>
        </div>
      </div>

      {/* 오늘의 수업 상세 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          오늘의 수업 일정
        </h2>
        <div className="space-y-3">
          {mockTodayLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {lesson.time}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {lesson.subject}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {lesson.student} · {lesson.group}
                  </div>
                </div>
                <div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {lesson.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 수업 기록 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          최근 수업 기록
        </h2>
        <div className="space-y-3">
          {mockRecentLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      {lesson.date}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      {lesson.subject}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {lesson.student}
                  </p>
                  <p className="text-sm text-gray-600">{lesson.content}</p>
                </div>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  상세 보기 →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="font-semibold text-blue-900">수업 기록 작성</h3>
              <p className="text-sm text-blue-700">
                오늘 진행한 수업 내용을 기록하세요
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <h3 className="font-semibold text-purple-900">청구서 생성</h3>
              <p className="text-sm text-purple-700">
                이번 달 수업료 청구서를 발송하세요
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* TODO 안내 (개발자용, 나중에 제거) */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
        <p className="font-semibold text-yellow-900 mb-1">
          ℹ️ Step 5 완료: 대시보드 스켈레톤
        </p>
        <p className="text-yellow-800">
          현재 mock 데이터로 표시 중입니다. 실제 API 연동 시 데이터가 동적으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
