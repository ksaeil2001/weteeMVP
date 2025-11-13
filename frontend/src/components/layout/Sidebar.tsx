/**
 * Sidebar Component - WeTee MVP
 *
 * 좌측 사이드바 네비게이션
 * Based on: UX_UI_설계서.md Section 3.2 (네비게이션 구조)
 *
 * 너비: 240px (고정)
 *
 * TODO (Step 3-4):
 * - 역할별 메뉴 동적 렌더링 (선생님/학생/학부모)
 * - Next.js Link 컴포넌트 연결
 * - 현재 활성 메뉴 하이라이트
 * - 아이콘 추가 (SF Symbols/Material Icons)
 *
 * 현재: 임시로 선생님 기준 메뉴만 하드코딩
 */

import React from 'react';

export const Sidebar: React.FC = () => {
  // TODO (Step 3-4): 역할별 메뉴 구성
  // 선생님: home, groups, schedule, attendance, lessons, payments, notifications, settings
  // 학생: home, schedule, lessons, notifications, settings
  // 학부모: home, schedule, payments, notifications, settings

  const tempTeacherMenu = [
    { id: 'home', label: '홈', icon: '🏠', path: '/dashboard' },
    { id: 'groups', label: '그룹 관리', icon: '👥', path: '/groups' },
    { id: 'schedule', label: '수업 일정', icon: '📅', path: '/schedule' },
    { id: 'attendance', label: '출결 관리', icon: '✅', path: '/attendance' },
    { id: 'lessons', label: '수업 기록', icon: '📝', path: '/lessons' },
    { id: 'payments', label: '정산', icon: '💰', path: '/payments' },
    { id: 'notifications', label: '알림', icon: '🔔', path: '/notifications' },
    { id: 'settings', label: '설정', icon: '⚙️', path: '/settings' },
  ];

  return (
    <aside
      className="fixed top-[56px] left-0 bottom-0 bg-gray-50 border-r border-gray-200 overflow-y-auto"
      style={{ width: '240px' }}
    >
      <nav className="p-4">
        <ul className="space-y-1">
          {tempTeacherMenu.map((item) => (
            <li key={item.id}>
              {/* TODO (Step 3-4): Replace with Next.js Link component */}
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-white hover:shadow-sm transition-all flex items-center gap-3"
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
