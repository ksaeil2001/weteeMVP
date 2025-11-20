/**
 * Main Dashboard Page - WeTee MVP
 * Screen: S-012 (달력 메인 화면 - 홈)
 *
 * Based on: UX_UI_설계서.md Section 4.2 (달력 메인 화면)
 *
 * 변경 이력:
 * - Step 2: 레이아웃 테스트용 임시 페이지
 * - Step 5: 실제 대시보드 스켈레톤 구현 (mock 데이터 기반)
 * - Redesign: 현대적 디자인, 컴팩트 레이아웃, 시각적 위계 개선
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
    date: '11/12',
    subject: '수학',
    student: '김수학',
    content: '이차방정식의 판별식 학습',
  },
  {
    id: 2,
    date: '11/11',
    subject: '영어',
    student: '이영어',
    content: '관계대명사 복습 및 예문 작성',
  },
  {
    id: 3,
    date: '11/10',
    subject: '수학',
    student: '박수학',
    content: '이차함수 그래프 그리기',
  },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {currentUser?.name}님, 안녕하세요
          </h1>
          <p className="text-sm text-gray-500">오늘도 좋은 하루 되세요</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">오늘</p>
          <p className="text-sm font-medium text-gray-700">
            {new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-3 gap-3">
        {/* 오늘의 수업 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600/80 uppercase tracking-wide">오늘 수업</p>
              <p className="text-2xl font-bold text-blue-700 mt-0.5">{mockTodayLessons.length}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 활성 그룹 */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 rounded-lg border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-600/80 uppercase tracking-wide">활성 그룹</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">3</p>
            </div>
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 이번 달 완료 */}
        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 p-3 rounded-lg border border-violet-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-violet-600/80 uppercase tracking-wide">월 완료</p>
              <p className="text-2xl font-bold text-violet-700 mt-0.5">12</p>
            </div>
            <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* 오늘의 수업 - 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">오늘의 수업</h2>
              <span className="text-xs text-gray-500">{mockTodayLessons.length}건</span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {mockTodayLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-1 h-10 bg-blue-400 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{lesson.time}</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                        {lesson.subject}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {lesson.student} · {lesson.group}
                    </p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded">
                    {lesson.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - 2 cols */}
        <div className="lg:col-span-2 space-y-3">
          <button
            type="button"
            className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">수업 기록 작성</h3>
                <p className="text-xs text-gray-500">오늘 수업 내용 기록</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50/30 transition-all text-left group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">청구서 생성</h3>
                <p className="text-xs text-gray-500">이번 달 수업료 청구</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-left group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">새 일정 추가</h3>
                <p className="text-xs text-gray-500">수업 일정 등록</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 최근 수업 기록 - Compact Table Style */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">최근 수업 기록</h2>
            <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              전체 보기
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {mockRecentLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="px-4 py-2.5 hover:bg-gray-50/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-10 flex-shrink-0">{lesson.date}</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded flex-shrink-0">
                  {lesson.subject}
                </span>
                <span className="text-xs font-medium text-gray-700 flex-shrink-0">{lesson.student}</span>
                <span className="text-xs text-gray-500 truncate flex-1">{lesson.content}</span>
                <svg className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
