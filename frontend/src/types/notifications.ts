// Step 9: 알림 관리 타입 기본 정의
// TODO: 현재는 mock 데이터 및 UI 레벨에서만 사용, 추후 API 타입으로 확장 예정

/**
 * 알림 카테고리 (유형)
 * - payment: 정산 관련 알림
 * - attendance: 출결 관련 알림
 * - schedule: 일정 관련 알림
 * - system: 시스템 공지/알림
 */
export type NotificationCategory = 'payment' | 'attendance' | 'schedule' | 'system';

/**
 * 알림 상태
 * - unread: 읽지 않음
 * - read: 읽음
 */
export type NotificationStatus = 'unread' | 'read';

/**
 * 알림 요약 집계 데이터
 */
export interface NotificationSummaryCounts {
  totalCount: number;   // 전체 알림 개수
  unreadCount: number;  // 읽지 않은 알림 개수
  readCount: number;    // 읽은 알림 개수
}

/**
 * 알림 항목 (개별 알림)
 */
export interface NotificationItem {
  id: string;
  createdAt: string;          // 'YYYY-MM-DDTHH:mm:ssZ' 또는 ISO 문자열
  title: string;              // 알림 제목
  message: string;            // 알림 내용 본문
  category: NotificationCategory;  // 알림 유형
  status: NotificationStatus;      // 읽음/읽지 않음
  relatedStudentName?: string;     // 관련 학생명(있을 경우)
  relatedGroupName?: string;       // 관련 그룹/수업명(있을 경우)
}

// TODO:
// - NotificationFilterOptions (카테고리/상태/기간별 필터링 옵션)
// - NotificationListResponse (pagination 지원 응답 타입)
// - NotificationSettings (알림 설정: 이메일/앱 푸시 등)
