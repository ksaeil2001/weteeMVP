/**
 * SignupFormStep - 회원가입 정보 입력 단계
 * Screen: S-002/S-006/S-007 (회원가입 폼)
 *
 * Related: F-001_회원가입_및_로그인.md
 *
 * 구현 사항:
 * - 이름, 이메일, 비밀번호, 전화번호(선택) 입력
 * - 학생 특화 필드: 학년(필수), 학교(선택)
 * - 학부모 특화 필드: 자녀와의 관계(필수)
 * - 실시간 비밀번호 규칙 검증
 * - 비밀번호 표시/숨김 토글
 * - 실제 회원가입 API 연동
 * - 성공 시 이메일 인증 페이지로 이동
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmail } from '@/lib/authApi';
import { isApiError, type ApiError } from '@/lib/apiClient';
import type { UserRoleCode, VerifyInviteCodeResponseData, StudentGrade, ParentRelationship } from '@/types/auth';
import type { UserRole } from './RoleSelectionStep';

interface SignupFormStepProps {
  role: UserRole;
  inviteCodeData?: VerifyInviteCodeResponseData & { code: string };
  onBack: () => void;
}

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

// 학년 옵션
const GRADE_OPTIONS: StudentGrade[] = ['중1', '중2', '중3', '고1', '고2', '고3', '재수생', '기타'];

// 학부모-자녀 관계 옵션
const RELATIONSHIP_OPTIONS: ParentRelationship[] = ['부모', '조부모', '기타'];

export default function SignupFormStep({ role, inviteCodeData, onBack }: SignupFormStepProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    // 학생 특화 필드
    grade: '' as StudentGrade | '',
    studentSchool: '',
    // 학부모 특화 필드
    relationship: '' as ParentRelationship | '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ApiError | null>(null);

  // 비밀번호 규칙 검증
  const passwordRules = useMemo(() => validatePasswordRules(formData.password), [formData.password]);

  // 비밀번호 유효성 (필수: 8자 이상, 대/소문자, 숫자)
  const isPasswordValid = useMemo(() => {
    return (
      passwordRules.minLength &&
      passwordRules.hasUppercase &&
      passwordRules.hasLowercase &&
      passwordRules.hasNumber
    );
  }, [passwordRules]);

  // 비밀번호 일치 확인
  const passwordsMatch = formData.password === formData.passwordConfirm && formData.passwordConfirm.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이전 메시지 초기화
    setErrorMessage(null);
    setSuccessMessage(null);
    setErrorDetails(null);

    // 클라이언트 검증: 비밀번호 규칙
    if (!isPasswordValid) {
      setErrorMessage('비밀번호가 규칙을 충족하지 않습니다. (8자 이상, 대/소문자, 숫자 포함)');
      return;
    }

    // 클라이언트 검증: 비밀번호 일치
    if (!passwordsMatch) {
      setErrorMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    // 학생 역할: 학년 필수
    if (role === 'student' && !formData.grade) {
      setErrorMessage('학년을 선택해주세요.');
      return;
    }

    // 학부모 역할: 자녀 관계 필수
    if (role === 'parent' && !formData.relationship) {
      setErrorMessage('자녀와의 관계를 선택해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 역할 코드 매핑
      const roleCode = role.toUpperCase() as UserRoleCode;

      // 프로필 데이터 구성
      const profile: Record<string, unknown> = {};

      if (role === 'student') {
        if (formData.grade) profile.grade = formData.grade;
        if (formData.studentSchool) profile.school = formData.studentSchool;
      }

      if (role === 'parent') {
        if (formData.relationship) profile.relationship = formData.relationship;
      }

      // 회원가입 API 호출
      const result = await registerWithEmail({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone || undefined, // 빈 문자열이면 undefined
        role: roleCode,
        inviteCode: inviteCodeData?.code,
        profile: Object.keys(profile).length > 0 ? profile as { subjects?: string[]; school?: string } : undefined,
      });

      // 성공 메시지 표시
      setSuccessMessage(
        '회원가입이 완료되었습니다! 이메일 인증 페이지로 이동합니다.'
      );

      // 2초 후 이메일 인증 페이지로 이동
      setTimeout(() => {
        router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
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

  // 규칙 체크 아이콘
  const RuleCheck = ({ valid, label }: { valid: boolean; label: string }) => (
    <div className={`flex items-center gap-2 text-xs ${valid ? 'text-green-600' : 'text-gray-400'}`}>
      {valid ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            이름 <span className="text-red-500">*</span>
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
            maxLength={50}
          />
        </div>

        {/* 이메일 */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            이메일 <span className="text-red-500">*</span>
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
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              disabled={isLoading}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="비밀번호 입력"
            />
            <EyeIcon show={showPassword} onClick={() => setShowPassword(!showPassword)} />
          </div>

          {/* 비밀번호 규칙 체크리스트 */}
          {formData.password.length > 0 && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg grid grid-cols-2 gap-1">
              <RuleCheck valid={passwordRules.minLength} label="8자 이상" />
              <RuleCheck valid={passwordRules.hasUppercase} label="대문자" />
              <RuleCheck valid={passwordRules.hasLowercase} label="소문자" />
              <RuleCheck valid={passwordRules.hasNumber} label="숫자" />
              <RuleCheck valid={passwordRules.hasSpecial} label="특수문자 (권장)" />
            </div>
          )}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label
            htmlFor="passwordConfirm"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              disabled={isLoading}
              value={formData.passwordConfirm}
              onChange={handleChange}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed ${
                formData.passwordConfirm.length > 0 && !passwordsMatch
                  ? 'border-red-300'
                  : 'border-gray-300'
              }`}
              placeholder="비밀번호를 다시 입력하세요"
            />
            <EyeIcon
              show={showPasswordConfirm}
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            />
          </div>
          {formData.passwordConfirm.length > 0 && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-600">비밀번호가 일치하지 않습니다.</p>
          )}
          {passwordsMatch && (
            <p className="mt-1 text-xs text-green-600">비밀번호가 일치합니다.</p>
          )}
        </div>

        {/* 전화번호 (선택) */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            전화번호 <span className="text-gray-400 text-xs">(선택)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            disabled={isLoading}
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="010-1234-5678"
          />
        </div>

        {/* 학생 특화 필드 */}
        {role === 'student' && (
          <>
            {/* 학년 (필수) */}
            <div>
              <label
                htmlFor="grade"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                학년 <span className="text-red-500">*</span>
              </label>
              <select
                id="grade"
                name="grade"
                required
                disabled={isLoading}
                value={formData.grade}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
              >
                <option value="">학년을 선택하세요</option>
                {GRADE_OPTIONS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>

            {/* 학교 (선택) */}
            <div>
              <label
                htmlFor="studentSchool"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                학교 <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              <input
                id="studentSchool"
                name="studentSchool"
                type="text"
                disabled={isLoading}
                value={formData.studentSchool}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="예: OO고등학교"
                maxLength={50}
              />
            </div>
          </>
        )}

        {/* 학부모 특화 필드 */}
        {role === 'parent' && (
          <div>
            <label
              htmlFor="relationship"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              자녀와의 관계 <span className="text-red-500">*</span>
            </label>
            <select
              id="relationship"
              name="relationship"
              required
              disabled={isLoading}
              value={formData.relationship}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
            >
              <option value="">관계를 선택하세요</option>
              {RELATIONSHIP_OPTIONS.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>
        )}

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
          disabled={isLoading || !!successMessage || !isPasswordValid || !passwordsMatch}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mt-6"
        >
          {isLoading ? '가입 중...' : '가입하기'}
        </button>
      </form>
    </div>
  );
}
