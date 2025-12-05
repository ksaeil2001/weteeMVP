/**
 * RoleSelectionStep - 회원가입 역할 선택 단계
 * Screen: S-001 (역할 선택/가입 시작)
 *
 * Related: F-001_회원가입_및_로그인.md
 *
 * 구현 사항:
 * - 선생님/학생/학부모 역할 선택 UI
 * - 학생/학부모는 초대 코드가 필요함을 안내
 */

'use client';

import React from 'react';

export type UserRole = 'teacher' | 'student' | 'parent';

interface RoleSelectionStepProps {
  onSelect: (role: UserRole) => void;
}

export default function RoleSelectionStep({ onSelect }: RoleSelectionStepProps) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-center mb-2">회원가입</h2>
      <p className="text-center text-gray-600 mb-8">
        어떤 사용자이신가요?
      </p>

      <div className="space-y-4">
        {/* 선생님 */}
        <button
          onClick={() => onSelect('teacher')}
          className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-blue-200 transition-colors">
              <span role="img" aria-label="선생님">T</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">선생님</h3>
              <p className="text-sm text-gray-600">
                과외를 진행하고 학생을 관리합니다
              </p>
            </div>
            <div className="text-blue-600 text-xl group-hover:translate-x-1 transition-transform">
              &rarr;
            </div>
          </div>
        </button>

        {/* 학생 */}
        <button
          onClick={() => onSelect('student')}
          className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-green-200 transition-colors">
              <span role="img" aria-label="학생">S</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">학생</h3>
              <p className="text-sm text-gray-600">
                수업을 듣고 숙제를 제출합니다{' '}
                <span className="text-orange-600 font-medium">(초대 코드 필요)</span>
              </p>
            </div>
            <div className="text-green-600 text-xl group-hover:translate-x-1 transition-transform">
              &rarr;
            </div>
          </div>
        </button>

        {/* 학부모 */}
        <button
          onClick={() => onSelect('parent')}
          className="w-full p-6 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-purple-200 transition-colors">
              <span role="img" aria-label="학부모">P</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">학부모</h3>
              <p className="text-sm text-gray-600">
                자녀의 학습을 확인하고 비용을 결제합니다{' '}
                <span className="text-orange-600 font-medium">(초대 코드 필요)</span>
              </p>
            </div>
            <div className="text-purple-600 text-xl group-hover:translate-x-1 transition-transform">
              &rarr;
            </div>
          </div>
        </button>
      </div>

      {/* 로그인 링크 */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}
