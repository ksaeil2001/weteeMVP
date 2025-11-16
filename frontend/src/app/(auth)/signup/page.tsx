/**
 * Signup Page - WeTee MVP
 * Screen: S-004 (회원가입 화면)
 *
 * Based on: F-001_회원가입_및_로그인.md
 *
 * 현재 상태: Step 12 - 실제 회원가입 API 연동 완료
 *
 * 구현 사항:
 * - POST /api/v1/auth/register 실제 API 연동
 * - 로딩 상태 관리
 * - 에러/성공 메시지 표시
 * - 회원가입 성공 시 로그인 페이지로 이동
 *
 * TODO (향후):
 * - 이메일 인증 플로우
 * - 비밀번호 강도 체크 UI
 * - 실시간 이메일 중복 검사
 * - 폼 필드별 상세 검증 메시지
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithEmail } from '@/lib/authApi';
import type { ApiError } from '@/lib/apiClient';
import type { UserRoleCode } from '@/types/auth';

type UserRole = 'teacher' | 'student' | 'parent';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    role: 'teacher' as UserRole,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * 회원가입 처리 핸들러
   * POST /api/v1/auth/register 실제 API 호출
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이전 메시지 초기화
    setErrorMessage(null);
    setSuccessMessage(null);

    // 클라이언트 검증
    if (formData.password !== formData.passwordConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 역할 코드 매핑: 'teacher' → 'TEACHER'
      const roleCode = formData.role.toUpperCase() as UserRoleCode;

      // 회원가입 API 호출
      await registerWithEmail({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: roleCode,
        // profile은 현재 폼에서 수집하지 않으므로 생략
        // 추후 확장 시 선택적으로 추가
      });

      // 성공 메시지 표시
      setSuccessMessage(
        '회원가입이 완료되었습니다. 이메일로 전송된 인증 메일을 확인한 후 로그인해 주세요.'
      );

      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      const err = error as ApiError;

      // HTTP 상태 코드별 에러 메시지 처리
      if (err.status === 409) {
        setErrorMessage('이미 가입된 이메일입니다. 로그인 화면으로 이동해 주세요.');
      } else if (err.status === 400) {
        setErrorMessage(err.message ?? '입력값을 다시 확인해 주세요.');
      } else {
        setErrorMessage(err.message ?? '회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
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

            {/* 전화번호 */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                전화번호
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="010-1234-5678"
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

            {/* 에러 메시지 */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            {/* 성공 메시지 */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mt-6"
            >
              {isLoading ? '회원가입 중...' : '회원가입'}
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
          <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 text-left space-y-2">
            <p>
              <strong>현재 상태:</strong> Step 12 - 회원가입 API 연동 완료
            </p>
            <p>
              <strong>API 엔드포인트:</strong> POST /api/v1/auth/register
            </p>
            <p>
              <strong>기능:</strong> 실제 백엔드 API 호출, 로딩 상태 관리, 에러/성공 메시지 표시
            </p>
            <p>
              <strong>주의:</strong> 백엔드가 실행 중이지 않으면 네트워크 에러 발생
            </p>
            <div className="pt-2 border-t border-gray-300">
              <p className="font-semibold mb-1">테스트 시나리오:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>정상 회원가입: 모든 필드 입력 후 제출</li>
                <li>이메일 중복(409): 이미 가입된 이메일 사용</li>
                <li>입력값 오류(400): 잘못된 형식의 이메일/비밀번호</li>
                <li>비밀번호 불일치: 비밀번호 확인 불일치 시 클라이언트 검증</li>
              </ul>
            </div>
            <p className="pt-2 border-t border-gray-300">
              <strong>다음 단계:</strong> 이메일 인증, 비밀번호 강도 체크 UI, 토큰 관리 고도화
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
