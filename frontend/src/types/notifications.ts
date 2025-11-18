// F-008: 필수 알림 시스템 타입 정의
// Screen ID: S-041 (알림 센터), S-042 (알림 상세), S-043 (푸시 알림)
// Reference: F-008_필수_알림_시스템.md, API_명세서.md 섹션 6.8

/**
 * 알림 타입 (NotificationType)
 * F-008에서 정의한 알림 종류
 */
export type NotificationType =
  | 'SCHEDULE_REMINDER'      // 수업 리마인더 (1시간 전)
  | 'SCHEDULE_CHANGED'       // 일정 변경
  | 'SCHEDULE_CANCELLED'     // 일정 취소
  | 'ATTENDANCE_CHANGED'     // 출결 변동 (결석/지각)
  | 'LESSON_RECORD_CREATED'  // 수업 기록 작성
  | 'HOMEWORK_ASSIGNED'      // 숙제 등록
  | 'MAKEUP_CLASS_AVAILABLE' // 보강 시간 오픈
  | 'MAKEUP_CLASS_REQUESTED' // 보강 신청
  | 'BILLING_ISSUED'         // 청구서 발행
  | 'PAYMENT_CONFIRMED'      // 결제 완료
  | 'PAYMENT_FAILED'         // 결제 실패
  | 'GROUP_INVITE'           // 그룹 초대
  | 'SYSTEM_NOTICE';         // 시스템 공지

/**
 * 알림 카테고리 (API response의 category 필드)
 * 필터링 및 탭 구분용
 */
export type NotificationCategory =
  | 'all'        // 전체
  | 'schedule'   // 수업/일정
  | 'attendance' // 출결
  | 'payment'    // 정산
  | 'lesson'     // 수업 기록
  | 'group'      // 그룹
  | 'system';    // 시스템

/**
 * 알림 채널
 * F-008: 현재 IN_APP만 구현, 나머지는 2단계
 */
export type NotificationChannel =
  | 'IN_APP'  // 앱 내 알림 (MVP)
  | 'EMAIL'   // 이메일 (2단계)
  | 'SMS'     // SMS (2단계)
  | 'PUSH';   // 푸시 알림 (2단계)

/**
 * 알림 우선순위
 * F-008: 정산 > 수업 리마인더 > 출결 > 수업 기록 > 보강
 */
export type NotificationPriority =
  | 'CRITICAL'  // 정산 알림 (필수, 끌 수 없음)
  | 'HIGH'      // 수업 리마인더
  | 'NORMAL'    // 출결 변동, 수업 기록
  | 'LOW';      // 보강 오픈

/**
 * 알림 상태
 */
export type NotificationStatus =
  | 'unread'  // 읽지 않음
  | 'read';   // 읽음

/**
 * 알림 전송 상태 (시스템 내부용, UI에서는 표시 안 함)
 */
export type NotificationDeliveryStatus =
  | 'PENDING'  // 발송 대기
  | 'SENT'     // 발송 완료
  | 'FAILED'   // 발송 실패
  | 'READ';    // 읽음

/**
 * 관련 리소스 타입
 */
export interface RelatedResource {
  type: 'schedule' | 'attendance' | 'lesson' | 'payment' | 'group' | 'student';
  id: string;
}

/**
 * 알림 항목 (NotificationItem)
 * API 응답 구조와 일치
 */
export interface NotificationItem {
  notification_id: string;              // 알림 ID (UUID)
  category: NotificationCategory;       // 카테고리
  type?: NotificationType;              // 세부 타입 (선택)
  title: string;                        // 알림 제목 (예: "🔔 1시간 후 수업")
  message: string;                      // 알림 내용 (예: "최학생 - 수학 (오후 3시)")
  status: NotificationStatus;           // 읽음/안 읽음
  priority?: NotificationPriority;      // 우선순위
  created_at: string;                   // 생성 시간 (ISO 8601)
  read_at?: string;                     // 읽은 시간 (ISO 8601, nullable)
  related_resource?: RelatedResource;   // 관련 리소스 (클릭 시 이동)
  is_required?: boolean;                // 필수 알림 여부 (끌 수 없음)
}

/**
 * 알림 목록 응답 (Pagination 포함)
 */
export interface NotificationListResponse {
  items: NotificationItem[];
  pagination: {
    total: number;        // 전체 알림 개수
    page: number;         // 현재 페이지 (1부터 시작)
    size: number;         // 페이지 크기
    total_pages: number;  // 전체 페이지 수
    has_next?: boolean;   // 다음 페이지 존재 여부
    has_prev?: boolean;   // 이전 페이지 존재 여부
  };
  unread_count: number;  // 읽지 않은 알림 개수
}

/**
 * 알림 필터 옵션
 */
export interface NotificationFilter {
  category?: NotificationCategory;  // 카테고리 필터
  status?: 'all' | NotificationStatus;  // 상태 필터
  page?: number;        // 페이지 번호 (기본: 1)
  size?: number;        // 페이지 크기 (기본: 20)
  start_date?: string;  // 시작 날짜 (YYYY-MM-DD)
  end_date?: string;    // 종료 날짜 (YYYY-MM-DD)
}

/**
 * 알림 요약 (Summary)
 * 읽지 않은 알림 수, 카테고리별 카운트
 */
export interface NotificationSummary {
  total_unread: number;  // 전체 읽지 않은 개수
  by_category: {
    schedule: number;
    attendance: number;
    payment: number;
    lesson: number;
    group: number;
    system: number;
  };
  latest_notification?: NotificationItem;  // 가장 최근 알림
}

/**
 * 알림 채널 설정 (F-007 연계)
 * 현재는 IN_APP만 사용
 */
export interface NotificationChannelSetting {
  channel: NotificationChannel;
  enabled: boolean;
}

/**
 * 일괄 읽음 처리 응답
 */
export interface MarkAllReadResponse {
  marked_count: number;        // 읽음 처리된 개수
  remaining_unread: number;    // 남은 읽지 않은 개수
}

/**
 * FCM 토큰 등록 요청
 */
export interface FCMTokenRequest {
  fcm_token: string;
  device_info?: {
    device_type: 'mobile' | 'web';
    os: 'iOS' | 'Android' | 'Web';
    app_version: string;
  };
}

/**
 * FCM 토큰 등록 응답
 */
export interface FCMTokenResponse {
  token_id: string;
  registered_at: string;
}

/**
 * 알림 아이콘 맵핑
 * UI에서 카테고리별 아이콘 표시용
 */
export const NOTIFICATION_ICON_MAP: Record<NotificationCategory, string> = {
  all: '🔔',
  schedule: '📅',
  attendance: '✅',
  payment: '💳',
  lesson: '📝',
  group: '👥',
  system: 'ℹ️',
};

/**
 * 알림 색상 맵핑
 * 우선순위별 색상 (Tailwind CSS 클래스)
 */
export const NOTIFICATION_COLOR_MAP: Record<NotificationPriority, string> = {
  CRITICAL: 'text-red-600 bg-red-50 border-red-200',
  HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
  NORMAL: 'text-blue-600 bg-blue-50 border-blue-200',
  LOW: 'text-gray-600 bg-gray-50 border-gray-200',
};

// 알림 요약 정보
export interface NotificationSummaryCounts {
  totalCount: number;
  unreadCount: number;
  readCount: number;
}
