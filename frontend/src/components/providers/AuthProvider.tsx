/**
 * AuthProvider - 인증 상태 초기화 및 복원
 *
 * 역할:
 * - 앱 최초 로드 시 localStorage/쿠키에 토큰이 있으면 사용자 정보 복원
 * - useAuth.loadMe()를 호출하여 백엔드에서 최신 사용자 정보 가져오기
 * - 전역 인증 상태 관리
 *
 * 사용법:
 * ```tsx
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, currentUser, loadMe } = useAuth();

  useEffect(() => {
    // 토큰은 있지만 사용자 정보가 없는 경우 (hydration 실패 또는 localStorage에 user 정보 없음)
    // 백엔드에서 사용자 정보를 가져옵니다.
    if (accessToken && !currentUser) {
      console.log('[AuthProvider] 토큰 존재, 사용자 정보 로드 시작');
      loadMe().catch((error) => {
        console.error('[AuthProvider] 사용자 정보 로드 실패:', error);
        // loadMe 내부에서 이미 logout 처리됨
      });
    }
  }, [accessToken, currentUser, loadMe]);

  return <>{children}</>;
}
