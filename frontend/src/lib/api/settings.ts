/**
 * Settings API Client - WeTee MVP
 * Feature: F-007 기본 프로필 및 설정
 *
 * TODO(F-007): FastAPI /api/v1/users/me 엔드포인트와 실제 연동
 * 현재는 목업 데이터를 사용합니다.
 */

import type {
  FullUserProfile,
  UpdateUserProfilePayload,
  ProfileImageUploadResponse,
  NotificationSettings,
  UpdateNotificationSettingsPayload,
  ChangePasswordPayload,
  ChangePasswordResponse,
  LoginHistoryResponse,
  ConnectedDevice,
  AccountDeletionEligibility,
  DeleteAccountPayload,
  AppSettings,
} from '@/types/settings';
import { UserRole } from '@/types/auth';

import {
  getMockUserProfileByRole,
  getMockUserProfileById,
  getMockNotificationSettings,
  mockNotificationSettingsWithNightMode,
  getMockLoginHistory,
  mockConnectedDevices,
  checkAccountDeletionEligibility,
  mockAppSettings,
} from '@/mocks/settings';

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// 프로필 관련 API
// ============================================================================

/**
 * 현재 사용자 프로필 조회 (S-034: 프로필 화면, S-035: 프로필 수정 화면)
 *
 * @returns 현재 로그인한 사용자의 전체 프로필
 */
export async function fetchUserProfile(): Promise<FullUserProfile> {
  // TODO(F-007): GET /api/v1/users/me
  // Authorization: Bearer <access_token>
  await delay(300);

  // 목업: 현재 로그인한 사용자 정보 가져오기 (실제로는 토큰에서 추출)
  // 여기서는 기본적으로 선생님 프로필을 반환
  const role: UserRole = 'TEACHER'; // 실제로는 auth context에서 가져옴
  return getMockUserProfileByRole(role);
}

/**
 * 사용자 프로필 수정 (S-035: 프로필 수정 화면)
 *
 * @param payload - 수정할 프로필 데이터
 * @returns 수정된 프로필
 */
export async function updateUserProfile(
  payload: UpdateUserProfilePayload
): Promise<FullUserProfile> {
  // TODO(F-007): PATCH /api/v1/users/me
  // Authorization: Bearer <access_token>
  // Request Body: payload
  await delay(500);

  // 목업: 기존 프로필에 변경사항 적용
  const currentProfile = await fetchUserProfile();
  const updatedProfile: FullUserProfile = {
    ...currentProfile,
    ...payload,
    updated_at: new Date().toISOString(),
  };

  return updatedProfile;
}

/**
 * 프로필 사진 업로드 (S-035: 프로필 수정 화면)
 *
 * @param file - 업로드할 이미지 파일
 * @returns 업로드된 이미지 URL
 */
export async function uploadProfileImage(
  file: File
): Promise<ProfileImageUploadResponse> {
  // TODO(F-007): POST /api/v1/users/me/profile-image
  // Content-Type: multipart/form-data
  // Request: file
  await delay(1000); // 업로드 시뮬레이션

  // 목업: 업로드 후 URL 반환 (실제로는 S3 등에 업로드)
  const mockUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;

  return {
    profile_image_url: mockUrl,
    uploaded_at: new Date().toISOString(),
  };
}

// ============================================================================
// 알림 설정 관련 API
// ============================================================================

/**
 * 알림 설정 조회 (S-037: 알림 설정 화면)
 *
 * @returns 현재 사용자의 알림 설정
 */
export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  // TODO(F-007): GET /api/v1/users/me/notification-settings
  // Authorization: Bearer <access_token>
  await delay(300);

  // 목업: 사용자 ID에 따른 알림 설정 반환
  const userId = 'user-teacher-001'; // 실제로는 auth context에서
  return getMockNotificationSettings(userId);
}

/**
 * 알림 설정 변경 (S-037: 알림 설정 화면)
 *
 * @param payload - 변경할 알림 설정
 * @returns 변경된 알림 설정
 */
export async function updateNotificationSettings(
  payload: UpdateNotificationSettingsPayload
): Promise<NotificationSettings> {
  // TODO(F-007): PATCH /api/v1/users/me/notification-settings
  // Authorization: Bearer <access_token>
  // Request Body: payload
  await delay(400);

  // 목업: 기존 설정에 변경사항 적용
  const currentSettings = await fetchNotificationSettings();
  const updatedSettings: NotificationSettings = {
    ...currentSettings,
    ...payload,
    updated_at: new Date().toISOString(),
  };

  return updatedSettings;
}

// ============================================================================
// 보안 설정 관련 API
// ============================================================================

/**
 * 비밀번호 변경 (S-038: 보안 설정 화면)
 *
 * @param payload - 현재 비밀번호와 새 비밀번호
 * @returns 비밀번호 변경 결과
 */
export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> {
  // TODO(F-007): POST /api/v1/users/me/change-password
  // Authorization: Bearer <access_token>
  // Request Body: { current_password, new_password }
  await delay(600);

  // 목업: 비밀번호 변경 성공
  // 실제로는 현재 비밀번호 검증 후 새 비밀번호로 변경
  return {
    message: '비밀번호가 성공적으로 변경되었습니다.',
    changed_at: new Date().toISOString(),
  };
}

/**
 * 로그인 기록 조회 (S-039: 로그인 기록 화면, 선생님 전용)
 *
 * @param params.page - 페이지 번호 (기본 1)
 * @param params.size - 페이지 크기 (기본 20)
 * @returns 로그인 기록 목록
 */
