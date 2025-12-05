/**
 * Group Detail Page - WeTee MVP
 * Screen: S-008 (그룹 상세 화면)
 * Route: /groups/[groupId]
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md (시나리오 2, 3)
 * - UX_UI_설계서.md (S-008)
 * - API_명세서.md (6.2.5 그룹 상세 조회)
 *
 * 역할:
 * - 그룹 기본 정보 표시
 * - 선생님: 그룹 수정, 학생/학부모 초대 코드 생성
 * - 학생/학부모: 그룹 정보 조회만 가능
 *
 * TODO (향후 디버깅/연결 단계):
 * - 실제 그룹 상세 API 연동 (fetchGroupById)
 * - 초대 코드 생성 API 연동 (createInviteCode)
 * - 그룹 수정/삭제 기능
 * - 학생 목록 표시
 * - 탭 UI (개요/학생/일정/출결/진도/정산)
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchGroupById } from '@/lib/api/groups';
import type { Group } from '@/types/group';
import { InviteCodeManagement } from '@/components/groups';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params?.groupId as string;

  const { currentRole, isAuthenticated } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 그룹 상세 로드
  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId) return;

      try {
        setIsLoading(true);
        setError(null);

        const groupData = await fetchGroupById(groupId);
        setGroup(groupData);
      } catch (err) {
        console.error('[GroupDetailPage] 그룹 상세 로드 실패:', err);
        setError('그룹을 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadGroup();
    }
  }, [groupId, isAuthenticated]);

  // 뒤로 가기
  const handleBack = () => {
    router.push('/groups');
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-500">그룹 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러
  if (error || !group) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {error || '그룹을 찾을 수 없습니다.'}
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← 그룹 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-gray-600 hover:text-gray-900 mb-2"
        >
          &larr; 그룹 목록
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
        <div className="mt-2 flex gap-2">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            {group.subject}
          </span>
          {group.level && (
            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
              {group.level}
            </span>
          )}
        </div>
      </div>

      {/* 그룹 기본 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">선생님</p>
            <p className="text-base text-gray-900">{group.teacher.name}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">학생 수</p>
            <p className="text-base text-gray-900">{group.memberCount}명</p>
          </div>

          {group.feePerSession && (
            <div>
              <p className="text-sm font-medium text-gray-700">수업료 (회당)</p>
              <p className="text-base text-gray-900">
                {group.feePerSession.toLocaleString()}원
              </p>
            </div>
          )}

          {group.sessionDuration && (
            <div>
              <p className="text-sm font-medium text-gray-700">수업 시간</p>
              <p className="text-base text-gray-900">{group.sessionDuration}분</p>
            </div>
          )}

          {group.nextLessonSummary && (
            <div>
              <p className="text-sm font-medium text-gray-700">다음 수업</p>
              <p className="text-base text-primary-600 font-medium">
                {group.nextLessonSummary}
              </p>
            </div>
          )}
        </div>

        {group.description && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-1">설명</p>
            <p className="text-sm text-gray-600">{group.description}</p>
          </div>
        )}
      </div>

      {/* 초대 코드 관리 (선생님만 표시) */}
      {currentRole === 'teacher' && (
        <InviteCodeManagement
          groupId={group.groupId}
          groupName={group.name}
        />
      )}

      {/* 학생 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">그룹 멤버</h2>

        {group.members && group.members.length > 0 ? (
          <div className="space-y-3">
            {group.members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">
                    {member.role === 'student' && '학생'}
                    {member.role === 'parent' && '학부모'}
                    {member.linkedStudent && ` (자녀: ${member.linkedStudent.name})`}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">아직 그룹 멤버가 없습니다.</p>
            {currentRole === 'teacher' && (
              <p className="text-xs text-gray-400 mt-1">
                위 초대 코드 관리에서 코드를 생성하여 학생/학부모를 초대하세요.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 개발 안내 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-900 mb-1">
          ℹ️ F-002 프론트엔드 스켈레톤 (목업 데이터)
        </p>
        <p className="text-blue-800">
          현재 목업 데이터로 표시 중입니다. 실제 API 연동 시 그룹 및 멤버 데이터가 동적으로 업데이트됩니다.
        </p>
      </div>
    </div>
  );
}
