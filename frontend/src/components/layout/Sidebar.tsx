/**
 * Sidebar Component - WeTee MVP
 *
 * 좌측 사이드바 네비게이션
 * Based on: UX_UI_설계서.md Section 3.2 (네비게이션 구조)
 *
 * 너비: 240px (데스크톱 고정)
 *
 * 반응형:
 * - 모바일 (<1024px): 오버레이 사이드바, 햄버거 메뉴로 토글
 * - 데스크톱 (>=1024px): 고정 사이드바, 항상 표시
 *
 * 변경 이력:
 * - Step 2: 임시로 선생님 기준 메뉴만 하드코딩 (tempTeacherMenu)
 * - Step 4: 역할별 메뉴 구성을 navigation.ts로 분리, useAuth 훅으로 동적 렌더링
 * - Step 6: Link + 활성 메뉴 하이라이트 적용
 * - 반응형: 모바일 오버레이 사이드바 구현
 */

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNavigation } from '@/contexts/NavigationContext';
import { getNavigationByRole } from '@/config/navigation';

export const Sidebar: React.FC = () => {
  const { currentRole } = useAuth();
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar, isMobile } = useNavigation();

  // 역할에 따른 메뉴 동적 선택
  const menuItems = getNavigationByRole(currentRole);

  // 메뉴 클릭 시 모바일에서는 사이드바 닫기
  const handleMenuClick = () => {
    if (isMobile) {
      closeSidebar();
    }
  };

  // ESC 키로 사이드바 닫기 (모바일)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isSidebarOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobile, isSidebarOpen, closeSidebar]);

  return (
    <>
      {/* 오버레이 (모바일에서 사이드바 열렸을 때) */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`
          fixed top-[56px] bottom-0 bg-gray-50 border-r border-gray-200 overflow-y-auto z-50
          transition-transform duration-300 ease-in-out
          ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          lg:translate-x-0
        `}
        style={{ width: '240px' }}
        aria-hidden={isMobile && !isSidebarOpen}
      >
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;

            return (
              <li key={item.id}>
                <Link href={item.path} onClick={handleMenuClick}>
                  <div
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-white shadow-sm border border-primary-200 text-primary-700'
                        : 'hover:bg-white hover:shadow-sm text-gray-700'
                    }`}
                    title={item.description}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 하단 여백 */}
      <div className="h-16" />
    </aside>
    </>
  );
};

Sidebar.displayName = 'Sidebar';

export default Sidebar;
