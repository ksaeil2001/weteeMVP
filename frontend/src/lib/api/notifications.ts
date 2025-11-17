// F-008: 필수 알림 시스템 - API 레이어
// TODO(F-008): 현재는 목업 데이터 사용, 실제 FastAPI 백엔드 연동 시 교체 필요
// Reference: API_명세서.md 섹션 6.8

import {
  NotificationListResponse,
  NotificationSummary,
  NotificationFilter,
  NotificationCategory,
  MarkAllReadResponse,
  NotificationItem,
  FCMTokenRequest,
  FCMTokenResponse,
} from '@/types/notifications';

import {
  getMockNotificationPage,
  getMockNotificationSummary,
  markMockNotificationAsRead,
  markMockAllNotificationsAsRead,
  deleteMockNotification,
  createMockTestNotification,
  getMockRecentNotifications,
} from '@/mocks/notifications';

/**
 * 알림 목록 조회 (페이지네이션 & 필터링)
 *
 * @param params - 필터 및 페이지네이션 파라미터
 * @returns 알림 목록 응답
 *
 * TODO(F-008): 실제 API로 교체
 * Endpoint: GET /api/v1/notifications
 * Query Params: category, status, page, size
 *
 * @example
 * ```ts
 * const response = await fetchNotifications({
 *   category: 'schedule',
 *   status: 'unread',
 *   page: 1,
 *   size: 20
 * });
 * ```
 */
export async function fetchNotifications(
  params: NotificationFilter = {}
): Promise<NotificationListResponse> {
  // 현재: 목업 데이터 사용
  return getMockNotificationPage(params);

  /* 실제 API 연동 시:
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.set('category', params.category);
  if (params.status) queryParams.set('status', params.status);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.size) queryParams.set('size', params.size.toString());

  const response = await fetch(`/api/v1/notifications?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  const data = await response.json();
  return data.data; // { items, pagination, unread_count }
  */
}

/**
 * 알림 요약 정보 조회
 * 헤더 벨 아이콘에 표시할 읽지 않은 알림 개수 등
 *
 * @returns 알림 요약 (읽지 않은 개수, 카테고리별 카운트)
 *
 * TODO(F-008): 실제 API로 교체
 * Endpoint: GET /api/v1/notifications/summary
 *
 * @example
 * ```ts
 * const summary = await fetchNotificationSummary();
 * console.log(summary.total_unread); // 12
 * ```
 */
export async function fetchNotificationSummary(): Promise<NotificationSummary> {
  // 현재: 목업 데이터 사용
  return getMockNotificationSummary();

  /* 실제 API 연동 시:
  const response = await fetch('/api/v1/notifications/summary', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notification summary');
  }

  const data = await response.json();
  return data.data;
  */
}

/**
 * 알림 읽음 처리 (개별)
 *
 * @param notificationId - 알림 ID
 *
 * TODO(F-008): 실제 API로 교체
 * Endpoint: PATCH /api/v1/notifications/{notification_id}/read
 *
 * @example
 * ```ts
 * await markNotificationAsRead('notif-123');
 * ```
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // 현재: 목업 데이터 사용
  return markMockNotificationAsRead(notificationId);

  /* 실제 API 연동 시:
  const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
  */
}

/**
 * 알림 일괄 읽음 처리
 *
 * @param category - 특정 카테고리만 읽음 처리 (선택)
 * @returns 읽음 처리된 개수, 남은 읽지 않은 개수
 *
 * TODO(F-008): 실제 API로 교체
 * Endpoint: POST /api/v1/notifications/read-all
 * Body: { category?: string }
 *
 * @example
 * ```ts
 * // 전체 읽음 처리
 * const result = await markAllNotificationsAsRead();
 *
 * // 특정 카테고리만 읽음 처리
 * const result = await markAllNotificationsAsRead('schedule');
 * ```
 */
export async function markAllNotificationsAsRead(
  category?: NotificationCategory
): Promise<MarkAllReadResponse> {
  // 현재: 목업 데이터 사용
  return markMockAllNotificationsAsRead(category);

  /* 실제 API 연동 시:
  const response = await fetch('/api/v1/notifications/read-all', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ category }),
  });

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }

  const data = await response.json();
  return data.data; // { marked_count, remaining_unread }
  */
}

