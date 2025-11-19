/**
 * AuthProvider - 인증 상태 초기화 및 복원
 *
 * 역할:
 * - 앱 최초 로드 시 쿠키에 토큰이 있지만 sessionStorage에 user 정보가 없으면 복원
 * - useAuth.loadMe()를 호출하여 백엔드에서 최신 사용자 정보 가져오기
 * - 전역 인증 상태 관리
 *
 * 무한 루프 방지:
 * - useRef로 초기화 완료 상태 추적
 * - sessionStorage에 user 정보가 있으면 loadMe 스킵 (hydration이 이미 처리)
 * - 최초 마운트 시 1회만 실행
 *
 * 사용법:
 * ```tsx
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 * ```
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

const WETEE_USER_KEY = 'wetee_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, loadMe } = useAuth();
  const initRef = useRef(false);

  useEffect(() => {
    // 이미 초기화했으면 스킵 (무한 루프 방지)
    if (initRef.current) {
      return;
    }

    // sessionStorage에 user 정보가 있는지 확인
    const hasStoredUser =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(WETEE_USER_KEY) !== null;

    // sessionStorage에 user 정보가 있으면 hydration이 이미 처리했으므로 스킵
    if (hasStoredUser) {
      console.log('[AuthProvider] sessionStorage에 사용자 정보 존재, loadMe 스킵');
      initRef.current = true;
      return;
    }

    // user 정보가 없고, sessionStorage에도 없으면 loadMe 시도
    // (쿠키에만 토큰이 있는 경우)
    if (!currentUser) {
      console.log('[AuthProvider] 사용자 정보 없음, loadMe 시도');
      initRef.current = true;

      loadMe().catch((error) => {
        console.error('[AuthProvider] 사용자 정보 로드 실패:', error);
        // loadMe 내부에서 이미 logout 처리됨
      });
    } else {
      // currentUser가 이미 있으면 초기화 완료
      initRef.current = true;
    }
  }, [currentUser, loadMe]);

  return <>{children}</>;
}
