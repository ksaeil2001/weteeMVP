/**
 * Logout Page - WeTee MVP
 * Screen: 로그아웃 화면 (자동 로그아웃 처리 + 안내)
 * Step 14: 클라이언트 로그아웃 플로우
 *
 * Based on: F-001_회원가입_및_로그인.md (로그아웃 기능)
 *
 * 역할:
 * - 페이지 진입 시 자동으로 useAuth.logout() 호출
 * - 간단한 안내 메시지 표시
 * - 1~2초 후 /login으로 자동 리다이렉트
 * - "바로 로그인 화면으로" 버튼 제공
 *
 * 주의:
 * - 서버 API 호출 없이 클라이언트에서만 토큰 정리
 * - 재진입해도 에러 없이 동작 (로그아웃 함수 재호출 안전성 확보)
 *
 * TODO (향후):
 * - 로그아웃 사유 표시 (세션 만료, 사용자 요청 등)
 * - 로그아웃 전 확인 모달 (선택적)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [countdown, setCountdown] = useState(2); // 2초 카운트다운

  useEffect(() => {
    // 마운트 시 즉시 로그아웃 처리
    logout();

    // 카운트다운 타이머 (1초마다 감소)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 2초 후 /login으로 자동 이동
    const redirectTimer = setTimeout(() => {
      router.replace('/login');
    }, 2000);

    // 클린업
    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [logout, router]);

  /**
   * "바로 로그인 화면으로" 버튼 클릭 핸들러
   */
  const handleGoToLogin = () => {
    router.replace('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* 로고 & 타이틀 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">WeTee</h1>
          <p className="mt-2 text-gray-600">과외의 모든 것, 하나로</p>
        </div>

        {/* 로그아웃 안내 카드 */}
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          {/* 체크마크 아이콘 */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              로그아웃되었습니다
            </h2>
            <p className="text-gray-600">
              안전하게 로그아웃되었습니다.
              <br />
              {countdown > 0
                ? `${countdown}초 후 로그인 페이지로 이동합니다.`
                : '로그인 페이지로 이동 중...'}
            </p>
          </div>

          {/* 바로 이동 버튼 */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              바로 로그인 화면으로 가기
            </button>
          </div>
        </div>

        {/* 개발자용 안내 */}
        <details className="text-center">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            개발자 테스트 안내
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 text-left">
            <p className="mb-2">
              <strong>현재 상태:</strong> Step 14 - 클라이언트 로그아웃 플로우 완료
            </p>
            <p className="mb-2">
              - useAuth.logout()이 호출되어 Zustand 상태 초기화
            </p>
            <p className="mb-2">
              - wetee_access_token 쿠키 삭제 (Max-Age=0)
            </p>
            <p className="mb-2">
              - wetee_refresh_token localStorage 삭제
            </p>
            <p className="mb-2">
              - 2초 후 자동으로 /login으로 router.replace() 이동
            </p>
            <p>
              <strong>확인 방법:</strong> 개발자 도구 &gt; Application 탭에서
              쿠키/localStorage 확인
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