/**
 * 알림 삭제
 *
 * @param notificationId - 알림 ID
 *
 * TODO(F-008): 실제 API로 교체
 * Endpoint: DELETE /api/v1/notifications/{notification_id}
 * Response: 204 No Content
 *
 * @example
 * ```ts
 * await deleteNotification('notif-123');
 * ```
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  // 현재: 목업 데이터 사용
  return deleteMockNotification(notificationId);

  /* 실제 API 연동 시:
  const response = await fetch(`/api/v1/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
  */
}

/**
 * FCM 토큰 등록 (푸시 알림용)
 *
 * @param request - FCM 토큰 및 디바이스 정보
 * @returns 토큰 ID 및 등록 시간
 *
 * TODO(F-008): 실제 API로 교체
 * Endpoint: POST /api/v1/notifications/fcm-token
 *
 * @example
 * ```ts
 * const response = await registerFCMToken({
 *   fcm_token: 'fcm_token_123...',
 *   device_info: {
 *     device_type: 'mobile',
 *     os: 'iOS',
 *     app_version: '1.0.0'
 *   }
 * });
 * ```
 */
export async function registerFCMToken(request: FCMTokenRequest): Promise<FCMTokenResponse> {
  // MVP에서는 구현하지 않음 (2단계 기능)
  console.warn('FCM token registration not implemented in MVP');

  // 목업 응답
  await new Promise(resolve => setTimeout(resolve, 200));
  return {
    token_id: `token-${Date.now()}`,
    registered_at: new Date().toISOString(),
  };

  /* 실제 API 연동 시:
  const response = await fetch('/api/v1/notifications/fcm-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to register FCM token');
  }

  const data = await response.json();
  return data.data;
  */
}

/**
 * FCM 토큰 삭제 (로그아웃 시)
 *
 * @param fcmToken - FCM 토큰
 *
 * TODO(F-008): 실제 API로 교체
 * Endpoint: DELETE /api/v1/notifications/fcm-token
 *
 * @example
 * ```ts
 * await unregisterFCMToken('fcm_token_123...');
 * ```
 */
export async function unregisterFCMToken(fcmToken: string): Promise<void> {
  // MVP에서는 구현하지 않음 (2단계 기능)
  console.warn('FCM token unregistration not implemented in MVP');

  await new Promise(resolve => setTimeout(resolve, 200));

  /* 실제 API 연동 시:
  const response = await fetch('/api/v1/notifications/fcm-token', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fcm_token: fcmToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to unregister FCM token');
  }
  */
}

/**
 * 테스트 알림 생성 (개발 환경 전용)
 *
 * @param type - 알림 타입
 * @returns 생성된 알림
 *
 * TODO(F-008): 실제 API로 교체
 * Endpoint: POST /api/v1/notifications/test
 *
 * @example
 * ```ts
 * const notification = await createTestNotification('schedule');
 * ```
 */
export async function createTestNotification(
  type: 'schedule' | 'payment' | 'attendance' | 'lesson'
): Promise<NotificationItem> {
  // 현재: 목업 데이터 사용
  return createMockTestNotification(type);

  /* 실제 API 연동 시:
  const response = await fetch('/api/v1/notifications/test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    throw new Error('Failed to create test notification');
  }

  const data = await response.json();
  return data.data;
  */
}

/**
 * 최근 알림 가져오기 (헤더 드롭다운용)
 *
 * @param limit - 가져올 알림 개수 (기본: 5)
 * @returns 최근 알림 목록
 *
 * @example
 * ```ts
 * const recentNotifications = await fetchRecentNotifications(5);
 * ```
 */
export async function fetchRecentNotifications(limit: number = 5): Promise<NotificationItem[]> {
  // 현재: 목업 데이터 사용
  return getMockRecentNotifications(limit);

  /* 실제 API 연동 시:
  const response = await fetchNotifications({ page: 1, size: limit, status: 'all' });
  return response.items;
  */
}

// 헬퍼 함수: Access Token 가져오기 (실제 연동 시 사용)
/*
function getAccessToken(): string {
  // useAuth 훅이나 localStorage에서 토큰 가져오기
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}
*/
