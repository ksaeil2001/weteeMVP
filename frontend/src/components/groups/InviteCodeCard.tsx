/**
 * InviteCodeCard - 초대 코드 카드 컴포넌트
 * Feature: F-002 과외 그룹 생성 및 매칭
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md
 * - 구현 프롬프트 #03: 초대 코드 시스템
 *
 * 역할:
 * - 개별 초대 코드 정보 표시
 * - 코드 복사 기능
 * - 상태 표시 (활성/만료/사용됨)
 */

'use client';

import React, { useState } from 'react';
import type { InviteCode } from '@/types/group';

interface InviteCodeCardProps {
  code: InviteCode;
  onCopy?: (code: string) => void;
}

export default function InviteCodeCard({ code, onCopy }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false);

  // 만료 여부 확인
  const isExpired = new Date(code.expiresAt) < new Date();

  // 사용 완료 여부 확인
  const isUsed = code.currentUses !== undefined && code.currentUses >= code.maxUses;

  // 코드 복사 핸들러
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.inviteCode);
      setCopied(true);
      onCopy?.(code.inviteCode);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  // 역할 라벨
  const roleLabel = code.role === 'student' ? '학생용' : '학부모용';
  const roleColor = code.role === 'student'
    ? 'bg-green-100 text-green-700'
    : 'bg-purple-100 text-purple-700';

  // 상태에 따른 카드 스타일
  const cardStyle = isUsed
    ? 'bg-gray-50 border-gray-300'
    : isExpired
      ? 'bg-red-50 border-red-200'
      : 'bg-white border-gray-200';

  // 만료 시간 포매팅
  const formatExpiresAt = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`p-4 border rounded-lg ${cardStyle}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* 코드 및 역할 */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl font-mono font-bold tracking-wider">
              {code.inviteCode}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${roleColor}`}>
              {roleLabel}
            </span>

            {/* 상태 배지 */}
            {isUsed && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                사용됨
              </span>
            )}
            {isExpired && !isUsed && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-200 text-red-700 rounded">
                만료됨
              </span>
            )}
          </div>

          {/* 만료 시간 및 사용 횟수 */}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>
              만료: {formatExpiresAt(code.expiresAt)}
            </span>
            {code.currentUses !== undefined && (
              <span>
                사용: {code.currentUses}/{code.maxUses}회
              </span>
            )}
          </div>
        </div>

        {/* 복사 버튼 (활성 상태일 때만) */}
        {!isUsed && !isExpired && (
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copied ? '복사됨!' : '복사'}
          </button>
        )}
      </div>
    </div>
  );
}
