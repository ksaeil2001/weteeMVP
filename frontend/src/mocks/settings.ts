/**
 * Settings Mock Data - WeTee MVP
 * Feature: F-007 기본 프로필 및 설정
 *
 * 목업 데이터 제공:
 * - 사용자 프로필 (UserProfile, FullUserProfile)
 * - 알림 설정 (NotificationSettings)
 * - 계정 설정 (AccountSettings)
 * - 로그인 기록 (LoginHistoryItem)
 * - 앱 설정 (AppSettings)
 */

import type {
  FullUserProfile,
  TeacherProfile,
  StudentProfile,
  NotificationSettings,
  AccountSettings,
  LoginHistoryItem,
  AppSettings,
  NotificationPreference,
  ConnectedDevice,
  AccountDeletionEligibility,
  UserRole,
} from '@/types/settings';

// ============================================================================
// Mock User Profiles
// ============================================================================

/**
 * 선생님 프로필 (선생님 역할)
 */
export const mockTeacherUserProfile: FullUserProfile = {
  user_id: 'user-teacher-001',
  email: 'teacher@wetee.com',
  name: '김선생',
  phone: '010-1234-5678',
  role: 'TEACHER' as UserRole,
  profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher',
  language: 'ko',
  timezone: 'Asia/Seoul',
  is_active: true,
  is_email_verified: true,
  created_at: '2025-01-15T00:00:00Z',
  updated_at: '2025-11-15T09:30:00Z',
  last_login_at: '2025-11-17T08:00:00Z',
  profile: {
    subjects: ['수학', '영어'],
    education: '서울대학교 수학교육과 졸업',
    career_years: 10,
    introduction: '10년 경력의 수학 전문 과외 선생님입니다. 학생 개개인의 수준에 맞춘 맞춤형 수업을 제공합니다.',
    default_hourly_rate: 50000,
  } as TeacherProfile,
};

/**
 * 학생 프로필 (학생 역할)
 */
export const mockStudentUserProfile: FullUserProfile = {
  user_id: 'user-student-001',
  email: 'student@wetee.com',
  name: '최학생',
  phone: '010-2345-6789',
  role: 'STUDENT' as UserRole,
  profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student',
  language: 'ko',
  timezone: 'Asia/Seoul',
  is_active: true,
  is_email_verified: true,
  created_at: '2025-02-01T00:00:00Z',
  updated_at: '2025-11-10T14:20:00Z',
  last_login_at: '2025-11-17T07:30:00Z',
  profile: {
    school_name: '서울고등학교',
    grade: 2,
    birth_date: '2007-05-15',
    parent_id: 'user-parent-001',
  } as StudentProfile,
};

/**
 * 학부모 프로필 (학부모 역할)
 */
export const mockParentUserProfile: FullUserProfile = {
  user_id: 'user-parent-001',
  email: 'parent@wetee.com',
  name: '박학부모',
  phone: '010-3456-7890',
  role: 'PARENT' as UserRole,
  profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=parent',
  language: 'ko',
  timezone: 'Asia/Seoul',
  is_active: true,
  is_email_verified: true,
  created_at: '2025-02-01T00:00:00Z',
  updated_at: '2025-11-12T10:00:00Z',
  last_login_at: '2025-11-16T20:00:00Z',
  profile: {},
};

// ============================================================================
// Mock Notification Settings
// ============================================================================

/**
 * 기본 알림 설정 (모두 활성화)
 */
export const mockNotificationSettings: NotificationSettings = {
  push_enabled: true,
  email_enabled: false,
  notification_categories: {
    schedule: true,
    attendance: true,
    payment: true,
    group: true,
  },
  night_mode_enabled: false,
  night_mode_start: '22:00',
  night_mode_end: '07:00',
  theme: 'auto',
  default_screen: null,
  updated_at: '2025-11-10T12:00:00Z',
};

/**
 * 야간 알림 제한 활성화된 설정
 */
export const mockNotificationSettingsWithNightMode: NotificationSettings = {
  push_enabled: true,
  email_enabled: true,
  notification_categories: {
    schedule: true,
    attendance: false,
    payment: true,
    group: true,
  },
  night_mode_enabled: true,
  night_mode_start: '22:00',
  night_mode_end: '08:00',
  theme: 'light',
  default_screen: 'home',
  updated_at: '2025-11-15T18:00:00Z',
};

