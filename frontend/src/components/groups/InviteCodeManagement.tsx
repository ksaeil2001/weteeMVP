/**
 * InviteCodeManagement - 초대 코드 관리 컴포넌트
 * Feature: F-002 과외 그룹 생성 및 매칭
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md
 * - 구현 프롬프트 #03: 초대 코드 시스템
 *
 * 역할:
 * - 초대 코드 목록 표시
 * - 학생/학부모용 초대 코드 생성
 * - 코드 복사 및 관리
 */

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createInviteCode, fetchInviteCodesByGroup } from '@/lib/api/groups';
import type { InviteCode } from '@/types/group';
import InviteCodeCard from './InviteCodeCard';

interface InviteCodeManagementProps {
  groupId: string;
  groupName: string;
}

export default function InviteCodeManagement({
  groupId,
  groupName: _groupName, // Reserved for future use
}: InviteCodeManagementProps) {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState<'student' | 'parent' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 초대 코드 목록 로드
  const loadInviteCodes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const codes = await fetchInviteCodesByGroup(groupId);
      setInviteCodes(codes);
    } catch (err) {
      console.error('[InviteCodeManagement] 초대 코드 목록 로드 실패:', err);
      setError('초대 코드 목록을 불러오는 데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // 컴포넌트 마운트 시 로드
  useEffect(() => {
    loadInviteCodes();
  }, [loadInviteCodes]);

  // 초대 코드 생성
  const handleGenerateCode = async (role: 'student' | 'parent') => {
    try {
      setIsGenerating(role);
      setError(null);
      setSuccessMessage(null);

      const newCode = await createInviteCode({
        groupId,
        role,
        maxUses: 1,
      });

      // 목록 새로고침
      await loadInviteCodes();

      // 성공 메시지
      const roleLabel = role === 'student' ? '학생' : '학부모';
      setSuccessMessage(`${roleLabel}용 초대 코드가 생성되었습니다: ${newCode.inviteCode}`);

      // 자동으로 클립보드에 복사
      try {
        await navigator.clipboard.writeText(newCode.inviteCode);
      } catch {
        // 클립보드 복사 실패는 무시 (사용자가 수동으로 복사 가능)
      }

      // 3초 후 메시지 숨김
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('[InviteCodeManagement] 초대 코드 생성 실패:', err);
      setError('초대 코드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsGenerating(null);
    }
  };

  // 코드 복사 핸들러
  const handleCopy = (code: string) => {
    setSuccessMessage(`초대 코드 "${code}"가 클립보드에 복사되었습니다!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">초대 코드 관리</h2>

      {/* 코드 생성 버튼 */}
      <div className="space-y-4 mb-6">
        {/* 학생 초대 코드 생성 */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div>
            <p className="font-medium text-gray-900">학생 초대 코드</p>
            <p className="text-sm text-gray-600">
              학생을 초대할 수 있는 코드를 생성합니다
            </p>
          </div>
          <button
            onClick={() => handleGenerateCode('student')}
            disabled={isGenerating !== null}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating === 'student' ? '생성 중...' : '생성하기'}
          </button>
        </div>

        {/* 학부모 초대 코드 생성 */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div>
            <p className="font-medium text-gray-900">학부모 초대 코드</p>
            <p className="text-sm text-gray-600">
              학부모를 초대할 수 있는 코드를 생성합니다
            </p>
          </div>
          <button
            onClick={() => handleGenerateCode('parent')}
            disabled={isGenerating !== null}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating === 'parent' ? '생성 중...' : '생성하기'}
          </button>
        </div>
      </div>

      {/* 성공 메시지 */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 생성된 코드 목록 */}
      {inviteCodes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            생성된 초대 코드 ({inviteCodes.length}개)
          </h3>
          <div className="space-y-3">
            {inviteCodes.map((code) => (
              <InviteCodeCard
                key={code.inviteCode}
                code={code}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      )}

      {/* 로딩 중 */}
      {isLoading && inviteCodes.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">초대 코드를 불러오는 중...</p>
        </div>
      )}

      {/* 코드 없음 */}
      {!isLoading && inviteCodes.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">아직 생성된 초대 코드가 없습니다.</p>
          <p className="text-xs mt-1">
            위 버튼을 클릭하여 학생 또는 학부모용 초대 코드를 생성하세요.
          </p>
        </div>
      )}

      {/* 사용 안내 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">초대 코드 사용 방법</span>
          <br />
          1. 초대 코드를 생성하고 복사합니다.
          <br />
          2. 카카오톡이나 문자로 초대 코드를 학생/학부모에게 전달합니다.
          <br />
          3. 학생/학부모는 회원가입 시 초대 코드를 입력하면 자동으로 그룹에 참여됩니다.
        </p>
      </div>
    </div>
  );
}
