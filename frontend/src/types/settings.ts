// F-007: 기본 프로필 및 설정 타입 정의
// Related Documents:
// - F-007_기본_프로필_및_설정.md
// - API_명세서.md (6.7 F-007 섹션)
// - 데이터베이스_설계서.md (users, settings 테이블)

import { UserRoleCode } from './auth';

// Type alias for consistency with existing codebase
export type UserRole = UserRoleCode;

// ============================================================================
// 프로필 관련 타입
// ============================================================================

/**
 * 사용자 기본 프로필
 * DB: users 테이블 기본 필드
 */
export type UserProfile = {
  user_id: string;
  email: string; // 읽기 전용
  name: string;
  phone: string | null;
  role: UserRole;
  profile_image_url: string | null;
  language: 'ko' | 'en' | 'ja';
  timezone: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

/**
 * 선생님 추가 프로필 정보
 * DB: teachers 테이블
 */
export type TeacherProfile = {
  subjects: string[]; // 가르치는 과목들
  education: string | null; // 학력
  career_years: number | null; // 경력 (년)
  introduction: string | null; // 자기소개
  default_hourly_rate: number | null; // 기본 시간당 수업료
};

/**
 * 학생 추가 프로필 정보
 * DB: students 테이블
 */
export type StudentProfile = {
  school_name: string | null;
  grade: number | null;
  birth_date: string | null;
  parent_id: string | null;
};

/**
 * 학부모 추가 프로필 정보
 * DB: parents 테이블
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ParentProfile = {
  // 향후 확장 가능
};

/**
 * 전체 사용자 프로필 (역할별 확장 포함)
 * API: GET /api/v1/users/me 응답
 */
export type FullUserProfile = UserProfile & {
  profile?: TeacherProfile | StudentProfile | ParentProfile;
};

/**
 * 프로필 수정 요청 페이로드
 * API: PATCH /api/v1/users/me
 */
export type UpdateUserProfilePayload = {
  name?: string;
  phone?: string | null;
  profile?: Partial<TeacherProfile | StudentProfile | ParentProfile>;
};

/**
 * 프로필 사진 업로드 응답
 * API: POST /api/v1/users/me/profile-image
 */
export type ProfileImageUploadResponse = {
  profile_image_url: string;
  uploaded_at: string;
};

// ============================================================================
// 계정 설정 관련 타입
// ============================================================================

/**
 * 계정 설정 정보
 */
export type AccountSettings = {
  email: string; // 읽기 전용
  role: UserRole; // 읽기 전용
  created_at: string;
  last_login_at: string | null;
};

/**
 * 비밀번호 변경 요청
 * API: POST /api/v1/users/me/change-password
 */
export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

/**
 * 비밀번호 변경 응답
 */
export type ChangePasswordResponse = {
  message: string;
  changed_at: string;
};

/**
 * 비밀번호 검증 규칙
 * F-007 비즈니스 규칙 참조
 */
export type PasswordValidation = {
  minLength: boolean; // 최소 8자
  hasUppercase: boolean; // 대문자 포함
  hasNumber: boolean; // 숫자 포함
  hasSpecialChar: boolean; // 특수문자 포함
  isValid: boolean; // 전체 검증 통과 여부
};

// ============================================================================
// 알림 설정 관련 타입
// ============================================================================

/**
 * 알림 채널
 */
export type NotificationChannel = 'EMAIL' | 'PUSH' | 'SMS';

/**
 * 알림 이벤트 타입
 * F-007, F-008 기능 명세서 참조
 */
export type NotificationEventType =
  | 'LESSON_REMINDER' // 수업 리마인더
  | 'LESSON_RECORD' // 수업 기록 업데이트
  | 'ATTENDANCE_CHANGE' // 출결 변동
  | 'PAYMENT_REQUEST' // 결제 요청
  | 'PAYMENT_COMPLETE' // 결제 완료
  | 'PAYMENT_FAILED' // 결제 실패
  | 'GROUP_INVITE' // 그룹 초대
  | 'SCHEDULE_CHANGE'; // 일정 변경

/**
 * 알림 설정
 * DB: settings 테이블
 * API: GET /api/v1/users/me/settings
 *
 * Note: 백엔드 스키마에 맞춰 구조 변경
 * - notification_categories로 카테고리별 알림 관리
 * - push_enabled, email_enabled로 채널별 제어
 */
export type NotificationSettings = {
  // 채널별 알림 설정
  push_enabled: boolean;
  email_enabled: boolean;

  // 카테고리별 알림 설정
  notification_categories: {
    schedule: boolean;    // 일정 알림
    attendance: boolean;  // 출결 알림
    payment: boolean;     // 정산 알림 (끌 수 없음)
    group: boolean;       // 그룹 알림
  };

  // 야간 알림 제한 (F-008)
  night_mode_enabled: boolean;
  night_mode_start: string; // HH:mm 형식 (예: "22:00")
  night_mode_end: string; // HH:mm 형식 (예: "08:00")

  // 앱 설정
  theme: 'light' | 'dark' | 'auto';
  default_screen: string | null;

  updated_at: string | null;
};

/**
 * 알림 설정 수정 요청
 * API: PATCH /api/v1/users/me/settings
 */
export type UpdateNotificationSettingsPayload = Partial<
  Omit<NotificationSettings, 'updated_at'>
>;

/**
 * 알림 선호도 (UI용)
 * 이벤트별 + 채널별 조합
 */
export type NotificationPreference = {
  event_type: NotificationEventType;
  label: string;
  description: string;
  enabled: boolean;
  channels: NotificationChannel[];
  can_disable: boolean; // 끌 수 있는지 여부 (정산 알림은 false)
};

// ============================================================================
// 로그인 기록 관련 타입
// ============================================================================

/**
 * 기기 정보
 */
export type DeviceInfo = {
  device_type: 'mobile' | 'tablet' | 'desktop';
  os: string; // 'iOS', 'Android', 'Windows', etc.
  os_version?: string;
  browser?: string;
  app_version?: string;
};

/**
 * 로그인 기록 아이템
 * API: GET /api/v1/users/me/login-history
 */
export type LoginHistoryItem = {
  login_id: string;
  login_at: string;
  ip_address: string; // 일부 마스킹된 IP (예: "121.xxx.xxx.23")
  device_info: DeviceInfo;
  location: string | null; // 도시 단위 (예: "서울, 대한민국")
  login_method?: 'email' | 'google' | 'kakao';
  is_current_session?: boolean; // 현재 세션인지 여부
};

/**
 * 로그인 기록 응답
 */
export type LoginHistoryResponse = {
  items: LoginHistoryItem[];
  pagination: {
    total: number;
    page: number;
    size: number;
    total_pages: number;
  };
};

// ============================================================================
// 보안 설정 관련 타입
// ============================================================================

/**
 * 연결된 기기 (세션)
 */
export type ConnectedDevice = {
  session_id: string;
  device_info: DeviceInfo;
  last_accessed_at: string;
  ip_address: string;
  location: string | null;
  is_current: boolean;
};

/**
 * 2단계 인증 설정 (2단계 기능)
 */
export type TwoFactorAuthSettings = {
  enabled: boolean;
  method?: 'sms' | 'email' | 'app';
  last_verified_at?: string;
};

// ============================================================================
// 앱 설정 관련 타입
// ============================================================================

/**
 * 언어 설정
 */
export type Language = 'ko' | 'en' | 'ja';

/**
 * 언어 옵션
 */
export type LanguageOption = {
  code: Language;
  label: string;
  nativeLabel: string;
};

/**
 * 테마 설정
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * 기본 화면 설정
 */
export type DefaultScreen = 'home' | 'schedule' | 'progress' | 'billing';

/**
 * 앱 설정
 */
export type AppSettings = {
  language: Language;
  theme: Theme;
  default_screen: DefaultScreen;
};

// ============================================================================
// 계정 탈퇴 관련 타입
// ============================================================================

/**
 * 계정 탈퇴 요청
 */
export type DeleteAccountPayload = {
  password: string; // 본인 확인용
  reason?: string; // 탈퇴 사유 (선택)
  confirmed: boolean; // 확인 체크박스
};

/**
 * 계정 탈퇴 가능 여부 확인
 */
export type AccountDeletionEligibility = {
  can_delete: boolean;
  blockers: {
    type: 'UNPAID_INVOICE' | 'ACTIVE_GROUP' | 'PENDING_TRANSACTION';
    message: string;
    count?: number;
  }[];
};

// ============================================================================
// 통합 설정 타입
// ============================================================================

/**
 * 전체 설정 (통합)
 */
export type Settings = {
  user_profile: FullUserProfile;
  notification_settings: NotificationSettings;
  app_settings: AppSettings;
  two_factor_auth?: TwoFactorAuthSettings;
};

/**
 * 설정 수정 페이로드 (통합)
 */
export type UpdateSettingsPayload = {
  profile?: UpdateUserProfilePayload;
  notifications?: UpdateNotificationSettingsPayload;
  app?: Partial<AppSettings>;
};

// ============================================================================
// UI 상태 관련 타입
// ============================================================================

/**
 * 프로필 수정 모드
 */
export type ProfileEditMode = 'view' | 'edit';

/**
 * 설정 섹션
 */
export type SettingsSection =
  | 'profile'
  | 'account'
  | 'notifications'
  | 'security'
  | 'app'
  | 'about';

/**
 * 프로필 사진 업로드 상태
 */
export type ProfileImageUploadState = {
  uploading: boolean;
  progress: number; // 0-100
  error: string | null;
  preview_url: string | null;
};

// ============================================================================
// 상수
// ============================================================================

/**
 * 언어 옵션 목록
 */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'ko', label: '한국어', nativeLabel: '한국어' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ja', label: '日本語', nativeLabel: '日本語' },
];

