// F-008: 필수 알림 시스템 - Mock 데이터
// Reference: F-008_필수_알림_시스템.md

import {
  NotificationItem,
  NotificationListResponse,
  NotificationSummary,
  NotificationCategory,
  NotificationFilter,
  MarkAllReadResponse,
  NotificationStatus,
} from '@/types/notifications';

// 목업 알림 데이터 저장소 (메모리)
let mockNotifications: NotificationItem[] = [
  // 선생님용 알림 예시
  {
    notification_id: 'notif-001',
    category: 'schedule',
    type: 'SCHEDULE_REMINDER',
    title: '🔔 1시간 후 수업',
    message: '최학생 - 수학 (오후 3시)',
    status: 'unread',
    priority: 'HIGH',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5분 전
    related_resource: {
      type: 'schedule',
      id: 'schedule-001',
    },
    is_required: false,
  },
  {
    notification_id: 'notif-002',
    category: 'payment',
    type: 'PAYMENT_CONFIRMED',
    title: '✅ 결제 완료',
    message: '박학부모님이 11월 수업료 400,000원을 결제했어요',
    status: 'unread',
    priority: 'CRITICAL',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
    related_resource: {
      type: 'payment',
      id: 'invoice-001',
    },
    is_required: true,
  },
  {
    notification_id: 'notif-003',
    category: 'schedule',
    type: 'MAKEUP_CLASS_REQUESTED',
    title: '📅 보강 신청',
    message: '이학생님이 11/15(토) 오전 10시 보강을 신청했어요',
    status: 'read',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 어제
    read_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'schedule',
      id: 'schedule-002',
    },
  },

  // 학부모용 알림 예시
  {
    notification_id: 'notif-004',
    category: 'lesson',
    type: 'LESSON_RECORD_CREATED',
    title: '📝 수업 기록 업데이트',
    message: '김선생님이 11/13 수업 기록을 작성했어요',
    status: 'unread',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
    related_resource: {
      type: 'lesson',
      id: 'lesson-001',
    },
  },
  {
    notification_id: 'notif-005',
    category: 'attendance',
    type: 'ATTENDANCE_CHANGED',
    title: '❌ 출결 변동',
    message: '자녀의 11/13 수업이 결석 처리되었습니다',
    status: 'unread',
    priority: 'HIGH',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3시간 전
    related_resource: {
      type: 'attendance',
      id: 'attendance-001',
    },
  },
  {
    notification_id: 'notif-006',
    category: 'payment',
    type: 'BILLING_ISSUED',
    title: '💳 수업료 결제 요청',
    message: '11월 수업료 400,000원 (8회 수업)',
    status: 'read',
    priority: 'CRITICAL',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 이틀 전
    read_at: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'payment',
      id: 'invoice-002',
    },
    is_required: true,
  },

  // 학생용 알림 예시
  {
    notification_id: 'notif-007',
    category: 'lesson',
    type: 'HOMEWORK_ASSIGNED',
    title: '📚 숙제 등록',
    message: '수학 교과서 67~70페이지 풀어오기',
    status: 'unread',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1시간 전
    related_resource: {
      type: 'lesson',
      id: 'lesson-002',
    },
  },
  {
    notification_id: 'notif-008',
    category: 'schedule',
    type: 'SCHEDULE_REMINDER',
    message: '김선생님 - 영어 (오후 7시)',
    title: '🔔 1시간 후 수업',
    status: 'read',
    priority: 'HIGH',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
    read_at: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'schedule',
      id: 'schedule-003',
    },
  },
  {
    notification_id: 'notif-009',
    category: 'schedule',
    type: 'MAKEUP_CLASS_AVAILABLE',
    title: '📅 보강 가능 시간 오픈',
    message: '선생님이 11/15(토) 보강 가능한 시간을 올렸어요',
    status: 'read',
    priority: 'LOW',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
    read_at: new Date(Date.now() - 2.9 * 24 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'schedule',
      id: 'schedule-004',
    },
  },

  // 공통 알림
  {
    notification_id: 'notif-010',
    category: 'group',
    type: 'GROUP_INVITE',
    title: '👥 그룹 초대',
    message: '김선생님이 "수학 과외" 그룹에 초대했어요',
    status: 'read',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 전
    read_at: new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'group',
      id: 'group-001',
    },
  },
  {
    notification_id: 'notif-011',
    category: 'system',
    type: 'SYSTEM_NOTICE',
    title: 'ℹ️ 시스템 공지',
    message: '11/20(수) 오전 2시~4시 시스템 점검이 있습니다',
    status: 'unread',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10분 전
  },
  {
    notification_id: 'notif-012',
    category: 'schedule',
    type: 'SCHEDULE_CANCELLED',
    title: '🚫 수업 취소',
    message: '11/14 수학 수업이 선생님 사정으로 취소되었습니다',
    status: 'read',
    priority: 'HIGH',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4일 전
    read_at: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'schedule',
      id: 'schedule-005',
    },
  },
  {
    notification_id: 'notif-013',
    category: 'attendance',
    type: 'ATTENDANCE_CHANGED',
    title: '⏰ 출결 변동',
    message: '11/10 수업이 지각 처리되었습니다 (5분)',
    status: 'read',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5일 전
    read_at: new Date(Date.now() - 4.9 * 24 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'attendance',
      id: 'attendance-002',
    },
  },
  {
    notification_id: 'notif-014',
    category: 'payment',
    type: 'PAYMENT_FAILED',
    title: '⚠️ 결제 실패',
    message: '10월 수업료 결제가 실패했습니다. 카드를 확인해주세요',
    status: 'read',
    priority: 'CRITICAL',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10일 전
    read_at: new Date(Date.now() - 9.5 * 24 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'payment',
      id: 'invoice-003',
    },
    is_required: true,
  },
  {
    notification_id: 'notif-015',
    category: 'lesson',
    type: 'LESSON_RECORD_CREATED',
    title: '📝 수업 기록 업데이트',
    message: '김선생님이 11/12 수업 기록을 작성했어요',
    status: 'read',
    priority: 'NORMAL',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6일 전
    read_at: new Date(Date.now() - 5.8 * 24 * 60 * 60 * 1000).toISOString(),
    related_resource: {
      type: 'lesson',
      id: 'lesson-003',
    },
  },
];

