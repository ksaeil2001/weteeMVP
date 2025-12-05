/**
 * SignupFormStep - 회원가입 정보 입력 단계
 * Screen: S-002/S-006/S-007 (회원가입 폼)
 *
 * Related: F-001_회원가입_및_로그인.md
 *
 * 구현 사항:
 * - 이름, 이메일, 비밀번호, 전화번호 입력
 * - 실제 회원가입 API 연동
 * - 학생/학부모는 초대 코드와 함께 가입
 * - 성공 시 로그인 페이지로 이동
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmail } from '@/lib/authApi';
import { isApiError, type ApiError } from '@/lib/apiClient';
import type { UserRoleCode, VerifyInviteCodeResponseData } from '@/types/auth';
import type { UserRole } from './RoleSelectionStep';

interface SignupFormStepProps {
  role: UserRole;
  inviteCodeData?: VerifyInviteCodeResponseData & { code: string };
  onBack: () => void;
}

export default function SignupFormStep({ role, inviteCodeData, onBack }: SignupFormStepProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ApiError | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이전 메시지 초기화
    setErrorMessage(null);
    setSuccessMessage(null);
    setErrorDetails(null);

    // 클라이언트 검증
    if (formData.password !== formData.passwordConfirm) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 역할 코드 매핑
      const roleCode = role.toUpperCase() as UserRoleCode;

      // 회원가입 API 호출
      await registerWithEmail({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: roleCode,
        inviteCode: inviteCodeData?.code, // 학생/학부모만 전송
      });

      // 성공 메시지 표시
      setSuccessMessage(
        '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.'
      );

      // 2초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      // 개발 환경에서 콘솔에 에러 출력
      if (process.env.NODE_ENV === 'development') {
        console.error('회원가입 에러:', error);
      }

      if (isApiError(error)) {
        setErrorDetails(error);

        // HTTP 상태 코드별 에러 메시지 처리
        if (error.status === 409) {
          setErrorMessage('이미 가입된 이메일입니다. 다른 이메일을 사용해 주세요.');
        } else if (error.status === 400 || error.status === 422) {
          setErrorMessage(error.message ?? '입력값을 다시 확인해 주세요.');
        } else if (error.status === 500) {
          const detailMsg =
            process.env.NODE_ENV === 'development' && error.code
              ? ` (에러 코드: ${error.code})`
              : '';
          setErrorMessage(
            `서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.${detailMsg}`
          );
        } else if (error.status === undefined) {
          setErrorMessage(
            '서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.'
          );
        } else {
          setErrorMessage(
            error.message ?? '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
          );
        }
      } else {
        console.error('예상치 못한 에러:', error);
        setErrorMessage('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleLabels: Record<UserRole, string> = {
    teacher: '선생님',
    student: '학생',
    parent: '학부모',
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
      >
        <span>&larr;</span> 뒤로
      </button>

      <h2 className="text-2xl font-bold text-center mb-2">
        {roleLabels[role]} 정보 입력
      </h2>
      <p className="text-center text-gray-600 mb-6">
        회원가입에 필요한 정보를 입력해주세요
      </p>

      {/* 초대 코드로 가입 시 그룹 정보 표시 */}
      {inviteCodeData && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">{inviteCodeData.teacherName}</span> 선생님의{' '}
            <span className="font-medium">{inviteCodeData.groupName}</span> 그룹에 가입합니다
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            disabled={isLoading}
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            disabled={isLoading}
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            disabled={isLoading}
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="8자 이상, 대/소문자, 숫자, 특수문자 포함"
          />
          <p className="mt-1 text-xs text-gray-500">
            8자 이상, 대문자/소문자/숫자/특수문자 포함
          </p>
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
            disabled={isLoading}
            value={formData.passwordConfirm}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="비밀번호를 다시 입력하세요"
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
            disabled={isLoading}
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="010-1234-5678"
          />
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errorMessage}</p>

            {/* 개발 환경에서만 상세 정보 표시 */}
            {process.env.NODE_ENV === 'development' && errorDetails && (
              <details className="mt-2">
                <summary className="text-xs text-red-500 cursor-pointer hover:text-red-700">
                  개발자 정보 (상세)
                </summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 overflow-auto max-h-40">
                  {JSON.stringify(
                    {
                      status: errorDetails.status,
                      code: errorDetails.code,
                      message: errorDetails.message,
                      details: errorDetails.details,
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            )}
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
          disabled={isLoading || !!successMessage}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mt-6"
        >
          {isLoading ? '가입 중...' : '가입하기'}
        </button>
      </form>
    </div>
  );
}