/**
 * 알림 선호도 목록 (UI 표시용)
 */
export const mockNotificationPreferences: NotificationPreference[] = [
  {
    event_type: 'LESSON_REMINDER',
    label: '수업 리마인더',
    description: '수업 1시간 전 알림',
    enabled: true,
    channels: ['PUSH', 'EMAIL'],
    can_disable: true,
  },
  {
    event_type: 'LESSON_RECORD',
    label: '수업 기록 업데이트',
    description: '선생님이 수업 기록을 작성하면 알림',
    enabled: true,
    channels: ['PUSH'],
    can_disable: true,
  },
  {
    event_type: 'ATTENDANCE_CHANGE',
    label: '출결 변동 알림',
    description: '출결 수정 시 알림',
    enabled: true,
    channels: ['PUSH'],
    can_disable: true,
  },
  {
    event_type: 'PAYMENT_REQUEST',
    label: '결제 요청 알림',
    description: '청구서 발행 시 알림',
    enabled: true,
    channels: ['PUSH', 'EMAIL', 'SMS'],
    can_disable: false, // 정산 알림은 끌 수 없음
  },
  {
    event_type: 'PAYMENT_COMPLETE',
    label: '결제 완료 알림',
    description: '결제 완료 시 알림',
    enabled: true,
    channels: ['PUSH', 'EMAIL'],
    can_disable: false,
  },
  {
    event_type: 'GROUP_INVITE',
    label: '그룹 초대 알림',
    description: '새로운 그룹에 초대되면 알림',
    enabled: true,
    channels: ['PUSH', 'EMAIL'],
    can_disable: true,
  },
];

// ============================================================================
// Mock Account Settings
// ============================================================================

export const mockAccountSettings: AccountSettings = {
  email: 'teacher@wetee.com',
  role: 'TEACHER' as UserRole,
  created_at: '2025-01-15T00:00:00Z',
  last_login_at: '2025-11-17T08:00:00Z',
};

// ============================================================================
// Mock Login History
// ============================================================================

/**
 * 로그인 기록 목록
 */
export const mockLoginHistory: LoginHistoryItem[] = [
  {
    login_id: 'login-001',
    login_at: '2025-11-17T08:00:00Z',
    ip_address: '121.xxx.xxx.23',
    device_info: {
      device_type: 'mobile',
      os: 'iOS',
      os_version: '17.1',
      app_version: '1.0.0',
    },
    location: '서울 강남구, 대한민국',
    login_method: 'email',
    is_current_session: true,
  },
  {
    login_id: 'login-002',
    login_at: '2025-11-16T14:30:00Z',
    ip_address: '121.xxx.xxx.23',
    device_info: {
      device_type: 'mobile',
      os: 'iOS',
      os_version: '17.1',
      app_version: '1.0.0',
    },
    location: '서울 강남구, 대한민국',
    login_method: 'email',
    is_current_session: false,
  },
  {
    login_id: 'login-003',
    login_at: '2025-11-15T09:15:00Z',
    ip_address: '121.xxx.xxx.23',
    device_info: {
      device_type: 'tablet',
      os: 'Android',
      os_version: '13',
      browser: 'Chrome',
    },
    location: '서울 강남구, 대한민국',
    login_method: 'google',
    is_current_session: false,
  },
  {
    login_id: 'login-004',
    login_at: '2025-11-14T20:45:00Z',
    ip_address: '203.xxx.xxx.45',
    device_info: {
      device_type: 'desktop',
      os: 'Windows',
      os_version: '11',
      browser: 'Chrome',
    },
    location: '부산 해운대구, 대한민국',
    login_method: 'email',
    is_current_session: false,
  },
  {
    login_id: 'login-005',
    login_at: '2025-11-13T07:30:00Z',
    ip_address: '121.xxx.xxx.23',
    device_info: {
      device_type: 'mobile',
      os: 'iOS',
      os_version: '17.1',
      app_version: '1.0.0',
    },
    location: '서울 강남구, 대한민국',
    login_method: 'email',
    is_current_session: false,
  },
];

// ============================================================================
// Mock Connected Devices
// ============================================================================

