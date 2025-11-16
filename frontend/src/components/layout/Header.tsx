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
 * - 우측: 알림 아이콘 + 프로필 (이름 + 역할 뱃지)
 *
 * 변경 이력:
 * - Step 2: 정적 레이아웃 구조
 * - Step 4: useAuth로 사용자 정보 표시 추가
 * - Step 14: 프로필 드롭다운 메뉴 추가 (설정, 로그아웃)
 *
 * TODO (Step 5):
 * - 그룹 선택 드롭다운 실제 연동
 * - 알림 뱃지 표시 (읽지 않은 알림 개수)
 * - 프로필 아바타 이미지
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

// 역할 표시용 한글 매핑
const roleLabels = {
  teacher: '선생님',
  student: '학생',
  parent: '학부모',
} as const;

export const Header: React.FC = () => {
  const router = useRouter();
  const { currentUser, currentRole } = useAuth();

  // Step 14: 프로필 드롭다운 상태 관리
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // 프로필 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  /**
   * 프로필 버튼 클릭 핸들러
   */
  const handleProfileClick = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  /**
   * 로그아웃 메뉴 클릭 핸들러
   */
  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    router.push('/logout');
  };

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
            {/* TODO (Step 5): 읽지 않은 알림 뱃지 */}
          </button>

          {/* 프로필 영역: 이름 + 역할 뱃지 + 드롭다운 */}
          <div className="relative" ref={profileMenuRef}>
            {currentUser ? (
              <>
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="프로필 메뉴"
                  aria-expanded={isProfileMenuOpen}
                >
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {currentUser.name}
                    </div>
                    {currentRole && (
                      <div className="text-xs text-gray-500">
                        {roleLabels[currentRole]}
                      </div>
                    )}
                  </div>
                  <span className="text-xl">👤</span>
                </button>

                {/* Step 14: 프로필 드롭다운 메뉴 */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {/* 프로필/설정 메뉴 (나중에 구현) */}
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        // TODO: 프로필 페이지로 이동
                      }}
                    >
                      <span className="mr-2">⚙️</span>
                      설정
                    </button>

                    {/* 구분선 */}
                    <div className="border-t border-gray-200 my-1"></div>

                    {/* 로그아웃 */}
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <span className="mr-2">🚪</span>
                      로그아웃
                    </button>
                  </div>
                )}
              </>
            ) : (
              // 비로그인 상태 방어 (미들웨어에서 리다이렉트되지만 렌더링 안전성 확보)
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="프로필"
              >
                <span className="text-xl">👤</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export default Header;
