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
 *
 * TODO (향후):
 * - 실제 로그인 API 연동 (POST /api/auth/login)
 * - 소셜 로그인 버튼 (구글, 카카오)
 * - 비밀번호 찾기 기능
 * - 이메일 형식 검증
 * - 에러 메시지 표시
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: 실제 로그인 API 연동 시 이 함수를 교체
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 임시 지연 (실제 API 호출 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 가짜 사용자 정보 (현재는 입력값 무시하고 고정 데이터 사용)
    const dummyToken = 'dummy_token_for_testing';
    const dummyUser = {
      id: 'demo-teacher-1',
      email: email || 'demo-teacher@example.com',
      name: '데모 선생님',
      role: 'teacher' as const,
      profileImage: undefined,
      phoneNumber: '010-1234-5678',
      createdAt: new Date().toISOString(),
    };

    // authStore에 로그인 정보 저장
    login(dummyToken, dummyUser);

    // 쿠키에도 토큰 설정 (1일 유효)
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);
    document.cookie = `wetee_access_token=${dummyToken}; expires=${expires.toUTCString()}; path=/`;

    // 메인 페이지로 이동
    router.push('/');
    router.refresh();
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="email@example.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* 비밀번호 찾기 */}
            <div className="text-right">
              <Link
                href="/reset-password"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
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

        {/* 개발자용 안내 (Step 5에서도 유지) */}
        <details className="text-center">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            개발자 테스트 안내
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 text-left">
            <p className="mb-2">
              <strong>현재 상태:</strong> 테스트 모드 (실제 API 연동 전)
            </p>
            <p className="mb-2">
              어떤 이메일/비밀번호를 입력해도 &quot;데모 선생님&quot; 계정으로 로그인됩니다.
            </p>
            <p>
              <strong>TODO:</strong> 실제 로그인 API 연동 시 handleLogin 함수를 교체
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
