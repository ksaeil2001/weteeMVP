/**
 * Notifications Page - WeTee MVP
 *
 * Screen: S-071 (알림 관리 화면)
 * Route: /notifications
 *
 * Step 9: 알림 관리 기본 스켈레톤 페이지 (mock 데이터, UI 구조만)
 *
 * TODO (향후):
 * - 실제 알림 API 연동 (GET /api/notifications, /summary 등)
 * - 읽음/읽지 않음 토글 및 일괄 처리
 * - 카테고리/상태/기간 필터 및 정렬
 * - 알림 상세 모달/페이지
 * - 'use client'로 전환 (useAuth, 클라이언트 상호작용 추가 시)
 */

import React from 'react';
import PageHeader from '@/components/common/PageHeader';
import NotificationStatusBadge from '@/components/notifications/NotificationStatusBadge';
import NotificationList from '@/components/notifications/NotificationList';
import type {
  NotificationSummaryCounts,
  NotificationItem,
} from '@/types/notifications';

/**
 * NotificationsPage
 *
 * 알림 관리 메인 페이지
 * - 알림 요약 (전체/읽지 않음/읽음 개수)
 * - 필터 탭 (전체/읽지 않음/읽음)
 * - 최근 알림 리스트
 */
export default function NotificationsPage() {
  // Mock 데이터: 알림 요약
  const mockSummary: NotificationSummaryCounts = {
    totalCount: 12,
    unreadCount: 3,
    readCount: 9,
  };

  // Mock 데이터: 알림 항목 리스트
  const mockNotifications: NotificationItem[] = [
    {
      id: 'noti-1',
      createdAt: '2025-11-12T14:30:00Z',
      title: '[정산] 11월 수업료 입금이 완료되었습니다.',
      message:
        '고3 수학반 김수학 학생의 11월 수업료 400,000원이 입금되었습니다.',
      category: 'payment',
      status: 'unread',
      relatedStudentName: '김수학',
      relatedGroupName: '고3 수학반',
    },
    {
      id: 'noti-2',
      createdAt: '2025-11-11T08:10:00Z',
      title: '[출결] 지각 알림 - 고2 영어반 이영어',
      message: '고2 영어반 이영어 학생이 오늘 수업에 10분 지각했습니다.',
      category: 'attendance',
      status: 'unread',
      relatedStudentName: '이영어',
      relatedGroupName: '고2 영어반',
    },
    {
      id: 'noti-3',
      createdAt: '2025-11-10T18:00:00Z',
      title: '[일정] 다음 주 수업 일정이 업데이트되었습니다.',
      message:
        '다음 주 고3 수학반 수업 일정이 변경되었습니다. 상세 일정을 확인해 주세요.',
      category: 'schedule',
      status: 'read',
      relatedGroupName: '고3 수학반',
    },
    {
      id: 'noti-4',
      createdAt: '2025-11-09T09:00:00Z',
      title: '[시스템] 비밀번호가 성공적으로 변경되었습니다.',
      message:
        '회원님의 계정 비밀번호가 변경되었습니다. 본인이 변경한 것이 아니라면 즉시 문의해 주세요.',
      category: 'system',
      status: 'read',
    },
    {
      id: 'noti-5',
      createdAt: '2025-11-08T16:20:00Z',
      title: '[정산] 10월 정산 내역서가 생성되었습니다.',
      message:
        '10월 정산 내역서가 생성되었습니다. 총 8회 수업, 720,000원입니다.',
      category: 'payment',
      status: 'read',
      relatedGroupName: '고3 수학반',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <PageHeader
        title="알림 관리"
        subtitle="정산, 출결, 일정 등 중요한 알림을 한 곳에서 확인합니다."
        actions={
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            모두 읽음 처리
          </button>
        }
      />

      {/* 섹션 1: 알림 요약 영역 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap items-center gap-4">
        <div>
          <div className="text-sm text-gray-600">전체 알림</div>
          <div className="text-2xl font-bold text-gray-900">
            {mockSummary.totalCount}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <NotificationStatusBadge status="unread" />
          </div>
          <div className="text-xl font-semibold text-blue-700">
            {mockSummary.unreadCount}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <NotificationStatusBadge status="read" />
          </div>
          <div className="text-xl font-semibold text-gray-700">
            {mockSummary.readCount}
          </div>
        </div>
      </div>

      {/* 섹션 2: 필터 탭 (목업 - 현재는 UI만) */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-sm rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
          전체
        </button>
        <button className="px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">
          읽지 않음
        </button>
        <button className="px-3 py-1.5 text-sm rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">
          읽음
        </button>
      </div>

      {/* 섹션 3: 알림 리스트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">최근 알림</h2>
        </div>
        <NotificationList items={mockNotifications} />
      </div>

      {/* 섹션 4: 개발 안내 섹션 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-1">
          ℹ️ Step 9 완료: 알림 관리 페이지 스켈레톤
        </p>
        <p className="text-blue-800">
          현재 mock 데이터로 표시 중입니다. 실제 알림 API 및 읽음 처리 기능
          연동 시 데이터와 상태가 동적으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
