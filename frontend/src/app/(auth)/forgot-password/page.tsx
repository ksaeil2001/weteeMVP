/**
 * Forgot Password Page - WeTee MVP
 * Screen: S-005 (비밀번호 찾기 화면)
 *
 * Based on: F-001_회원가입_및_로그인.md
 *
 * 구현 사항:
 * - 이메일 입력
 * - 비밀번호 재설정 링크 발송 요청
 * - 보안상 이메일 존재 여부와 관계없이 동일한 메시지 표시
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/authApi';
import { isApiError, type ApiError } from '@/lib/apiClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      await requestPasswordReset({ email });
      setIsSubmitted(true);
    } catch (error) {
      if (isApiError(error)) {
        const err = error as ApiError;
        if (err.status === 429) {
          setErrorMessage('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else if (err.status === 500) {
          setErrorMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          // 보안상 이메일 존재 여부를 노출하지 않음
          setIsSubmitted(true);
        }
      } else {
        setErrorMessage('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* 로고 & 타이틀 */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-blue-600">WeTee</h1>
          </Link>
          <p className="mt-2 text-gray-600">과외의 모든 것, 하나로</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          {!isSubmitted ? (
            <>
              {/* 뒤로가기 */}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <span>&larr;</span> 로그인으로 돌아가기
              </Link>

              <h2 className="text-2xl font-bold text-center mb-2">비밀번호 찾기</h2>
              <p className="text-center text-gray-600 mb-6">
                가입하신 이메일 주소를 입력하시면
                <br />
                비밀번호 재설정 링크를 보내드립니다.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
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

                {/* 에러 메시지 */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                  </div>
                )}

                {/* 제출 버튼 */}
                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                  {isLoading ? '발송 중...' : '재설정 링크 발송'}
                </button>
              </form>
            </>
          ) : (
            /* 발송 완료 메시지 */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold mb-2">이메일을 확인해주세요</h2>
              <p className="text-gray-600 mb-6">
                <span className="font-medium text-blue-600">{email}</span>
                <br />
                으로 비밀번호 재설정 링크를 발송했습니다.
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  이메일이 도착하지 않으면 스팸 폴더를 확인해주세요.
                </span>
              </p>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-center"
                >
                  로그인 페이지로 이동
                </Link>

                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  다른 이메일로 다시 시도
                </button>
              </div>
            </div>
          )}
        </div>

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
    </div>
  );
}
