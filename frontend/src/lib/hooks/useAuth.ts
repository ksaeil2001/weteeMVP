/**
 * useAuth Hook - WeTee MVP
 * Step 3-14: 인증 상태 관리 (Zustand 기반)
 *
 * 역할:
 * - 인증 상태(accessToken, refreshToken, user)를 중앙에서 관리
 * - 로그인/로그아웃/토큰 갱신 책임을 한 곳에 모음
 * - apiClient에 Access Token 공급자를 등록하여 Authorization 헤더 자동 첨부
 *
 * 변경 이력:
 * - Step 3: authStore 기본 구현 (accessToken, user)
 * - Step 13: refreshToken 추가, login 시그니처 변경, setTokens/logout/refreshSession 구현
 * - Step 14: logout 정리, 토큰 키 상수화
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
import { refreshAccessToken, getCurrentAccount, logoutUser } from '@/lib/authApi';

/**
 * 사용자 정보 저장 키 상수
 * 보안 강화: 토큰은 백엔드에서 httpOnly 쿠키로 관리
 * 프론트엔드에서는 사용자 정보만 sessionStorage에 저장
 */
const WETEE_USER_KEY = 'wetee_user'; // User 정보 저장 키 (sessionStorage)

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
 * 보안 강화: 토큰은 백엔드 httpOnly 쿠키로 관리, 프론트엔드는 사용자 정보만 관리
 */
interface AuthState {
  // 상태
  user: User | null;
  isLoading: boolean;

  // 액션
  login: (user: User) => void;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * 인증 상태 스토어
 *
 * 보안 강화:
 * - 토큰(accessToken, refreshToken)은 백엔드에서 httpOnly 쿠키로 관리 (XSS 방지)
 * - 프론트엔드는 사용자 정보만 sessionStorage에 저장 (브라우저 닫으면 자동 삭제)
 * - apiClient는 credentials: 'include'로 쿠키를 자동 전송
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // 초기 상태
  user: null,
  isLoading: false,

