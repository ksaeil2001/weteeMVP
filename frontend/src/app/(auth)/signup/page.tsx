/**
 * Signup Page - WeTee MVP
 * Screen: S-001, S-003, S-002/S-006/S-007 (회원가입 3단계 플로우)
 *
 * Based on: F-001_회원가입_및_로그인.md
 *
 * 구현 사항:
 * - 3단계 회원가입 플로우:
 *   1. 역할 선택 (선생님/학생/학부모)
 *   2. 초대 코드 입력 (학생/학부모만)
 *   3. 정보 입력 및 회원가입
 *
 * 보안 요구사항:
 * - 선생님: 초대 코드 없이 독립 가입 가능
 * - 학생/학부모: 반드시 초대 코드를 통해서만 가입 가능
 * - 가입 즉시 해당 그룹에 자동 추가됨
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RoleSelectionStep,
  InviteCodeStep,
  SignupFormStep,
  type UserRole,
} from '@/components/auth';
import type { VerifyInviteCodeResponseData } from '@/types/auth';

type SignupStep = 'role' | 'inviteCode' | 'form';

export default function SignupPage() {
  // 현재 단계
  const [currentStep, setCurrentStep] = useState<SignupStep>('role');

  // 선택한 역할
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // 초대 코드 정보 (학생/학부모)
  const [inviteCodeData, setInviteCodeData] = useState<
    (VerifyInviteCodeResponseData & { code: string }) | null
  >(null);

  // 역할 선택 핸들러
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);

    if (role === 'teacher') {
      // 선생님은 바로 가입 폼으로
      setCurrentStep('form');
    } else {
      // 학생/학부모는 초대 코드 입력으로
      setCurrentStep('inviteCode');
    }
  };

  // 초대 코드 검증 성공 핸들러
  const handleInviteCodeVerified = (
    data: VerifyInviteCodeResponseData & { code: string }
  ) => {
    setInviteCodeData(data);
    setCurrentStep('form');
  };

  // 역할 선택으로 돌아가기
  const handleBackToRole = () => {
    setSelectedRole(null);
    setInviteCodeData(null);
    setCurrentStep('role');
  };

  // 초대 코드 입력으로 돌아가기
  const handleBackToInviteCode = () => {
    setInviteCodeData(null);
    setCurrentStep('inviteCode');
  };

  // 뒤로가기 핸들러 (form 단계에서)
  const handleBackFromForm = () => {
    if (selectedRole === 'teacher') {
      handleBackToRole();
    } else {
      handleBackToInviteCode();
    }
  };

  // 현재 단계 번호 계산
  const getCurrentStepNumber = () => {
    if (currentStep === 'role') return 1;
    if (currentStep === 'inviteCode') return 2;
    if (currentStep === 'form') {
      return selectedRole === 'teacher' ? 2 : 3;
    }
    return 1;
  };

  // 총 단계 수
  const getTotalSteps = () => {
    return selectedRole === 'teacher' ? 2 : 3;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full">
        {/* 로고 & 타이틀 */}
        <div className="text-center mb-6">
          <Link href="/">
            <h1 className="text-4xl font-bold text-blue-600">WeTee</h1>
          </Link>
          <p className="mt-2 text-gray-600">과외의 모든 것, 하나로</p>
        </div>

        {/* 진행 상태 표시 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {/* 단계 1 */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                getCurrentStepNumber() >= 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              1
            </div>

            {/* 선생님이 아닌 경우에만 2단계 표시 */}
            {(selectedRole !== 'teacher' || !selectedRole) && (
              <>
                <div
                  className={`w-8 h-1 transition-colors ${
                    getCurrentStepNumber() >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    getCurrentStepNumber() >= 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  2
                </div>
              </>
            )}

            <div
              className={`w-8 h-1 transition-colors ${
                getCurrentStepNumber() >= getTotalSteps()
                  ? 'bg-blue-600'
                  : 'bg-gray-200'
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                getCurrentStepNumber() >= getTotalSteps()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {getTotalSteps()}
            </div>
          </div>
          <div className="mt-2 text-center text-sm text-gray-600">
            {currentStep === 'role' && '역할 선택'}
            {currentStep === 'inviteCode' && '초대 코드 입력'}
            {currentStep === 'form' && '정보 입력'}
          </div>
        </div>

        {/* 단계별 컴포넌트 */}
        {currentStep === 'role' && (
          <RoleSelectionStep onSelect={handleRoleSelect} />
        )}

        {currentStep === 'inviteCode' && selectedRole && selectedRole !== 'teacher' && (
          <InviteCodeStep
            role={selectedRole as 'student' | 'parent'}
            onVerified={handleInviteCodeVerified}
            onBack={handleBackToRole}
          />
        )}

        {currentStep === 'form' && selectedRole && (
          <SignupFormStep
            role={selectedRole}
            inviteCodeData={inviteCodeData ?? undefined}
            onBack={handleBackFromForm}
          />
        )}
      </div>
    </div>
  );
}