export const mockConnectedDevices: ConnectedDevice[] = [
  {
    session_id: 'session-001',
    device_info: {
      device_type: 'mobile',
      os: 'iOS',
      os_version: '17.1',
      app_version: '1.0.0',
    },
    last_accessed_at: '2025-11-17T08:00:00Z',
    ip_address: '121.xxx.xxx.23',
    location: '서울 강남구',
    is_current: true,
  },
  {
    session_id: 'session-002',
    device_info: {
      device_type: 'tablet',
      os: 'Android',
      os_version: '13',
      browser: 'Chrome',
    },
    last_accessed_at: '2025-11-15T09:15:00Z',
    ip_address: '121.xxx.xxx.24',
    location: '서울 강남구',
    is_current: false,
  },
];

// ============================================================================
// Mock App Settings
// ============================================================================

export const mockAppSettings: AppSettings = {
  language: 'ko',
  theme: 'auto',
  default_screen: 'home',
};

// ============================================================================
// Mock Account Deletion Eligibility
// ============================================================================

/**
 * 탈퇴 가능한 계정
 */
export const mockAccountDeletionEligible: AccountDeletionEligibility = {
  can_delete: true,
  blockers: [],
};

/**
 * 미결제 수업료로 인해 탈퇴 불가능한 계정
 */
export const mockAccountDeletionBlocked: AccountDeletionEligibility = {
  can_delete: false,
  blockers: [
    {
      type: 'UNPAID_INVOICE',
      message: '미결제 수업료가 남아있습니다. 정산을 완료한 후 탈퇴해주세요.',
      count: 1,
    },
  ],
};

/**
 * 활성 그룹으로 인해 탈퇴 불가능한 계정 (선생님)
 */
export const mockAccountDeletionBlockedByGroup: AccountDeletionEligibility = {
  can_delete: false,
  blockers: [
    {
      type: 'ACTIVE_GROUP',
      message: '진행 중인 과외 그룹이 있습니다. 그룹을 종료하거나 다른 선생님에게 인계한 후 탈퇴해주세요.',
      count: 2,
    },
  ],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 역할별 사용자 프로필 가져오기
 */
export function getMockUserProfileByRole(role: UserRole): FullUserProfile {
  switch (role) {
    case 'TEACHER':
      return mockTeacherUserProfile;
    case 'STUDENT':
      return mockStudentUserProfile;
    case 'PARENT':
      return mockParentUserProfile;
    default:
      return mockTeacherUserProfile;
  }
}

/**
 * 사용자 ID로 프로필 가져오기
 */
export function getMockUserProfileById(userId: string): FullUserProfile | null {
  if (userId === mockTeacherUserProfile.user_id) return mockTeacherUserProfile;
  if (userId === mockStudentUserProfile.user_id) return mockStudentUserProfile;
  if (userId === mockParentUserProfile.user_id) return mockParentUserProfile;
  return null;
}

/**
 * 알림 설정 가져오기 (사용자 ID)
 */
export function getMockNotificationSettings(userId: string): NotificationSettings {
  // 실제로는 userId에 따라 다른 설정을 반환할 수 있음
  return mockNotificationSettings;
}

/**
 * 로그인 기록 가져오기 (페이지네이션)
 */
export function getMockLoginHistory(page: number = 1, size: number = 20) {
  const start = (page - 1) * size;
  const end = start + size;
  const items = mockLoginHistory.slice(start, end);

  return {
    items,
    pagination: {
      total: mockLoginHistory.length,
      page,
      size,
      total_pages: Math.ceil(mockLoginHistory.length / size),
    },
  };
}

/**
 * 계정 탈퇴 가능 여부 확인
 */
export function checkAccountDeletionEligibility(
  userId: string,
  role: UserRole
): AccountDeletionEligibility {
  // 목업: 선생님인 경우 활성 그룹 체크
  if (role === 'TEACHER') {
    return mockAccountDeletionBlockedByGroup;
  }

  // 목업: 학부모인 경우 미결제 체크
  if (role === 'PARENT') {
    return mockAccountDeletionBlocked;
  }

  // 학생은 언제든 탈퇴 가능
  return mockAccountDeletionEligible;
}

/**
 * 프로필 이미지 URL 생성 (DiceBear API 사용)
 */
export function generateMockProfileImageUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
}

/**
 * 기본 프로필 생성 헬퍼
 */
export function createMockUserProfile(
  overrides: Partial<FullUserProfile> = {}
): FullUserProfile {
  return {
    ...mockTeacherUserProfile,
    ...overrides,
  };
}