export async function fetchLoginHistory(params: {
  page?: number;
  size?: number;
}): Promise<LoginHistoryResponse> {
  // TODO(F-007): GET /api/v1/users/me/login-history?page={page}&size={size}
  // Authorization: Bearer <access_token>
  await delay(400);

  const { page = 1, size = 20 } = params;
  return getMockLoginHistory(page, size);
}

/**
 * 의심스러운 로그인 신고 (S-039: 로그인 기록 화면)
 *
 * @param loginId - 신고할 로그인 ID
 * @returns 신고 처리 결과
 */
export async function reportSuspiciousLogin(loginId: string): Promise<{
  message: string;
  reported_at: string;
}> {
  // TODO(F-007): POST /api/v1/users/me/login-history/{loginId}/report
  // Authorization: Bearer <access_token>
  await delay(400);

  return {
    message: '의심스러운 로그인이 신고되었습니다. 비밀번호를 변경해주세요.',
    reported_at: new Date().toISOString(),
  };
}

/**
 * 연결된 기기 목록 조회 (S-038: 보안 설정 화면)
 *
 * @returns 현재 로그인된 모든 기기 목록
 */
export async function fetchConnectedDevices(): Promise<ConnectedDevice[]> {
  // TODO(F-007): GET /api/v1/users/me/sessions
  // Authorization: Bearer <access_token>
  await delay(300);

  return mockConnectedDevices;
}

/**
 * 특정 기기 로그아웃 (S-038: 보안 설정 화면)
 *
 * @param sessionId - 로그아웃할 세션 ID
 */
export async function logoutDevice(sessionId: string): Promise<void> {
  // TODO(F-007): DELETE /api/v1/users/me/sessions/{sessionId}
  // Authorization: Bearer <access_token>
  await delay(400);

  // 목업: 세션 제거 성공
  console.log(`Session ${sessionId} logged out successfully`);
}

/**
 * 모든 기기 로그아웃 (S-038: 보안 설정 화면)
 *
 * @param currentPassword - 본인 확인용 비밀번호
 */
export async function logoutAllDevices(currentPassword: string): Promise<void> {
  // TODO(F-007): DELETE /api/v1/users/me/sessions/all
  // Authorization: Bearer <access_token>
  // Request Body: { password }
  await delay(600);

  // 목업: 모든 세션 제거 성공
  console.log('All devices logged out successfully');
}

// ============================================================================
// 계정 탈퇴 관련 API
// ============================================================================

/**
 * 계정 탈퇴 가능 여부 확인 (S-040: 계정 탈퇴 화면)
 *
 * @returns 탈퇴 가능 여부 및 차단 사유
 */
export async function checkAccountDeletion(): Promise<AccountDeletionEligibility> {
  // TODO(F-007): GET /api/v1/users/me/deletion-eligibility
  // Authorization: Bearer <access_token>
  await delay(300);

  // 목업: 역할에 따라 다른 결과 반환
  const role: UserRole = 'TEACHER'; // 실제로는 auth context에서
  return checkAccountDeletionEligibility('user-teacher-001', role);
}

/**
 * 계정 탈퇴 (S-040: 계정 탈퇴 화면)
 *
 * @param payload - 탈퇴 확인 및 비밀번호
 */
export async function deleteAccount(payload: DeleteAccountPayload): Promise<void> {
  // TODO(F-007): DELETE /api/v1/users/me
  // Authorization: Bearer <access_token>
  // Request Body: { password, confirmed, reason }
  await delay(800);

  // 목업: 계정 탈퇴 성공
  // 실제로는:
  // 1. 비밀번호 검증
  // 2. 탈퇴 가능 여부 재확인
  // 3. 데이터 삭제 처리
  // 4. 이메일 발송
  console.log('Account deleted successfully');
}

// ============================================================================
// 앱 설정 관련 API
// ============================================================================

/**
 * 앱 설정 조회
 *
 * @returns 앱 설정 (언어, 테마, 기본 화면)
 */
export async function fetchAppSettings(): Promise<AppSettings> {
  // TODO(F-007): GET /api/v1/users/me/app-settings
  // 또는 로컬 스토리지에서 가져올 수도 있음
  await delay(200);

  return mockAppSettings;
}

/**
 * 앱 설정 변경
 *
 * @param payload - 변경할 앱 설정
 * @returns 변경된 앱 설정
 */
export async function updateAppSettings(
  payload: Partial<AppSettings>
): Promise<AppSettings> {
  // TODO(F-007): PATCH /api/v1/users/me/app-settings
  // 또는 로컬 스토리지에 저장
  await delay(300);

  const currentSettings = await fetchAppSettings();
  const updatedSettings: AppSettings = {
    ...currentSettings,
    ...payload,
  };

  return updatedSettings;
}

// ============================================================================
// 비밀번호 검증 유틸리티
// ============================================================================

/**
 * 비밀번호 검증 (클라이언트 측)
 * F-007 비즈니스 규칙 참조
 *
 * @param password - 검증할 비밀번호
 * @returns 검증 결과 객체
 */
export function validatePassword(password: string): {
  minLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
} {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    minLength,
    hasUppercase,
    hasNumber,
    hasSpecialChar,
    isValid: minLength && hasUppercase && hasNumber && hasSpecialChar,
  };
}

/**
 * 비밀번호 일치 여부 확인
 *
 * @param password - 비밀번호
 * @param confirmPassword - 확인 비밀번호
 * @returns 일치 여부
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0;
}
