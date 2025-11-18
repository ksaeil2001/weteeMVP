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
 * 보안 강화:
 * - 토큰은 백엔드에서 httpOnly 쿠키로 설정 (XSS 방지)
 * - 응답은 사용자 정보만 포함
 *
 * @param payload 로그인 요청 페이로드 (email, password)
 * @returns 로그인 성공 시 사용자 정보
 *
 * @throws {ApiError} 로그인 실패 시 에러 발생
 * - AUTH004: 이메일/비밀번호 불일치
 * - AUTH006: 계정 잠김 (무차별 대입 공격 방지)
 * - 기타 네트워크/서버 에러
 *
 * @example
 * ```ts
 * try {
 *   const user = await loginWithEmail({
 *     email: 'teacher@example.com',
 *     password: 'password123',
 *   });
 *   console.log(user.name); // 사용자 이름
 * } catch (error) {
 *   if (error.code === 'AUTH004') {
 *     alert('이메일 또는 비밀번호가 올바르지 않습니다.');
 *   }
 * }
 * ```
 */
export async function loginWithEmail(
  payload: LoginRequestPayload,
): Promise<RegisterResponseData> {
  // 백엔드 API 요청 형식
  const requestBody = {
    email: payload.email,
    password: payload.password,
  };

  // API 호출 (토큰은 쿠키로 자동 설정됨)
  const responseData = await apiRequest<{
    user_id: string;
    email: string;
    name: string;
    role: string;
    is_email_verified: boolean;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(requestBody),
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
    is_email_verified: boolean;
    created_at?: string; // 백엔드에서 반환하지만 현재 사용하지 않음
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
    emailVerified: responseData.is_email_verified,
  };

  return result;
}

/**
 * 토큰 갱신 API 호출
 *
 * 보안 강화:
 * - refreshToken은 httpOnly 쿠키에서 자동으로 전송됨
 * - 새 토큰들은 httpOnly 쿠키로 자동 설정됨
 * - 프론트엔드는 성공/실패만 확인
 *
 * @param payload refreshToken 기반 토큰 갱신 요청 페이로드 (실제로는 사용 안 함)
 * @returns 갱신 성공 여부
 *
 * @throws {ApiError} 갱신 실패 시 에러 발생
 * - 401/403: 리프레시 토큰 만료/무효
 * - 기타 네트워크/서버 에러
 *
 * @example
 * ```ts
 * try {
 *   await refreshAccessToken({ refreshToken: '' });
 *   console.log('토큰 갱신 완료');
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
): Promise<{ success: boolean }> {
  // API 호출 (refreshToken은 쿠키에서 자동 전송)
  const responseData = await apiRequest<{
    success: boolean;
    message: string;
  }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({}), // body는 비워둠 (쿠키에서 토큰 읽음)
  });

  return { success: responseData.success };
}

/**
 * 현재 로그인한 사용자 정보 조회
 *
 * 보안 강화:
 * - 쿠키에 저장된 Access Token을 사용하여 사용자 정보 조회
 * - 쿠키는 브라우저가 자동으로 전송
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
  // API 호출 (쿠키에서 자동으로 토큰 전송)
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

/**
 * 로그아웃 API 호출
 *
 * 보안 강화:
 * - 백엔드에서 httpOnly 쿠키를 삭제
 * - 프론트엔드는 sessionStorage만 정리
 *
 * @returns 로그아웃 성공 여부
 *
 * @throws {ApiError} 로그아웃 실패 시 에러 발생
 *
 * @example
 * ```ts
 * try {
 *   await logoutUser();
 *   console.log('로그아웃 완료');
 * } catch (error) {
 *   console.error('로그아웃 실패:', error);
 * }
 * ```
 */
export async function logoutUser(): Promise<{ success: boolean }> {
  // API 호출 (쿠키 삭제는 백엔드에서 처리)
  const responseData = await apiRequest<{
    success: boolean;
    message: string;
  }>('/auth/logout', {
    method: 'POST',
  });

  return { success: responseData.success };
}
