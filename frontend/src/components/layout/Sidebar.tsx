/**
 * Sidebar Component - WeTee MVP
 *
 * 좌측 사이드바 네비게이션
 * Based on: UX_UI_설계서.md Section 3.2 (네비게이션 구조)
 *
 * 너비: 240px (고정)
 *
 * 변경 이력:
 * - Step 2: 임시로 선생님 기준 메뉴만 하드코딩 (tempTeacherMenu)
 * - Step 4: 역할별 메뉴 구성을 navigation.ts로 분리, useAuth 훅으로 동적 렌더링
 *
 * TODO (Step 5):
 * - Next.js Link 컴포넌트 연결
 * - 현재 활성 메뉴 하이라이트
 * - 아이콘을 이모지에서 아이콘 라이브러리로 교체
 * - 메뉴 뱃지 (읽지 않은 알림 개수 등)
 */

'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getNavigationByRole } from '@/config/navigation';

export const Sidebar: React.FC = () => {
  // Step 4: useAuth 훅으로 현재 사용자 역할 가져오기
  const { currentRole } = useAuth();

  // Step 4: 역할에 따른 메뉴 동적 선택
  const menuItems = getNavigationByRole(currentRole);

  return (
    <aside
      className="fixed top-[56px] left-0 bottom-0 bg-gray-50 border-r border-gray-200 overflow-y-auto"
      style={{ width: '240px' }}
    >
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              {/* TODO (Step 5): Replace with Next.js Link component */}
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-white hover:shadow-sm transition-all flex items-center gap-3"
                title={item.description}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 하단 여백 */}
      <div className="h-16" />
    </aside>
  );
};

Sidebar.displayName = 'Sidebar';

export default Sidebar;
