/**
 * Authentication Store - WeTee MVP
 *
 * Zustand 기반 전역 인증 상태 관리
 * Based on: F-001_회원가입_및_로그인.md
 *
 * 관리 항목:
 * - accessToken: JWT 액세스 토큰
 * - user: 현재 로그인한 사용자 정보
 * - role: 사용자 역할 (teacher | student | parent)
 *
 * TODO (향후 구현):
 * - refreshToken 관리
 * - 로컬스토리지 persist 연동
 * - 백엔드 JWT 검증 및 자동 갱신
 * - 로그인/로그아웃 API 연동
 */

import { create } from 'zustand';

/**
 * 사용자 역할 타입
 */
export type UserRole = 'teacher' | 'student' | 'parent';

/**
 * 사용자 정보 타입
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string;
  phoneNumber?: string;
  createdAt?: string;
}

/**
 * 인증 상태 타입
 */
interface AuthState {
  // 상태
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;

  // 액션
  setAuth: (token: string, user: User) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * 인증 상태 스토어
 *
 * 사용 예시:
 * ```ts
 * const { user, accessToken, setAuth, clearAuth } = useAuthStore();
 * ```
 */
export const useAuthStore = create<AuthState>((set) => ({
  // 초기 상태
  accessToken: null,
  user: null,
  isLoading: false,

  // 로그인 시 토큰 + 사용자 정보 설정
  setAuth: (token, user) => {
    set({ accessToken: token, user });
    // TODO: 로컬스토리지에 저장 (persist)
    // TODO: 쿠키에 토큰 저장 (httpOnly 고려)
  },

  // 액세스 토큰만 업데이트 (토큰 갱신 시 사용)
  setAccessToken: (token) => {
    set({ accessToken: token });
    // TODO: 로컬스토리지/쿠키 업데이트
  },

  // 사용자 정보만 업데이트 (프로필 수정 시 사용)
  setUser: (user) => {
    set({ user });
  },

  // 로그아웃 시 모든 인증 정보 삭제
  clearAuth: () => {
    set({ accessToken: null, user: null });
    // TODO: 로컬스토리지/쿠키 삭제
  },

  // 로딩 상태 설정
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

export default useAuthStore;
