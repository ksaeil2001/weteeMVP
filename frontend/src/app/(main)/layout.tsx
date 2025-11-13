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
 * - Sidebar (좌측 고정, 240px)
 * - Main Content (우측, flex-1)
 *
 * TODO (Step 3-4):
 * - Route Guard 추가 (로그인 체크)
 * - 역할별(선생님/학생/학부모) 레이아웃 분기
 * - 전역 상태 관리 Provider 추가 (Zustand)
 * - React Query Provider 추가
 *
 * 현재: 정적 레이아웃 구조만 구현
 */

import React from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 상단 고정 (56px) */}
      <Header />

      {/* Sidebar - 좌측 고정 (240px) */}
      <Sidebar />

      {/* Main Content - 우측 영역 */}
      <main
        className="pt-[56px] pl-[240px]"
        style={{
          minHeight: '100vh',
        }}
      >
        {/* Content Area with padding */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
