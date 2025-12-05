/**
 * InviteCodeStep - 초대 코드 입력 단계
 * Screen: S-003 (초대 코드 입력)
 *
 * Related: F-001_회원가입_및_로그인.md, F-002_과외_그룹_생성_및_매칭.md
 *
 * 구현 사항:
 * - 6자리 초대 코드 입력 UI
 * - 초대 코드 실시간 검증
 * - 그룹 및 선생님 정보 표시
 * - 에러 상태 처리 (만료, 역할 불일치, 이미 사용됨 등)
 */

'use client';

import React, { useState } from 'react';
import { verifyInviteCode } from '@/lib/authApi';
import { isApiError } from '@/lib/apiClient';
import type { VerifyInviteCodeResponseData } from '@/types/auth';

interface InviteCodeStepProps {
  role: 'student' | 'parent';
  onVerified: (data: VerifyInviteCodeResponseData & { code: string }) => void;
  onBack: () => void;
}

export default function InviteCodeStep({ role, onVerified, onBack }: InviteCodeStepProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<VerifyInviteCodeResponseData | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 영문 대문자와 숫자만 허용, 자동으로 대문자 변환
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(value.slice(0, 6));
    setErrorMessage(null);
    setVerifiedData(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 클라이언트 검증
    if (code.length !== 6) {
      setErrorMessage('초대 코드는 6자리입니다');
      return;
    }

    setIsLoading(true);

    try {
      // 초대 코드 검증 API 호출
      const roleType = role.toUpperCase() as 'STUDENT' | 'PARENT';
      const data = await verifyInviteCode({
        code,
        roleType,
      });

      // 검증 성공 → 데이터 표시
      setVerifiedData(data);

    } catch (error) {
      // 개발 환경에서 콘솔에 에러 출력
      if (process.env.NODE_ENV === 'development') {
        console.error('초대 코드 검증 에러:', error);
      }

      if (isApiError(error)) {
        // 에러 코드별 메시지 처리
        const errorCode = error.code;
        if (errorCode === 'INVITE002') {
          setErrorMessage('초대 코드가 만료되었습니다. 선생님께 새 코드를 요청해주세요.');
        } else if (errorCode === 'INVITE003') {
          setErrorMessage('이미 사용된 초대 코드입니다. 선생님께 새 코드를 요청해주세요.');
        } else if (errorCode === 'INVITE004') {
          setErrorMessage(error.message || '이 초대 코드는 다른 역할용입니다.');
        } else {
          setErrorMessage(error.message || '유효하지 않은 초대 코드입니다. 다시 확인해주세요.');
        }
      } else {
        setErrorMessage('초대 코드 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = () => {
    if (verifiedData) {
      onVerified({ ...verifiedData, code });
    }
  };

  const roleLabel = role === 'student' ? '학생' : '학부모';

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
      >
        <span>&larr;</span> 뒤로
      </button>

      <h2 className="text-2xl font-bold text-center mb-2">초대 코드 입력</h2>
      <p className="text-center text-gray-600 mb-8">
        선생님께 받은 초대 코드를 입력해주세요
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 초대 코드 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            초대 코드 (6자리)
          </label>
          <input
            type="text"
            value={code}
            onChange={handleCodeChange}
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest uppercase disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="AB12CD"
            disabled={isLoading || !!verifiedData}
            autoFocus
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-gray-500">
            영문 대문자와 숫자로 이루어진 6자리 코드입니다
          </p>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* 검증 성공 시 그룹 정보 표시 */}
        {verifiedData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium mb-2">
              초대 코드가 확인되었습니다!
            </p>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-medium">그룹:</span> {verifiedData.groupName}</p>
              <p><span className="font-medium">과목:</span> {verifiedData.subject}</p>
              <p><span className="font-medium">선생님:</span> {verifiedData.teacherName}</p>
            </div>
          </div>
        )}

        {/* 버튼 */}
        {!verifiedData ? (
          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '확인 중...' : '확인'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleProceed}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            {roleLabel} 정보 입력하기
          </button>
        )}
      </form>

      {/* 안내 메시지 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">초대 코드가 없으신가요?</span><br />
          선생님께 카카오톡이나 문자로 초대 코드를 요청해주세요.
        </p>
      </div>
    </div>
  );
}
