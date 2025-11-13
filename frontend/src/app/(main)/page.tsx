/**
 * Main Dashboard Page - WeTee MVP
 * Screen: S-012 (달력 메인 화면 - 홈)
 *
 * 임시 홈 페이지 (레이아웃 적용 테스트용)
 *
 * TODO (Step 5):
 * - 실제 대시보드 콘텐츠 구현
 * - 달력 컴포넌트 추가
 * - 오늘의 수업 카드 목록
 * - 다가오는 일정 요약
 */

import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          대시보드
        </h1>
        <p className="mt-2 text-gray-600">
          오늘의 수업과 일정을 확인하세요
        </p>
      </div>

      {/* Test Content - 레이아웃 확인용 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📅 오늘의 수업
          </h3>
          <p className="text-gray-600 text-sm">
            2개의 수업이 예정되어 있습니다
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            👥 활성 그룹
          </h3>
          <p className="text-gray-600 text-sm">
            3개의 그룹을 관리하고 있습니다
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            💰 이번 달 정산
          </h3>
          <p className="text-gray-600 text-sm">
            12건의 수업이 완료되었습니다
          </p>
        </div>
      </div>

      {/* Layout Test Info */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          ✅ Step 2: 메인 레이아웃 적용 완료
        </h2>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Header: 상단 고정 (56px) - 로고, 그룹 선택, 알림, 프로필</li>
          <li>• Sidebar: 좌측 고정 (240px) - 네비게이션 메뉴</li>
          <li>• Main Content: 우측 영역 - 이 페이지 콘텐츠</li>
          <li>• Design Tokens: CSS 변수로 일관된 스타일 적용</li>
        </ul>
        <p className="mt-3 text-xs text-blue-700">
          다음 단계: Step 3-4에서 Route Guard, 역할별 메뉴, 실제 페이지 구현 예정
        </p>
      </div>
    </div>
  );
}
