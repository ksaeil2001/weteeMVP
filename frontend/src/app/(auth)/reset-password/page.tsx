/**
 * Reset Password Page - WeTee MVP
 * Screen: S-006 (비밀번호 재설정 화면)
 *
 * Based on: F-001_회원가입_및_로그인.md
 *
 * 구현 사항:
 * - URL 쿼리에서 토큰 추출
 * - 새 비밀번호 입력 및 확인
 * - 실시간 비밀번호 규칙 검증
 * - 비밀번호 표시/숨김 토글
 * - 성공 시 로그인 페이지로 이동
 */

'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { confirmPasswordReset } from '@/lib/authApi';
import { isApiError, type ApiError } from '@/lib/apiClient';

// 비밀번호 규칙 검증
interface PasswordRules {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function validatePasswordRules(password: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 비밀번호 규칙 검증
  const passwordRules = useMemo(() => validatePasswordRules(password), [password]);

  // 비밀번호 유효성 검사 (필수 규칙: 8자 이상, 대/소문자, 숫자)
  const isPasswordValid = useMemo(() => {
    return (
      passwordRules.minLength &&
      passwordRules.hasUppercase &&
      passwordRules.hasLowercase &&
      passwordRules.hasNumber
    );
  }, [passwordRules]);

  // 비밀번호 일치 확인
  const passwordsMatch = password === passwordConfirm && passwordConfirm.length > 0;

  // 토큰 없음 경고
  useEffect(() => {
    if (!token) {
      setErrorMessage('유효하지 않은 링크입니다. 비밀번호 찾기를 다시 진행해주세요.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('유효하지 않은 링크입니다.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('비밀번호가 규칙을 충족하지 않습니다.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmPasswordReset({
        token,
        newPassword: password,
      });

      if (result.reset) {
        setSuccessMessage('비밀번호가 성공적으로 변경되었습니다!');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error) {
      if (isApiError(error)) {
        const err = error as ApiError;
        if (err.status === 400) {
          setErrorMessage('유효하지 않은 토큰입니다. 비밀번호 찾기를 다시 진행해주세요.');
        } else if (err.status === 410) {
          setErrorMessage('만료된 링크입니다. 비밀번호 찾기를 다시 진행해주세요.');
        } else {
          setErrorMessage(err.message || '비밀번호 재설정 중 오류가 발생했습니다.');
        }
      } else {
        setErrorMessage('네트워크 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 규칙 체크 아이콘
  const RuleCheck = ({ valid, label }: { valid: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-sm ${valid ? 'text-green-600' : 'text-gray-400'}`}>
      {valid ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
      )}
      <span>{label}</span>
    </div>
  );

  // 눈 아이콘 (비밀번호 표시/숨김)
  const EyeIcon = ({ show, onClick }: { show: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      aria-label={show ? '비밀번호 숨기기' : '비밀번호 표시'}
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      )}
    </button>
  );

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
          <h2 className="text-2xl font-bold text-center mb-2">새 비밀번호 설정</h2>
          <p className="text-center text-gray-600 mb-6">
            새로 사용할 비밀번호를 입력해주세요.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 새 비밀번호 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                새 비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={isLoading || !!successMessage || !token}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="새 비밀번호 입력"
                />
                <EyeIcon show={showPassword} onClick={() => setShowPassword(!showPassword)} />
              </div>

              {/* 비밀번호 규칙 체크리스트 */}
              {password.length > 0 && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1">
                  <RuleCheck valid={passwordRules.minLength} label="8자 이상" />
                  <RuleCheck valid={passwordRules.hasUppercase} label="대문자 포함" />
                  <RuleCheck valid={passwordRules.hasLowercase} label="소문자 포함" />
                  <RuleCheck valid={passwordRules.hasNumber} label="숫자 포함" />
                  <RuleCheck valid={passwordRules.hasSpecial} label="특수문자 포함 (권장)" />
                </div>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label
                htmlFor="passwordConfirm"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  disabled={isLoading || !!successMessage || !token}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    passwordConfirm.length > 0 && !passwordsMatch
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                  placeholder="비밀번호 다시 입력"
                />
                <EyeIcon
                  show={showPasswordConfirm}
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                />
              </div>
              {passwordConfirm.length > 0 && !passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">비밀번호가 일치하지 않습니다.</p>
              )}
              {passwordsMatch && (
                <p className="mt-1 text-sm text-green-600">비밀번호가 일치합니다.</p>
              )}
            </div>

            {/* 에러 메시지 */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            {/* 성공 메시지 */}
            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid || !passwordsMatch || !!successMessage || !token}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>

          {/* 토큰이 없거나 만료된 경우 */}
          {!token && (
            <div className="mt-4 text-center">
              <Link
                href="/forgot-password"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                비밀번호 찾기 다시 진행하기
              </Link>
            </div>
          )}
        </div>

        {/* 로그인 링크 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            비밀번호가 기억나셨나요?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