/**
 * 역할별 알림 목록 가져오기
 * 실제 환경에서는 백엔드가 사용자 역할에 맞는 알림만 반환
 */
export function getMockNotificationsForRole(role: 'TEACHER' | 'STUDENT' | 'PARENT'): NotificationItem[] {
  // MVP에서는 모든 알림 반환 (실제로는 역할에 맞게 필터링)
  return mockNotifications;
}

/**
 * 알림 목록 조회 (페이지네이션 & 필터링)
 * TODO(F-008): 실제 API 엔드포인트로 교체 - GET /api/v1/notifications
 */
export async function getMockNotificationPage(
  filter: NotificationFilter
): Promise<NotificationListResponse> {
  // 네트워크 지연 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 300));

  const { category = 'all', status = 'all', page = 1, size = 20 } = filter;

  // 필터링
  let filteredNotifications = [...mockNotifications];

  if (category !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => n.category === category);
  }

  if (status !== 'all') {
    filteredNotifications = filteredNotifications.filter(n => n.status === status);
  }

  // 정렬: 최신순
  filteredNotifications.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 페이지네이션
  const total = filteredNotifications.length;
  const total_pages = Math.ceil(total / size);
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  const items = filteredNotifications.slice(startIndex, endIndex);

  // 읽지 않은 알림 개수
  const unread_count = mockNotifications.filter(n => n.status === 'unread').length;

  return {
    items,
    pagination: {
      total,
      page,
      size,
      total_pages,
      has_next: page < total_pages,
      has_prev: page > 1,
    },
    unread_count,
  };
}

/**
 * 읽지 않은 알림 개수 가져오기
 */
export function getMockUnreadCount(userId?: string): number {
  return mockNotifications.filter(n => n.status === 'unread').length;
}

/**
 * 알림 요약 정보 가져오기
 * TODO(F-008): 실제 API 엔드포인트로 교체 - GET /api/v1/notifications/summary
 */