  /**
   * 로그인 시 사용자 정보 설정
   *
   * @param user 사용자 정보
   *
   * 보안 강화:
   * - 토큰은 백엔드에서 Set-Cookie로 httpOnly 쿠키에 저장 (JavaScript 접근 불가)
   * - 프론트엔드는 사용자 정보만 sessionStorage에 저장
   */
  login: (user) => {
    set({ user });

    // User 정보를 sessionStorage에 저장 (페이지 새로고침 시 복원용)
    // sessionStorage는 브라우저 닫으면 자동 삭제됨
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(WETEE_USER_KEY, JSON.stringify(user));
    }
  },

  /**
   * 로그아웃 시 모든 인증 정보 삭제
   *
   * 보안 강화:
   * - 백엔드 API 호출하여 httpOnly 쿠키 삭제
   * - Zustand 상태 초기화
   * - sessionStorage에서 사용자 정보 제거
   * - 재호출 안전성: 여러 번 호출해도 에러 없이 동작
   */
  logout: async () => {
    try {
      // 백엔드 로그아웃 API 호출 (쿠키 삭제)
      await logoutUser();
    } catch (error) {
      // 로그아웃 API 실패해도 클라이언트 상태는 정리
      console.error('[useAuth.logout] 로그아웃 API 실패:', error);
    } finally {
      // Zustand 상태 초기화
      set({ user: null });

      // User 정보 sessionStorage 제거
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(WETEE_USER_KEY);
      }
    }
  },

  /**
   * 현재 사용자 정보 로드 (/auth/account 호출)
   *
   * 보안 강화:
   * - 쿠키에 토큰이 있으면 백엔드에서 자동으로 인증 처리
   * - 백엔드에서 최신 사용자 정보를 가져와서 상태 업데이트
   * - 앱 초기 로드 시 sessionStorage에 user 정보가 없을 때 사용
   *
   * 무한 루프 방지:
   * - loadMe 함수 자체는 안정적인 참조를 유지하기 위해 store 내부에 정의
   * - 실제 API 호출 로직만 수행하며, 외부 의존성 없음
   *
   * @throws {ApiError} 사용자 정보 로드 실패 시 에러 발생
   */
  loadMe: async () => {
    const state = get();

    // 이미 로딩 중이면 스킵 (중복 호출 방지)
    if (state.isLoading) {
      console.log('[useAuth.loadMe] 이미 로딩 중, 중복 호출 스킵');
      return;
    }

    try {
      set({ isLoading: true });

      // 백엔드에서 현재 사용자 정보 조회 (쿠키에서 자동으로 토큰 읽음)
      const userData = await getCurrentAccount();

      // 사용자 정보 업데이트
      const user: User = {
        id: userData.userId,
        email: userData.email,
        name: userData.name,
        role: userData.role.toLowerCase() as UserRole,
        profileImage: undefined,
        phoneNumber: undefined,
        createdAt: undefined,
      };

      set({ user });

      // sessionStorage에도 저장 (페이지 새로고침 시 복원용)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(WETEE_USER_KEY, JSON.stringify(user));
      }

      console.log('[useAuth.loadMe] 사용자 정보 로드 완료:', user.email);
    } catch (error) {
      console.error('[useAuth.loadMe] 사용자 정보 로드 실패:', error);
      // 로드 실패 시 로그아웃 처리
      get().logout();
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 토큰 갱신 (수동 호출)
   *
   * 보안 강화:
   * - refreshToken은 httpOnly 쿠키에 저장되어 있으므로 자동으로 전송됨
   * - 백엔드에서 쿠키에서 읽어서 새로운 토큰을 쿠키로 설정
   * - 프론트엔드는 API 호출만 하면 됨
   *
   * @throws {ApiError} 갱신 실패 시 에러 발생 (401/403 등)
   */
  refreshSession: async () => {
    try {
      // 토큰 갱신 API 호출 (쿠키에서 자동으로 refreshToken 읽음)
      await refreshAccessToken({ refreshToken: '' }); // refreshToken은 쿠키에서 자동 전송

      console.log('[useAuth.refreshSession] 토큰 갱신 완료');
    } catch (error) {
      console.error('[useAuth.refreshSession] 토큰 갱신 실패:', error);
      // 갱신 실패 시 세션 정리
      get().logout();
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
 * 페이지 로드 시 인증 상태 복원 (Hydration)
 *
 * 보안 강화:
 * - 토큰은 httpOnly 쿠키에 저장되어 있으므로 브라우저가 자동으로 전송
 * - 프론트엔드는 sessionStorage에서 사용자 정보만 복원
 * - sessionStorage는 브라우저 닫으면 자동 삭제됨 (보안 강화)
 *
 * 주의: 클라이언트에서만 실행 (SSR 시 window 없음)
 */
if (typeof window !== 'undefined') {
  const hydrateAuthState = () => {
    try {
      // sessionStorage에서 user 읽기
      const storedUserStr = window.sessionStorage.getItem(WETEE_USER_KEY);

      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr) as User;

        useAuthStore.setState({
          user: storedUser,
        });

        console.log('[Auth Hydration] 인증 상태 복원 완료:', storedUser.email);
      } else {
        console.log('[Auth Hydration] 복원할 인증 정보 없음 (비로그인 상태)');
      }
    } catch (error) {
      console.error('[Auth Hydration] 인증 상태 복원 실패:', error);
      // 복원 실패 시 안전하게 로그아웃 처리
      useAuthStore.getState().logout();
    }
  };

  // 즉시 실행
  hydrateAuthState();
}

/**
 * useAuth 훅 반환 타입
 *
 * 보안 강화:
 * - accessToken은 httpOnly 쿠키에 저장되므로 프론트엔드에서 접근 불가
 * - 인증 상태는 user 정보 유무로만 판단
 */
export interface UseAuthReturn {
  // 인증 상태
  isAuthenticated: boolean;
  isLoading: boolean;

  // 사용자 정보
  currentUser: User | null;
  currentRole: UserRole | null;

  // 액션
  login: (user: User) => void;
  logout: () => Promise<void>;
  loadMe: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshSession: () => Promise<void>;
}

/**
 * 인증 상태 및 액션을 제공하는 훅
 *
 * 보안 강화:
 * - 토큰은 httpOnly 쿠키로 관리 (XSS 방지)
 * - 프론트엔드는 사용자 정보만 sessionStorage에 저장
 */
export function useAuth(): UseAuthReturn {
  const {
    user,
    isLoading,
    login,
    logout,
    loadMe,
    setUser,
    refreshSession,
  } = useAuthStore();

  return {
    // 인증 상태
    isAuthenticated: !!user,
    isLoading,

    // 사용자 정보
    currentUser: user,
    currentRole: user?.role ?? null,

    // 액션
    login,
    logout,
    loadMe,
    updateUser: setUser,
    refreshSession,
  };
}

export default useAuth;