/**
 * 테마 옵션 목록
 */
export const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'auto', label: '자동 (시스템 설정 따름)' },
];

/**
 * 기본 화면 옵션
 */
export const DEFAULT_SCREEN_OPTIONS: {
  value: DefaultScreen;
  label: string;
  description: string;
}[] = [
  { value: 'home', label: '홈', description: '오늘의 수업 및 일정' },
  { value: 'schedule', label: '일정', description: '월간 일정 캘린더' },
  { value: 'progress', label: '진도', description: '수업 기록 및 진도' },
  { value: 'billing', label: '정산', description: '수업료 정산' },
];

/**
 * 비밀번호 검증 규칙 기본값
 */
export const DEFAULT_PASSWORD_VALIDATION: PasswordValidation = {
  minLength: false,
  hasUppercase: false,
  hasNumber: false,
  hasSpecialChar: false,
  isValid: false,
};

// ============================================================================
// 설정 섹션 UI 타입
// ============================================================================

/**
 * 설정 섹션 메타데이터 (UI용)
 */
export interface SettingsSectionMeta {
  id: string;
  title: string;
  description: string;
}

/**
 * 설정 토글 옵션 (UI용)
 */
export interface SettingsToggleOption {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
}

/**
 * 설정 섹션 카드 정보 (UI용)
 */
export interface SettingsSectionCardInfo {
  id: string;
  title: string;
  description: string;
  options: SettingsToggleOption[];
}
