// F-008: 필수 알림 시스템 - API 레이어
// Reference: API_명세서.md 섹션 6.8
// 실제 FastAPI 백엔드 연동

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

import { apiRequest } from '@/lib/apiClient';

/**
 * 알림 목록 조회 (페이지네이션 & 필터링)
 *
 * @param params - 필터 및 페이지네이션 파라미터
 * @returns 알림 목록 응답
 *
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
  const queryParams = new URLSearchParams();

  if (params.category && params.category !== 'all') {
    queryParams.set('category', params.category);
  }
  if (params.status && params.status !== 'all') {
    queryParams.set('status', params.status);
  }
  if (params.page) {
    queryParams.set('page', params.page.toString());
  }
  if (params.size) {
    queryParams.set('size', params.size.toString());
  }

  const queryString = queryParams.toString();
  const path = queryString ? `/notifications?${queryString}` : '/notifications';

  return apiRequest<NotificationListResponse>(path, {
    method: 'GET',
  });
}

/**
 * 알림 요약 정보 조회
 * 헤더 벨 아이콘에 표시할 읽지 않은 알림 개수 등
 *
 * @returns 알림 요약 (읽지 않은 개수, 카테고리별 카운트)
 *
 * Endpoint: GET /api/v1/notifications/summary
 *
 * @example
 * ```ts
 * const summary = await fetchNotificationSummary();
 * console.log(summary.total_unread); // 12
 * ```
 */
export async function fetchNotificationSummary(): Promise<NotificationSummary> {
  return apiRequest<NotificationSummary>('/notifications/summary', {
    method: 'GET',
  });
}

/**
 * 알림 읽음 처리 (개별)
 *
 * @param notificationId - 알림 ID
 *
 * Endpoint: PATCH /api/v1/notifications/{notification_id}/read
 *
 * @example
 * ```ts
 * await markNotificationAsRead('notif-123');
 * ```
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  // 204 No Content 응답이므로 반환값 없음
  await apiRequest<void>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

/**
 * 알림 일괄 읽음 처리
 *
 * @param category - 특정 카테고리만 읽음 처리 (선택)
 * @returns 읽음 처리된 개수, 남은 읽지 않은 개수
 *
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
  return apiRequest<MarkAllReadResponse>('/notifications/read-all', {
    method: 'POST',
    body: JSON.stringify({ category: category ?? null }),
  });
}

/**
 * 알림 삭제
 *
 * @param notificationId - 알림 ID
 *
 * Endpoint: DELETE /api/v1/notifications/{notification_id}
 * Response: 204 No Content
 *
 * @example
 * ```ts
 * await deleteNotification('notif-123');
 * ```
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  // 204 No Content 응답이므로 반환값 없음
  await apiRequest<void>(`/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

/**
 * FCM 토큰 등록 (푸시 알림용)
 *
 * @param request - FCM 토큰 및 디바이스 정보
 * @returns 토큰 ID 및 등록 시간
 *
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
  // 백엔드에서 501 Not Implemented 반환
  return apiRequest<FCMTokenResponse>('/notifications/fcm-token', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * FCM 토큰 삭제 (로그아웃 시)
 *
 * @param fcmToken - FCM 토큰
 *
 * Endpoint: DELETE /api/v1/notifications/fcm-token
 *
 * @example
 * ```ts
 * await unregisterFCMToken('fcm_token_123...');
 * ```
 */
export async function unregisterFCMToken(fcmToken: string): Promise<void> {
  // MVP에서는 구현하지 않음 (2단계 기능)
  // 백엔드에서 501 Not Implemented 반환
  await apiRequest<void>(`/notifications/fcm-token?fcm_token=${fcmToken}`, {
    method: 'DELETE',
  });
}

/**
 * 테스트 알림 생성 (개발 환경 전용)
 *
 * @param type - 알림 타입
 * @returns 생성된 알림
 *
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
  return apiRequest<NotificationItem>('/notifications/test', {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
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
  const response = await fetchNotifications({ page: 1, size: limit, status: 'all' });
  return response.items;
}
