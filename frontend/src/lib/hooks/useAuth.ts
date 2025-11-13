/**
 * useAuth Hook - WeTee MVP
 *
 * 인증 상태를 쉽게 사용하기 위한 커스텀 훅
 * authStore를 래핑하여 자주 사용하는 값들을 반환
 *
 * 사용 예시:
 * ```tsx
 * const { isAuthenticated, currentUser, currentRole, logout } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <Redirect to="/login" />;
 * }
 *
 * if (currentRole === 'teacher') {
 *   // 선생님 전용 UI
 * }
 * ```
 *
 * TODO (Step 4):
 * - 역할별 권한 체크 유틸리티 (hasPermission)
 * - 로그인 만료 체크
 * - 자동 토큰 갱신 로직
 */

import { useAuthStore, type User, type UserRole } from '../store/authStore';

export interface UseAuthReturn {
  // 인증 상태
  isAuthenticated: boolean;
  isLoading: boolean;

  // 사용자 정보
  currentUser: User | null;
  currentRole: UserRole | null;
  accessToken: string | null;

  // 액션
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

/**
 * 인증 상태 및 액션을 제공하는 훅
 */
export function useAuth(): UseAuthReturn {
  const {
    accessToken,
    user,
    isLoading,
    setAuth,
    clearAuth,
    setUser,
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
    login: (token: string, user: User) => {
      setAuth(token, user);
      // TODO: 로그인 API 호출
      // TODO: 쿠키에 토큰 저장
    },

    logout: () => {
      clearAuth();
      // TODO: 로그아웃 API 호출
      // TODO: 쿠키 삭제
      // TODO: 로컬스토리지 삭제
      // TODO: /login으로 리다이렉트
    },

    updateUser: (user: User) => {
      setUser(user);
    },
  };
}

export default useAuth;
