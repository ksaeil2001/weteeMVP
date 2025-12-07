/**
 * Main Layout - WeTee MVP
 *
 * 로그인 후 메인 애플리케이션 레이아웃
 * Route Group: (main)
 *
 * Based on: UX_UI_설계서.md Section 4.1 (공통 레이아웃 구조)
 *
 * 구조:
 * - Header (상단 고정, 56px)
 * - Sidebar (좌측, 데스크톱 고정 240px / 모바일 토글)
 * - Main Content (우측, flex-1)
 * - BottomTabBar (모바일만, 하단 고정 64px)
 *
 * 반응형:
 * - 모바일 (<1024px): 사이드바 오버레이, 하단 탭바 표시
 * - 데스크톱 (>=1024px): 사이드바 고정, 하단 탭바 숨김
 *
 * 변경 이력:
 * - 반응형: NavigationProvider, BottomTabBar 추가
 */

import React from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import BottomTabBar from '@/components/layout/BottomTabBar';
import { NavigationProvider } from '@/contexts/NavigationContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header - 상단 고정 (56px) */}
        <Header />

        {/* Sidebar - 좌측 (데스크톱 고정 240px / 모바일 토글) */}
        <Sidebar />

        {/* Main Content - 우측 영역 */}
        <main
          className="
            pt-[56px]
            pb-[64px] lg:pb-0
            lg:pl-[240px]
          "
          style={{
            minHeight: '100vh',
          }}
        >
          {/* Content Area with responsive padding */}
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>

        {/* BottomTabBar - 모바일만 표시 */}
        <BottomTabBar />
      </div>
    </NavigationProvider>
  );
}
