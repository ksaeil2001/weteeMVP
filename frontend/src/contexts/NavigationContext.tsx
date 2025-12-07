/**
 * Navigation Context - WeTee MVP
 *
 * 모바일 네비게이션 상태 관리를 위한 컨텍스트
 * - 사이드바 토글 상태
 * - 모바일 감지
 *
 * 반응형 레이아웃 구현을 위해 추가됨
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NavigationContextType {
  /** 사이드바 열림/닫힘 상태 */
  isSidebarOpen: boolean;
  /** 사이드바 토글 함수 */
  toggleSidebar: () => void;
  /** 사이드바 닫기 함수 */
  closeSidebar: () => void;
  /** 모바일 화면 여부 (< 1024px) */
  isMobile: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);

      // 데스크톱에서는 사이드바 항상 열림
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    // 초기 체크
    checkMobile();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <NavigationContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        closeSidebar,
        isMobile,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
