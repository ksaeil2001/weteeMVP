/**
 * Header Component - WeTee MVP
 *
 * 공통 헤더 (로그인 후 메인 레이아웃 상단)
 * Based on: UX_UI_설계서.md Section 4.1 (공통 레이아웃 구조)
 *
 * 높이: 56px (--height-navbar)
 *
 * 구조:
 * - 좌측: 로고/서비스 이름
 * - 가운데: 그룹 선택 드롭다운 (나중 구현)
 * - 우측: 알림 아이콘 + 프로필 아이콘
 *
 * TODO (Step 3-4):
 * - 그룹 선택 드롭다운 연동
 * - 알림 뱃지 표시
 * - 프로필 드롭다운 메뉴
 * - 역할별 헤더 콘텐츠 분기
 */

import React from 'react';

export const Header: React.FC = () => {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200"
      style={{ height: 'var(--height-navbar)' }}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* 좌측: 로고/서비스 이름 */}
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold text-primary-500">
            WeTee
          </div>
          <span className="text-sm text-gray-600">
            과외의 모든 것, 하나로
          </span>
        </div>

        {/* 가운데: 그룹 선택 (placeholder) */}
        <div className="flex items-center gap-2 text-gray-600">
          <span className="text-sm">📋 그룹 선택</span>
          <span className="text-xs">▼</span>
        </div>

        {/* 우측: 알림 + 프로필 */}
        <div className="flex items-center gap-4">
          {/* 알림 아이콘 (placeholder) */}
          <button
            type="button"
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="알림"
          >
            <span className="text-xl">🔔</span>
            {/* TODO: 읽지 않은 알림 뱃지 */}
          </button>

          {/* 프로필 아이콘 (placeholder) */}
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="프로필"
          >
            <span className="text-xl">👤</span>
          </button>
        </div>
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export default Header;
