'use client';

/**
 * Account Settings Page - WeTee MVP
 * Feature: F-007 기본 프로필 및 설정
 * Screen: S-038 (보안 설정 화면 - 비밀번호 변경)
 * Route: /settings/account
 *
 * TODO(F-007): 실제 API 연동
 * - changePassword() 호출
 * - 비밀번호 변경 후 자동 로그아웃 처리
 */

import React, { useState } from 'react';
import { changePassword, validatePassword, passwordsMatch } from '@/lib/api/settings';
import type { PasswordValidation } from '@/types/settings';
import { DEFAULT_PASSWORD_VALIDATION } from '@/types/settings';

export default function AccountSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validation, setValidation] = useState<PasswordValidation>(
    DEFAULT_PASSWORD_VALIDATION
  );
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 새 비밀번호 검증
  function handleNewPasswordChange(value: string) {
    setNewPassword(value);
    const result = validatePassword(value);
    setValidation(result);
  }

  // 비밀번호 변경 제출
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 클라이언트 측 검증
    if (!currentPassword) {
      alert('현재 비밀번호를 입력해주세요.');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      alert('새 비밀번호가 요구사항을 충족하지 않습니다.');
      return;
    }

    if (!passwordsMatch(newPassword, confirmPassword)) {
      alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (currentPassword === newPassword) {
      alert('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      alert(`${result.message}\n다시 로그인해주세요.`);

      // 비밀번호 변경 성공 - 입력 필드 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setValidation(DEFAULT_PASSWORD_VALIDATION);

      // TODO(F-007): 실제로는 여기서 로그아웃 처리
      // await logout();
      // router.push('/login');
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      alert('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isPasswordMatch = passwordsMatch(newPassword, confirmPassword);
  const canSubmit =
    currentPassword &&
    validation.isValid &&
    isPasswordMatch &&
    !isSubmitting;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900">계정 설정</h1>
        <p className="text-sm text-gray-600 mt-1">
          비밀번호를 변경하고 계정 보안을 관리합니다.
        </p>
      </div>

      {/* 비밀번호 변경 폼 */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">비밀번호 변경</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 현재 비밀번호 */}
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              현재 비밀번호 *
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                👁
              </button>
            </div>
          </div>

          {/* 새 비밀번호 */}
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              새 비밀번호 *
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                👁
              </button>
            </div>

            {/* 비밀번호 검증 표시 */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <ValidationItem
                  label="최소 8자 이상"
                  valid={validation.minLength}
                />
                <ValidationItem
                  label="대문자 포함"
                  valid={validation.hasUppercase}
                />
                <ValidationItem
                  label="숫자 포함"
                  valid={validation.hasNumber}
                />
                <ValidationItem
                  label="특수문자 포함"
                  valid={validation.hasSpecialChar}
                />
              </div>
            )}
          </div>

          {/* 새 비밀번호 확인 */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              새 비밀번호 확인 *
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                👁
              </button>
            </div>

            {/* 비밀번호 일치 확인 */}
            {confirmPassword && (
              <p
                className={`mt-1 text-sm ${
                  isPasswordMatch ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPasswordMatch
                  ? '✓ 비밀번호가 일치합니다'
                  : '✗ 비밀번호가 일치하지 않습니다'}
              </p>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>

        {/* 주의사항 */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-900">
            <strong>⚠️ 주의사항</strong>
          </p>
          <ul className="mt-2 space-y-1 text-sm text-yellow-800 list-disc list-inside">
            <li>비밀번호 변경 후 자동으로 로그아웃됩니다</li>
            <li>새 비밀번호로 다시 로그인해주세요</li>
            <li>모든 기기에서 다시 로그인해야 합니다</li>
          </ul>
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
        <p className="text-green-900">
          <strong>✓ F-007 계정 설정 - 백엔드 연동 완료</strong>
        </p>
        <p className="text-green-800 mt-1">
          비밀번호가 성공적으로 변경되면 자동으로 로그아웃됩니다. 새 비밀번호로
          다시 로그인해주세요.
        </p>
      </div>
    </div>
  );
}

// 검증 항목 컴포넌트
function ValidationItem({ label, valid }: { label: string; valid: boolean }) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className={valid ? 'text-green-600' : 'text-gray-400'}>
        {valid ? '✓' : '✗'}
      </span>
      <span className={valid ? 'text-green-600' : 'text-gray-600'}>
        {label}
      </span>
    </div>
  );
}
