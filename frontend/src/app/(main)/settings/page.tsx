'use client';

/**
 * Settings Page - WeTee MVP
 *
 * Screen: S-081 (설정 관리 화면)
 * Route: /settings
 *
 * Step 10: 설정 관리 기본 스켈레톤 페이지 (mock 데이터, UI 구조만)
 *
 * TODO (향후):
 * - 실제 설정 로딩/저장 API 연동 (GET/PUT /api/settings 등)
 * - 토글/선택 항목의 실시간 상태 변경 및 검증
 * - 계정/보안/알림/정산 등 섹션별 상세 설정 화면 분리
 */

import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import SettingsSectionCard from '@/components/settings/SettingsSectionCard';

// 로컬 타입 정의
interface SettingsSectionMeta {
  id: string;
  category: string;
  title: string;
  description: string;
}

interface SettingsToggleOption {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

/**
 * SettingsPage
 *
 * 설정 관리 메인 페이지
 * - 계정, 알림, 과외 운영 설정 섹션
 * - 각 섹션별 토글 옵션 리스트
 */
export default function SettingsPage() {
  // Mock 데이터: 설정 섹션 메타데이터
  const mockSections: SettingsSectionMeta[] = [
    {
      id: 'account',
      category: 'account',
      title: '계정 설정',
      description: '프로필 정보, 로그인 방법, 보안 설정을 관리합니다.',
    },
    {
      id: 'notifications',
      category: 'notifications',
      title: '알림 설정',
      description: '정산, 출결, 일정 알림 수신 방법을 관리합니다.',
    },
    {
      id: 'classroom',
      category: 'classroom',
      title: '과외 운영 설정',
      description: '수업 단위, 기본 수업 시간, 기본 알림 정책을 설정합니다.',
    },
  ];

  // Mock 데이터: 섹션별 토글 옵션 리스트
  const mockOptionsBySection: Record<string, SettingsToggleOption[]> = {
    account: [
      {
        id: 'account-login-alert-email',
        label: '새 기기 로그인 시 이메일 알림 받기',
        description: '낯선 기기에서 로그인되면 이메일로 알려줍니다.',
        enabled: true,
      },
    ],
    notifications: [
      {
        id: 'noti-payment',
        label: '정산 알림 받기',
        description: '입금/연체 등 정산 관련 알림을 수신합니다.',
        enabled: true,
      },
      {
        id: 'noti-attendance',
        label: '출결 알림 받기',
        description: '지각/결석 발생 시 알림을 수신합니다.',
        enabled: true,
      },
      {
        id: 'noti-schedule',
        label: '일정 변경 알림 받기',
        description: '수업 일정 변경 시 알림을 수신합니다.',
        enabled: false,
      },
    ],
    classroom: [
      {
        id: 'class-auto-attendance',
        label: '수업 시작 시 자동 출결 체크 알림',
        description: '수업 시작 5분 전에 출결 체크 알림을 표시합니다.',
        enabled: true,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <PageHeader
        title="설정 관리"
        subtitle="계정, 알림, 과외 운영 환경을 한 곳에서 설정합니다."
        actions={
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            변경 내용 저장
          </button>
        }
      />

      {/* 섹션: 설정 카드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockSections.map((section) => (
          <SettingsSectionCard
            key={section.id}
            section={section}
            options={mockOptionsBySection[section.id] ?? []}
          />
        ))}
      </div>

      {/* 하단 안내 박스 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-1">
          ℹ️ Step 10 완료: 설정 관리 페이지 스켈레톤
        </p>
        <p className="text-blue-800">
          현재 mock 데이터로 설정 섹션과 항목을 표시하고 있습니다. 실제 설정
          API 연동 및 저장 기능을 추가하면, 이 화면에서 계정/알림/과외 운영
          설정을 직접 관리할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
