/**
 * Auth API Module
 * Step 11-13: Auth API 모듈 (로그인, 회원가입, 토큰 갱신)
 *
 * 역할:
 * - 인증 관련 API 호출(로그인, 회원가입, 토큰 갱신)을 담당하는 모듈
 * - 컴포넌트에서 직접 fetch를 호출하지 않고, authApi를 통해서만 인증 API를 부르는 구조
 *
 * 관련 문서:
 * - F-001_회원가입_및_로그인.md
 * - API_명세서.md - F-001 섹션
 *
 * TODO: 로그아웃, 비밀번호 재설정 등으로 확장 예정
 * - logout: 로그아웃 (POST /api/v1/auth/logout)
 * - requestPasswordReset: 비밀번호 재설정 요청
 * - confirmPasswordReset: 비밀번호 재설정 확인
 * - verifyEmail: 이메일 인증
 * - resendVerificationEmail: 인증 이메일 재전송
 */

import { apiRequest } from './apiClient';
import type {
  LoginRequestPayload,
  LoginResponseData,
  RegisterRequestPayload,
  RegisterResponseData,
  RefreshTokenRequestPayload,
  RefreshTokenResponseData,
} from '@/types/auth';

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
  // 백엔드 API 요청 형식
  // MVP 1단계에서는 email/password만 전송 (F-001 기준)
  // device_info는 백엔드 LoginRequest 스키마에 정의되지 않았으므로 제거
  const requestBody = {
    email: payload.email,
    password: payload.password,
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

/**
 * 이메일 회원가입 API 호출
 *
 * @param payload 회원가입 요청 페이로드 (email, password, name, phone, role, profile)
 * @returns 회원가입 성공 시 생성된 사용자 정보
 *
 * @throws {ApiError} 회원가입 실패 시 에러 발생
 * - 409 Conflict: 이메일 중복
 * - 400 Bad Request: 입력값 검증 실패
 * - 기타 네트워크/서버 에러
 *
 * @example
 * ```ts
 * try {
 *   const result = await registerWithEmail({
 *     email: 'teacher@example.com',
 *     password: 'SecurePassword123!',
 *     name: '김선생',
 *     phone: '010-1234-5678',
 *     role: 'TEACHER',
 *     profile: {
 *       subjects: ['수학', '영어'],
 *       school: '서울대학교',
 *     },
 *   });
 *   console.log(result.userId); // 생성된 사용자 ID
 *   console.log(result.emailVerified); // false (이메일 인증 전)
 * } catch (error) {
 *   const err = error as ApiError;
 *   if (err.status === 409) {
 *     alert('이미 가입된 이메일입니다.');
 *   }
 * }
 * ```
 */
export async function registerWithEmail(
  payload: RegisterRequestPayload,
): Promise<RegisterResponseData> {
  // 백엔드 API 요청 형식 (snake_case)으로 변환
  const requestBody = {
    email: payload.email,
    password: payload.password,
    name: payload.name,
    phone: payload.phone,
    role: payload.role, // 'TEACHER' | 'STUDENT' | 'PARENT'
    profile: payload.profile
      ? {
          subjects: payload.profile.subjects,
          school: payload.profile.school,
        }
      : undefined,
  };

  // API 호출
  const responseData = await apiRequest<{
    user_id: string;
    email: string;
    name: string;
    role: string;
    email_verified: boolean;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  // snake_case → camelCase 변환
  const result: RegisterResponseData = {
    userId: responseData.user_id,
    email: responseData.email,
    name: responseData.name,
    role: responseData.role.toUpperCase() as 'TEACHER' | 'STUDENT' | 'PARENT',
    emailVerified: responseData.email_verified,
  };

  return result;
}

/**
 * 토큰 갱신 API 호출
 *
 * @param payload refreshToken 기반 토큰 갱신 요청 페이로드
 * @returns 갱신된 accessToken / refreshToken 쌍
 *
 * @throws {ApiError} 갱신 실패 시 에러 발생
 * - 401/403: 리프레시 토큰 만료/무효
 * - 기타 네트워크/서버 에러
 *
 * @example
 * ```ts
 * try {
 *   const result = await refreshAccessToken({
 *     refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   });
 *   console.log(result.accessToken); // 새로운 Access Token
 *   console.log(result.refreshToken); // 새로운 Refresh Token
 * } catch (error) {
 *   const err = error as ApiError;
 *   if (err.status === 401 || err.status === 403) {
 *     // 리프레시 토큰 만료 → 재로그인 필요
 *     alert('세션이 만료되었습니다. 다시 로그인해주세요.');
 *   }
 * }
 * ```
 */
export async function refreshAccessToken(
  payload: RefreshTokenRequestPayload,
): Promise<RefreshTokenResponseData> {
  // 백엔드 API 요청 형식 (snake_case)으로 변환
  const requestBody = {
    refresh_token: payload.refreshToken,
  };

  // API 호출
  const responseData = await apiRequest<{
    access_token: string;
    refresh_token: string;
  }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });

  // snake_case → camelCase 변환
  const result: RefreshTokenResponseData = {
    accessToken: responseData.access_token,
    refreshToken: responseData.refresh_token,
  };

  return result;
}

/**
 * 현재 로그인한 사용자 정보 조회
 *
 * Authorization 헤더의 Access Token을 사용하여 현재 로그인한 사용자의 정보를 가져옵니다.
 * 앱 초기 로드 시 localStorage에 토큰이 있을 때 사용자 정보를 복원하는 용도로 사용됩니다.
 *
 * @returns 현재 로그인한 사용자 정보
 *
 * @throws {ApiError} 조회 실패 시 에러 발생
 * - 401: Access Token 없음/만료/유효하지 않음
 * - 기타 네트워크/서버 에러
 *
 * @example
 * ```ts
 * try {
 *   const user = await getCurrentAccount();
 *   console.log(user.name); // 사용자 이름
 * } catch (error) {
 *   const err = error as ApiError;
 *   if (err.status === 401) {
 *     // 토큰 만료 → 재로그인 필요
 *     console.error('로그인이 필요합니다.');
 *   }
 * }
 * ```
 */
export async function getCurrentAccount(): Promise<RegisterResponseData> {
  // API 호출 (Authorization 헤더는 apiClient에서 자동 추가)
  const responseData = await apiRequest<{
    user_id: string;
    email: string;
    name: string;
    role: string;
    is_email_verified: boolean;
  }>('/auth/account', {
    method: 'GET',
  });

  // snake_case → camelCase 변환
  const result: RegisterResponseData = {
    userId: responseData.user_id,
    email: responseData.email,
    name: responseData.name,
    role: responseData.role.toUpperCase() as 'TEACHER' | 'STUDENT' | 'PARENT',
    emailVerified: responseData.is_email_verified,
  };

  return result;
}
