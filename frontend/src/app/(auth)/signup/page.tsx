/**
 * Signup Page - WeTee MVP
 * Screen: S-004 (회원가입 화면)
 *
 * Based on: F-001_회원가입_및_로그인.md
 *
 * 현재 상태: 스켈레톤 (UI만 구현, 실제 API 연동 전)
 *
 * TODO (향후):
 * - 실제 회원가입 API 연동 (POST /api/auth/signup)
 * - 이메일 중복 검사
 * - 비밀번호 강도 체크
 * - 이메일 인증 플로우
 * - 입력값 검증 (이메일 형식, 비밀번호 일치 등)
 * - 에러 메시지 표시
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type UserRole = 'teacher' | 'student' | 'parent';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'teacher' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // TODO: 실제 회원가입 API 연동 시 이 함수를 교체
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 간단한 클라이언트 검증
    if (formData.password !== formData.passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    // 임시 지연 (실제 API 호출 시뮬레이션)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('TODO: 회원가입 API 연동', formData);

    // 임시: 회원가입 후 로그인 페이지로 이동
    alert('회원가입이 완료되었습니다! (테스트 모드)');
    router.push('/login');

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* 로고 & 타이틀 */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">WeTee</h1>
          <p className="mt-2 text-gray-600">과외의 모든 것, 하나로</p>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">회원가입</h2>
        </div>

        {/* 회원가입 폼 */}
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          <form onSubmit={handleSignup} className="space-y-5">
            {/* 이름 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="홍길동"
              />
            </div>

            {/* 이메일 */}
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
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="email@example.com"
              />
            </div>

            {/* 비밀번호 */}
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            {/* 역할 선택 */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                역할
              </label>
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="teacher">선생님</option>
                <option value="student">학생</option>
                <option value="parent">학부모</option>
              </select>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors mt-6"
            >
              {isLoading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>

        {/* 개발자용 안내 */}
        <details className="text-center">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            개발자 테스트 안내
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 text-left">
            <p className="mb-2">
              <strong>현재 상태:</strong> 스켈레톤 UI (실제 API 연동 전)
            </p>
            <p>
              <strong>TODO:</strong> 실제 회원가입 API 연동, 이메일 검증, 비밀번호 강도 체크
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
