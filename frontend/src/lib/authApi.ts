/**
 * Auth API Module
 * Step 11: Auth API 모듈 (로그인 1차 연동)
 *
 * 역할:
 * - 인증 관련 API 호출(현재는 로그인만)을 담당하는 모듈
 * - 컴포넌트에서 직접 fetch를 호출하지 않고, authApi를 통해서만 로그인 API를 부르는 구조
 *
 * 관련 문서:
 * - F-001_회원가입_및_로그인.md
 * - API_명세서.md - F-001 섹션
 *
 * TODO: 회원가입, 토큰 갱신, 로그아웃, 비밀번호 재설정 API로 확장 예정
 * - registerWithEmail: 회원가입 (POST /api/v1/auth/register)
 * - refreshAccessToken: 토큰 갱신 (POST /api/v1/auth/refresh)
 * - logout: 로그아웃 (POST /api/v1/auth/logout)
 * - requestPasswordReset: 비밀번호 재설정 요청
 * - confirmPasswordReset: 비밀번호 재설정 확인
 */

import { apiRequest } from './apiClient';
import type { LoginRequestPayload, LoginResponseData } from '@/types/auth';

/**
 * 이메일 로그인 API 호출
 *
 * @param payload 로그인 요청 페이로드 (email, password, deviceInfo)
 * @returns 로그인 성공 시 토큰 및 사용자 정보
 *
 * @throws {ApiError} 로그인 실패 시 에러 발생
 * - AUTH004: 이메일/비밀번호 불일치
 * - AUTH006: 계정 잠김 (무차별 대입 공격 방지)
 * - 기타 네트워크/서버 에러
 *
 * @example
 * ```ts
 * try {
 *   const result = await loginWithEmail({
 *     email: 'teacher@example.com',
 *     password: 'password123',
 *   });
 *   console.log(result.user.name); // 사용자 이름
 * } catch (error) {
 *   if (error.code === 'AUTH004') {
 *     alert('이메일 또는 비밀번호가 올바르지 않습니다.');
 *   }
 * }
 * ```
 */
export async function loginWithEmail(
  payload: LoginRequestPayload,
): Promise<LoginResponseData> {
  // deviceInfo가 없으면 기본 값 보완
  const deviceInfo = payload.deviceInfo ?? {
    deviceType: 'web',
    os: typeof window !== 'undefined' ? navigator.platform : 'web',
    appVersion: 'web-1.0.0',
  };

  // 백엔드 API 요청 형식 (snake_case)으로 변환
  const requestBody = {
    email: payload.email,
    password: payload.password,
    device_info: {
      device_type: deviceInfo.deviceType,
      os: deviceInfo.os,
      app_version: deviceInfo.appVersion,
    },
  };

  // API 호출
  const responseData = await apiRequest<{
    access_token: string;
    refresh_token: string;
    user: {
      user_id: string;
      email: string;
      name: string;
      role: string;
    };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  // snake_case → camelCase 변환
  const result: LoginResponseData = {
    accessToken: responseData.access_token,
    refreshToken: responseData.refresh_token,
    user: {
      userId: responseData.user.user_id,
      email: responseData.user.email,
      name: responseData.user.name,
      role: responseData.user.role.toUpperCase() as 'TEACHER' | 'STUDENT' | 'PARENT',
    },
  };

  return result;
}
