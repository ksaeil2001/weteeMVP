'use client';

/**
 * F-008: 필수 알림 시스템 - 알림 센터 화면
 * Screen ID: S-041 (알림 센터 화면)
 * Route: /notifications
 *
 * Reference:
 * - F-008_필수_알림_시스템.md
 * - UX_UI_설계서.md 섹션 4.2 (S-041 와이어프레임)
 * - API_명세서.md 섹션 6.8
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  NotificationCategory,
  NotificationItem,
  NotificationListResponse,
  NOTIFICATION_ICON_MAP,
} from '@/types/notifications';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/api/notifications';

export default function NotificationsPage() {
  const router = useRouter();

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [notificationData, setNotificationData] = useState<NotificationListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 알림 목록 가져오기
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNotifications({
        category: selectedCategory,
        status: selectedStatus,
        page: currentPage,
        size: 20,
      });
      setNotificationData(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터 변경 시 목록 새로고침
  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus, currentPage]);

  // 알림 클릭 핸들러
  const handleNotificationClick = async (notification: NotificationItem) => {
    // 읽음 처리
    if (notification.status === 'unread') {
      await markNotificationAsRead(notification.notification_id);
    }

    // 관련 화면으로 이동
    if (notification.related_resource) {
      const { type, id } = notification.related_resource;

      switch (type) {
        case 'schedule':
          router.push(`/schedule/${id}`);
          break;
        case 'attendance':
          router.push(`/attendance`);
          break;
        case 'lesson':
          router.push(`/lessons/${id}`);
          break;
        case 'payment':
          router.push(`/billing/${id}`);
          break;
        case 'group':
          router.push(`/groups/${id}`);
          break;
        default:
          console.log('Unknown resource type:', type);
      }
    }

    // 목록 새로고침 (읽음 처리 반영)
    loadNotifications();
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(selectedCategory === 'all' ? undefined : selectedCategory);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // 알림 삭제
  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지

    if (confirm('이 알림을 삭제하시겠습니까?')) {
      try {
        await deleteNotification(notificationId);
        loadNotifications();
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    }
  };

  // 카테고리 탭 정의
  const categoryTabs: { value: NotificationCategory; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'schedule', label: '수업' },
    { value: 'payment', label: '정산' },
    { value: 'attendance', label: '출결' },
    { value: 'lesson', label: '수업기록' },
    { value: 'group', label: '그룹' },
    { value: 'system', label: '기타' },
  ];

  // 상대 시간 표시 헬퍼
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;

    // 7일 이상은 날짜 표시
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">알림</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              전체 읽음
            </button>
            <button
              onClick={() => router.push('/settings/notifications')}
              className="text-gray-600 hover:text-gray-700"
              aria-label="알림 설정"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* 카테고리 필터 탭 */}
        <div className="max-w-4xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categoryTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => {
                  setSelectedCategory(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* 알림 목록 */}
        {!isLoading && notificationData && (
          <div className="space-y-0 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {notificationData.items.length === 0 ? (
              // 빈 상태
              <div className="py-16 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  알림이 없습니다
                </h3>
                <p className="text-gray-600">
                  새로운 알림이 오면 여기에 표시됩니다
                </p>
              </div>
            ) : (
              notificationData.items.map((notification, index) => (
                <div key={notification.notification_id}>
                  {/* 알림 카드 */}
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                      notification.status === 'unread' ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* 읽지 않음 표시 (왼쪽 파란색 바) */}
                    {notification.status === 'unread' && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                    )}

                    <div className="flex gap-3">
                      {/* 아이콘 */}
                      <div className="flex-shrink-0 text-2xl">
                        {NOTIFICATION_ICON_MAP[notification.category]}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3
                            className={`text-sm font-semibold ${
                              notification.status === 'unread'
                                ? 'text-gray-900'
                                : 'text-gray-700'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {getRelativeTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={(e) => handleDeleteNotification(notification.notification_id, e)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="알림 삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* 구분선 */}
                  {index < notificationData.items.length - 1 && (
                    <div className="border-b border-gray-100"></div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 페이지네이션 */}
        {notificationData && notificationData.pagination.total_pages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!notificationData.pagination.has_prev}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {currentPage} / {notificationData.pagination.total_pages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!notificationData.pagination.has_next}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}

        {/* 개발 안내 (MVP 단계에서만 표시) */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-semibold text-blue-900 mb-1">
            ℹ️ F-008: 알림 시스템 프론트엔드 스켈레톤 완료
          </p>
          <p className="text-blue-800 mb-2">
            현재 목업 데이터로 표시 중입니다. 백엔드 API 연동 후 실제 데이터가 표시됩니다.
          </p>
          <p className="text-blue-700 text-xs">
            알림 클릭 시 관련 화면으로 이동 (현재는 console.log)
          </p>
        </div>
      </div>
    </div>
  );
}
