/**
 * Bottom Tab Bar Component - WeTee MVP
 *
 * 모바일 전용 하단 탭바 네비게이션
 *
 * 표시 조건:
 * - 모바일 화면 (<1024px)에서만 표시
 * - 데스크톱에서는 숨김 (Sidebar 사용)
 *
 * 구조:
 * - 핵심 메뉴 4-5개만 표시 (홈, 일정, 수업기록, 알림, 더보기)
 * - 고정 하단 배치 (safe area 고려)
 * - 활성 메뉴 하이라이트
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useNavigation } from '@/contexts/NavigationContext';

interface TabItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

/**
 * 역할별 하단 탭 메뉴 (핵심 기능만)
 */
const getBottomTabsByRole = (role: 'teacher' | 'student' | 'parent' | null): TabItem[] => {
  const commonTabs: TabItem[] = [
    { id: 'home', label: '홈', icon: '🏠', path: '/' },
    { id: 'schedule', label: '일정', icon: '📅', path: '/schedule' },
    { id: 'lessons', label: '수업', icon: '📝', path: '/lessons' },
    { id: 'notifications', label: '알림', icon: '🔔', path: '/notifications' },
  ];

  // 선생님: 더보기 버튼으로 사이드바 토글
  if (role === 'teacher') {
    return [
      ...commonTabs,
      { id: 'more', label: '더보기', icon: '☰', path: '#' },
    ];
  }

  // 학생/학부모: 설정 추가
  return [
    ...commonTabs,
    { id: 'settings', label: '설정', icon: '⚙️', path: '/settings' },
  ];
};

export const BottomTabBar: React.FC = () => {
  const pathname = usePathname();
  const { currentRole } = useAuth();
  const { toggleSidebar, isMobile } = useNavigation();

  const tabs = getBottomTabsByRole(currentRole);

  // 데스크톱에서는 표시하지 않음
  if (!isMobile) {
    return null;
  }

  /**
   * 탭 클릭 핸들러
   */
  const handleTabClick = (tab: TabItem, e: React.MouseEvent) => {
    if (tab.id === 'more') {
      e.preventDefault();
      toggleSidebar();
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden"
      style={{
        height: '64px',
        paddingBottom: 'env(safe-area-inset-bottom)', // iOS safe area
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {tabs.map((tab) => {
          const isActive = tab.path === '#' ? false : pathname === tab.path;

          return (
            <Link
              key={tab.id}
              href={tab.path}
              onClick={(e) => handleTabClick(tab, e)}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full
                transition-colors duration-200
                ${isActive ? 'text-primary-600' : 'text-gray-600'}
                active:bg-gray-100
                rounded-lg
                min-w-0
              `}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* 아이콘 */}
              <span
                className={`text-2xl mb-1 transition-transform ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
                aria-hidden="true"
              >
                {tab.icon}
              </span>

              {/* 레이블 */}
              <span
                className={`text-xs font-medium truncate max-w-full ${
                  isActive ? 'text-primary-600' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </span>

              {/* 활성 인디케이터 */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

BottomTabBar.displayName = 'BottomTabBar';

export default BottomTabBar;
