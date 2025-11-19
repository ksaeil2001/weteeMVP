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
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchNotificationSummary, fetchRecentNotifications, markNotificationAsRead } from '@/lib/api/notifications';
import { NotificationSummary, NotificationItem, NOTIFICATION_ICON_MAP } from '@/types/notifications';

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

  // F-008: 알림 드롭다운 상태 관리
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState<NotificationSummary | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  // 프로필 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setIsNotificationMenuOpen(false);
      }
    };

    if (isProfileMenuOpen || isNotificationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, isNotificationMenuOpen]);

  // F-008: 알림 요약 정보 로드
  useEffect(() => {
    const loadNotificationSummary = async () => {
      try {
        const summary = await fetchNotificationSummary();
        setNotificationSummary(summary);
      } catch (error) {
        console.error('Failed to load notification summary:', error);
      }
    };

    loadNotificationSummary();

    // 30초마다 자동 갱신
    const interval = setInterval(loadNotificationSummary, 30000);
    return () => clearInterval(interval);
  }, []);

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

  /**
   * F-008: 알림 벨 클릭 핸들러
   */
  const handleNotificationClick = async () => {
    if (!isNotificationMenuOpen) {
      // 드롭다운 열 때 최근 알림 로드
      try {
        const notifications = await fetchRecentNotifications(5);
        setRecentNotifications(notifications);
      } catch (error) {
        console.error('Failed to load recent notifications:', error);
      }
    }
    setIsNotificationMenuOpen((prev) => !prev);
  };

  /**
   * F-008: 알림 항목 클릭 핸들러
   */
  const handleNotificationItemClick = async (notification: NotificationItem) => {
    // 읽음 처리
    if (notification.status === 'unread') {
      await markNotificationAsRead(notification.notification_id);
    }

    // 드롭다운 닫기
    setIsNotificationMenuOpen(false);

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
      }
    }
  };

  /**
   * F-008: 상대 시간 표시 헬퍼
   */
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
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
          {/* F-008: 알림 아이콘 + 드롭다운 */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              type="button"
              onClick={handleNotificationClick}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={`알림 ${notificationSummary && notificationSummary.total_unread > 0 ? `읽지 않은 알림 ${notificationSummary.total_unread}개` : ''}`}
              aria-expanded={isNotificationMenuOpen}
            >
              <span className="text-xl" aria-hidden="true">🔔</span>
              {/* 읽지 않은 알림 뱃지 */}
              {notificationSummary && notificationSummary.total_unread > 0 && (
                <span
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {notificationSummary.total_unread > 9 ? '9+' : notificationSummary.total_unread}
                  <span className="sr-only">개의 읽지 않은 알림</span>
                </span>
              )}
            </button>

            {/* 알림 드롭다운 메뉴 */}
            {isNotificationMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                {/* 드롭다운 헤더 */}
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">알림</h3>
                  <Link
                    href="/notifications"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setIsNotificationMenuOpen(false)}
                  >
                    전체보기
                  </Link>
                </div>

                {/* 알림 목록 */}
                <div className="overflow-y-auto flex-1">
                  {recentNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      새로운 알림이 없습니다
                    </div>
                  ) : (
                    recentNotifications.map((notification, index) => (
                      <div key={notification.notification_id}>
                        <button
                          onClick={() => handleNotificationItemClick(notification)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            notification.status === 'unread' ? 'bg-blue-50/30' : ''
                          }`}
                          aria-label={`${notification.title} - ${notification.status === 'unread' ? '읽지 않음' : '읽음'}`}
                        >
                          <div className="flex gap-2">
                            <div className="flex-shrink-0 text-lg">
                              {NOTIFICATION_ICON_MAP[notification.category]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`text-sm font-semibold mb-1 ${
                                  notification.status === 'unread'
                                    ? 'text-gray-900'
                                    : 'text-gray-700'
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {getRelativeTime(notification.created_at)}
                              </p>
                            </div>
                            {notification.status === 'unread' && (
                              <div className="flex-shrink-0">
                                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                              </div>
                            )}
                          </div>
                        </button>
                        {index < recentNotifications.length - 1 && (
                          <div className="border-b border-gray-100"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
                      aria-label="설정으로 이동"
                    >
                      <span className="mr-2" aria-hidden="true">⚙️</span>
                      설정
                    </button>

                    {/* 구분선 */}
                    <div className="border-t border-gray-200 my-1"></div>

                    {/* 로그아웃 */}
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                      aria-label="로그아웃"
                    >
                      <span className="mr-2" aria-hidden="true">🚪</span>
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
