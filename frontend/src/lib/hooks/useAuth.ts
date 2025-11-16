/**
 * useAuth Hook - WeTee MVP
 * Step 3-13: 인증 상태 관리 (Zustand 기반)
 *
 * 역할:
 * - 인증 상태(accessToken, refreshToken, user)를 중앙에서 관리
 * - 로그인/로그아웃/토큰 갱신 책임을 한 곳에 모음
 * - apiClient에 Access Token 공급자를 등록하여 Authorization 헤더 자동 첨부
 *
 * 변경 이력:
 * - Step 3: authStore 기본 구현 (accessToken, user)
 * - Step 13: refreshToken 추가, login 시그니처 변경, setTokens/logout/refreshSession 구현
 *
 * 사용 예시:
 * ```tsx
 * const { isAuthenticated, currentUser, currentRole, login, logout, refreshSession } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <Redirect to="/login" />;
 * }
 *
 * if (currentRole === 'teacher') {
 *   // 선생님 전용 UI
 * }
 * ```
 */

'use client';

import { create } from 'zustand';
import { setAccessTokenProvider } from '@/lib/apiClient';
import { refreshAccessToken } from '@/lib/authApi';

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
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;

  // 액션
  login: (params: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * 인증 상태 스토어
 *
 * - accessToken: API 호출 시 Authorization 헤더에 사용
 * - refreshToken: accessToken 만료 시 갱신 요청에 사용
 * - user: 현재 로그인한 사용자 정보
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // 초기 상태
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoading: false,

  /**
   * 로그인 시 토큰 + 사용자 정보 설정
   *
   * @param params.accessToken Access Token (JWT)
   * @param params.refreshToken Refresh Token
   * @param params.user 사용자 정보
   */
  login: ({ accessToken, refreshToken, user }) => {
    set({
      accessToken,
      refreshToken,
      user,
    });

    // Access Token 쿠키 저장 (Route Guard용, 1일 유효)
    if (typeof document !== 'undefined') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 1);
      document.cookie = `wetee_access_token=${accessToken}; expires=${expires.toUTCString()}; path=/`;
    }

    // Refresh Token은 localStorage에 저장 (임시 전략)
    // TODO: httpOnly 쿠키 또는 보안 스토리지로 변경 고려
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wetee_refresh_token', refreshToken);
    }
  },

  /**
   * 토큰만 교체 (사용자 정보는 유지)
   *
   * @param tokens.accessToken 새로운 Access Token
   * @param tokens.refreshToken 새로운 Refresh Token
   */
  setTokens: ({ accessToken, refreshToken }) => {
    set((prev) => ({
      ...prev,
      accessToken,
      refreshToken,
    }));

    // Access Token 쿠키 갱신
    if (typeof document !== 'undefined') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 1);
      document.cookie = `wetee_access_token=${accessToken}; expires=${expires.toUTCString()}; path=/`;
    }

    // Refresh Token localStorage 갱신
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('wetee_refresh_token', refreshToken);
    }
  },

  /**
   * 로그아웃 시 모든 인증 정보 삭제
   *
   * - Zustand 상태 초기화
   * - Access Token 쿠키 제거
   * - Refresh Token localStorage 제거
   */
  logout: () => {
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
    });

    // Access Token 쿠키 제거 (과거로 만료일 설정)
    if (typeof document !== 'undefined') {
      document.cookie = 'wetee_access_token=; Max-Age=0; path=/';
    }

    // Refresh Token localStorage 제거
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('wetee_refresh_token');
    }
  },

  /**
   * 토큰 갱신 (수동 호출)
   *
   * - refreshToken을 사용하여 새로운 accessToken/refreshToken 발급
   * - 갱신 성공 시 토큰 교체
   * - 갱신 실패 시 세션 정리 (로그아웃)
   *
   * @throws {ApiError} 갱신 실패 시 에러 발생 (401/403 등)
   */
  refreshSession: async () => {
    const state = get();

    if (!state.refreshToken) {
      // 리프레시 토큰이 없으면 갱신 불가 → 로그아웃 처리
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
      });
      return;
    }

    try {
      // 토큰 갱신 API 호출
      const result = await refreshAccessToken({
        refreshToken: state.refreshToken,
      });

      // 토큰 갱신 성공 시 토큰 교체
      set({
        ...state,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });

      // 쿠키/localStorage 갱신
      if (typeof document !== 'undefined') {
        const expires = new Date();
        expires.setDate(expires.getDate() + 1);
        document.cookie = `wetee_access_token=${result.accessToken}; expires=${expires.toUTCString()}; path=/`;
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('wetee_refresh_token', result.refreshToken);
      }
    } catch (error) {
      // 갱신 실패 시 세션 정리
      set({
        accessToken: null,
        refreshToken: null,
        user: null,
      });

      // 쿠키/localStorage 정리
      if (typeof document !== 'undefined') {
        document.cookie = 'wetee_access_token=; Max-Age=0; path=/';
      }
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('wetee_refresh_token');
      }

      // 에러는 호출자에게 전파 (선택적으로 처리 가능)
      throw error;
    }
  },

  /**
   * 사용자 정보만 업데이트 (프로필 수정 시 사용)
   */
  setUser: (user) => {
    set({ user });
  },

  /**
   * 로딩 상태 설정
   */
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

/**
 * Access Token 공급자를 apiClient에 등록
 *
 * - apiRequest는 이 함수를 통해 Authorization 헤더를 자동으로 설정
 * - useAuthStore.getState().accessToken을 통해 현재 토큰을 가져옴
 */
setAccessTokenProvider(() => {
  const state = useAuthStore.getState();
  return state.accessToken ?? null;
});

/**
 * useAuth 훅 반환 타입
 */
export interface UseAuthReturn {
  // 인증 상태
  isAuthenticated: boolean;
  isLoading: boolean;

  // 사용자 정보
  currentUser: User | null;
  currentRole: UserRole | null;
  accessToken: string | null;

  // 액션
  login: (params: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<void>;
}

/**
 * 인증 상태 및 액션을 제공하는 훅
 */
export function useAuth(): UseAuthReturn {
  const {
    accessToken,
    user,
    isLoading,
    login,
    logout,
    setUser,
    refreshSession,
  } = useAuthStore();

  return {
    // 인증 상태
    isAuthenticated: !!accessToken && !!user,
    isLoading,

    // 사용자 정보
    currentUser: user,
    currentRole: user?.role ?? null,
    accessToken,

    // 액션
    login,
    logout,
    updateUser: setUser,
    refreshSession,
  };
}

export default useAuth;