export async function getMockNotificationSummary(userId?: string): Promise<NotificationSummary> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const unreadNotifications = mockNotifications.filter(n => n.status === 'unread');
  const total_unread = unreadNotifications.length;

  const by_category = {
    schedule: unreadNotifications.filter(n => n.category === 'schedule').length,
    attendance: unreadNotifications.filter(n => n.category === 'attendance').length,
    payment: unreadNotifications.filter(n => n.category === 'payment').length,
    lesson: unreadNotifications.filter(n => n.category === 'lesson').length,
    group: unreadNotifications.filter(n => n.category === 'group').length,
    system: unreadNotifications.filter(n => n.category === 'system').length,
  };

  // 가장 최근 알림
  const sortedNotifications = [...mockNotifications].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latest_notification = sortedNotifications[0];

  return {
    total_unread,
    by_category,
    latest_notification,
  };
}

/**
 * 알림 읽음 처리
 * TODO(F-008): 실제 API 엔드포인트로 교체 - PATCH /api/v1/notifications/{id}/read
 */
export async function markMockNotificationAsRead(notificationId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const notification = mockNotifications.find(n => n.notification_id === notificationId);
  if (notification && notification.status === 'unread') {
    notification.status = 'read';
    notification.read_at = new Date().toISOString();
  }
}

/**
 * 모든 알림 읽음 처리
 * TODO(F-008): 실제 API 엔드포인트로 교체 - POST /api/v1/notifications/read-all
 */
export async function markMockAllNotificationsAsRead(
  category?: NotificationCategory
): Promise<MarkAllReadResponse> {
  await new Promise(resolve => setTimeout(resolve, 300));

  let targetNotifications = mockNotifications.filter(n => n.status === 'unread');

  if (category && category !== 'all') {
    targetNotifications = targetNotifications.filter(n => n.category === category);
  }

  const marked_count = targetNotifications.length;

  // 읽음 처리
  targetNotifications.forEach(n => {
    n.status = 'read';
    n.read_at = new Date().toISOString();
  });

  const remaining_unread = mockNotifications.filter(n => n.status === 'unread').length;

  return {
    marked_count,
    remaining_unread,
  };
}

/**
 * 알림 삭제
 * TODO(F-008): 실제 API 엔드포인트로 교체 - DELETE /api/v1/notifications/{id}
 */
export async function deleteMockNotification(notificationId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const index = mockNotifications.findIndex(n => n.notification_id === notificationId);
  if (index !== -1) {
    mockNotifications.splice(index, 1);
  }
}

/**
 * 테스트용 알림 생성 (개발 환경에서만 사용)
 * TODO(F-008): 실제 API 엔드포인트로 교체 - POST /api/v1/notifications/test
 */
export async function createMockTestNotification(
  type: 'schedule' | 'payment' | 'attendance' | 'lesson'
): Promise<NotificationItem> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const testNotifications: Record<string, Partial<NotificationItem>> = {
    schedule: {
      category: 'schedule',
      type: 'SCHEDULE_REMINDER',
      title: '🔔 테스트 수업 알림',
      message: '테스트 학생 - 테스트 과목 (오후 3시)',
      priority: 'HIGH',
    },
    payment: {
      category: 'payment',
      type: 'BILLING_ISSUED',
      title: '💳 테스트 결제 요청',
      message: '테스트 청구서 100,000원',
      priority: 'CRITICAL',
      is_required: true,
    },
    attendance: {
      category: 'attendance',
      type: 'ATTENDANCE_CHANGED',
      title: '✅ 테스트 출결 알림',
      message: '출결이 변경되었습니다',
      priority: 'NORMAL',
    },
    lesson: {
      category: 'lesson',
      type: 'LESSON_RECORD_CREATED',
      title: '📝 테스트 수업 기록',
      message: '수업 기록이 작성되었습니다',
      priority: 'NORMAL',
    },
  };

  const newNotification: NotificationItem = {
    notification_id: `notif-test-${Date.now()}`,
    status: 'unread',
    created_at: new Date().toISOString(),
    ...testNotifications[type],
  } as NotificationItem;

  mockNotifications.unshift(newNotification);

  return newNotification;
}

/**
 * 헤더 드롭다운용 최근 알림 가져오기 (최대 5개)
 */
export async function getMockRecentNotifications(limit: number = 5): Promise<NotificationItem[]> {
  await new Promise(resolve => setTimeout(resolve, 150));

  const sortedNotifications = [...mockNotifications].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return sortedNotifications.slice(0, limit);
}
