/**
 * Settings API Client - WeTee MVP
 * Feature: F-007 기본 프로필 및 설정
 *
 * 실제 백엔드 API와 연동
 * Backend: /backend/app/routers/profiles.py
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
import { apiRequest } from '@/lib/apiClient';

// ============================================================================
// 프로필 관련 API
// ============================================================================

/**
 * 현재 사용자 프로필 조회 (S-034: 프로필 화면, S-035: 프로필 수정 화면)
 *
 * @returns 현재 로그인한 사용자의 전체 프로필
 */
export async function fetchUserProfile(): Promise<FullUserProfile> {
  return apiRequest<FullUserProfile>('/users/me', {
    method: 'GET',
  });
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
  return apiRequest<FullUserProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
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
  const formData = new FormData();
  formData.append('file', file);

  // FormData를 사용할 때는 Content-Type 헤더를 명시하지 않음 (브라우저가 자동 설정)
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1'}/users/me/profile-image`, {
    method: 'POST',
    headers: {
      // Content-Type을 설정하지 않음 - FormData가 자동으로 설정
      // Authorization 헤더는 apiClient의 accessTokenProvider를 통해 추가 필요
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '이미지 업로드에 실패했습니다');
  }

  const result = await response.json();
  return result.data || result;
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
  return apiRequest<NotificationSettings>('/users/me/settings', {
    method: 'GET',
  });
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
  return apiRequest<NotificationSettings>('/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
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
  return apiRequest<ChangePasswordResponse>('/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 로그인 기록 조회 (S-039: 로그인 기록 화면, 선생님 전용)
 * TODO(v2): 백엔드 구현 후 연동
 */
export async function fetchLoginHistory(_params: {
  page?: number;
  size?: number;
}): Promise<LoginHistoryResponse> {
  // TODO(v2): GET /api/v1/users/me/login-history?page={page}&size={size}
  throw new Error('Not implemented yet');
}

/**
 * 의심스러운 로그인 신고 (S-039: 로그인 기록 화면)
 * TODO(v2): 백엔드 구현 후 연동
 */
export async function reportSuspiciousLogin(_loginId: string): Promise<{
  message: string;
  reported_at: string;
}> {
  // TODO(v2): POST /api/v1/users/me/login-history/{loginId}/report
  throw new Error('Not implemented yet');
}

/**
 * 연결된 기기 목록 조회 (S-038: 보안 설정 화면)
 * TODO(v2): 백엔드 구현 후 연동
 */
export async function fetchConnectedDevices(): Promise<ConnectedDevice[]> {
  // TODO(v2): GET /api/v1/users/me/sessions
  throw new Error('Not implemented yet');
}

/**
 * 특정 기기 로그아웃 (S-038: 보안 설정 화면)
 * TODO(v2): 백엔드 구현 후 연동
 */
export async function logoutDevice(_sessionId: string): Promise<void> {
  // TODO(v2): DELETE /api/v1/users/me/sessions/{sessionId}
  throw new Error('Not implemented yet');
}

/**
 * 모든 기기 로그아웃 (S-038: 보안 설정 화면)
 * TODO(v2): 백엔드 구현 후 연동
 */
export async function logoutAllDevices(_currentPassword: string): Promise<void> {
  // TODO(v2): DELETE /api/v1/users/me/sessions/all
  throw new Error('Not implemented yet');
}

// ============================================================================
// 계정 탈퇴 관련 API
// ============================================================================

/**
 * 계정 탈퇴 가능 여부 확인 (S-040: 계정 탈퇴 화면)
 * TODO(v2): 백엔드 구현 후 연동
 */
export async function checkAccountDeletion(): Promise<AccountDeletionEligibility> {
  // TODO(v2): GET /api/v1/users/me/deletion-eligibility
  throw new Error('Not implemented yet');
}

/**
 * 계정 탈퇴 (S-040: 계정 탈퇴 화면)
 * TODO(v2): 백엔드 구현 후 연동
 */
export async function deleteAccount(_payload: DeleteAccountPayload): Promise<void> {
  // TODO(v2): DELETE /api/v1/users/me
  throw new Error('Not implemented yet');
}

// ============================================================================
// 앱 설정 관련 API
// ============================================================================

/**
 * 앱 설정 조회
 * TODO(v2): 로컬 스토리지 또는 백엔드와 연동
 */
export async function fetchAppSettings(): Promise<AppSettings> {
  // TODO(v2): GET /api/v1/users/me/app-settings 또는 localStorage
  throw new Error('Not implemented yet');
}

/**
 * 앱 설정 변경
 * TODO(v2): 로컬 스토리지 또는 백엔드와 연동
 */
export async function updateAppSettings(
  _payload: Partial<AppSettings>
): Promise<AppSettings> {
  // TODO(v2): PATCH /api/v1/users/me/app-settings 또는 localStorage
  throw new Error('Not implemented yet');
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
