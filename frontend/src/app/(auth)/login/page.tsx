/**
 * Login Page - WeTee MVP
 * Screen: S-003 (로그인 화면)
 *
 * Based on: UX_UI_설계서.md Section 4.2 (로그인 화면 와이어프레임)
 *
 * 변경 이력:
 * - Step 3: Route Guard 테스트용 임시 페이지 (쿠키만 설정)
 * - Step 4: useAuth 훅으로 authStore에 가짜 사용자 정보 세팅 추가
 * - Step 5: 실제 서비스용 로그인 UI 구현 (이메일/비밀번호 입력, 회원가입 링크)
 * - Step 11: F-001 로그인 API 연동 (POST /api/v1/auth/login)
 * - Step 13: login 시그니처 변경 (토큰 저장 책임 useAuth로 위임), 쿠키 직접 설정 제거
 *
 * TODO (향후):
 * - 토큰 자동 재발급 로직 (401/403 응답 시 자동 갱신)
 * - 소셜 로그인 버튼 (구글, 카카오)
 * - 비밀번호 찾기 기능
 * - 이메일 형식 검증 강화
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { loginWithEmail } from '@/lib/authApi';
import type { ApiError } from '@/lib/apiClient';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 로그인 폼 제출 핸들러
   *
   * 보안 강화:
   * - 토큰은 백엔드에서 httpOnly 쿠키로 설정 (XSS 방지)
   * - 프론트엔드는 사용자 정보만 sessionStorage에 저장
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 로그인 API 호출 (토큰은 쿠키로 자동 설정됨)
      const userData = await loginWithEmail({
        email,
        password,
      });

      // 사용자 정보만 저장 (토큰은 백엔드에서 쿠키로 설정됨)
      login({
        id: userData.userId,
        email: userData.email,
        name: userData.name,
        role: userData.role.toLowerCase() as 'teacher' | 'student' | 'parent',
        profileImage: undefined,
        phoneNumber: undefined,
        createdAt: new Date().toISOString(),
      });

      // 메인 페이지로 이동
      router.push('/');
      router.refresh();
    } catch (error) {
      // API 에러 처리
      const err = error as ApiError;

      // HTTP 상태 코드별 처리
      if (err.status === 400 || err.status === 401) {
        // 인증 실패
        if (err.code === 'AUTH004') {
          setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else if (err.code === 'AUTH006') {
          setErrorMessage(
            '계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도해주세요.',
          );
        } else {
          setErrorMessage('로그인 정보를 확인해주세요.');
        }
      } else if (err.status === 500) {
        // 서버 내부 오류
        setErrorMessage(
          '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
        console.error('Server error:', err);
      } else {
        // 기타 오류 (네트워크, 타임아웃 등)
        setErrorMessage(
          err.message ??
            '로그인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.',
        );
        console.error('Login error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* 로고 & 타이틀 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">WeTee</h1>
          <p className="mt-2 text-gray-600">과외의 모든 것, 하나로</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 이메일 입력 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="email@example.com"
                aria-label="이메일 주소 입력"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="••••••••"
                aria-label="비밀번호 입력"
              />
            </div>

            {/* 비밀번호 찾기 */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              aria-label={isLoading ? '로그인 진행 중' : '로그인'}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            {/* 에러 메시지 표시 (Step 11) */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}
          </form>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              아직 계정이 없으신가요?{' '}
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* 개발자용 안내 (Step 13 업데이트) */}
        <details className="text-center">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            개발자 테스트 안내
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 text-left">
            <p className="mb-2">
              <strong>현재 상태:</strong> Step 13 - 토큰 저장/갱신 및
              Authorization 헤더 자동 첨부 완료
            </p>
            <p className="mb-2">
              - 실제 백엔드 API (POST /api/v1/auth/login)를 호출합니다.
            </p>
            <p className="mb-2">
              - accessToken/refreshToken을 쿠키와 localStorage에 자동 저장합니다.
            </p>
            <p className="mb-2">
              - 이후 모든 API 호출에 Authorization 헤더가 자동으로 첨부됩니다.
            </p>
            <p>
              <strong>다음 단계:</strong> 토큰 자동 갱신 (401 응답 시),
              비밀번호 재설정
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
