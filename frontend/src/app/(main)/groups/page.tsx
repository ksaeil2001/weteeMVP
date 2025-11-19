/**
 * Groups Page - WeTee MVP
 * Screen: S-007 (그룹 목록 화면)
 * Route: /groups
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md
 * - UX_UI_설계서.md (S-007)
 * - API_명세서.md (6.2 F-002)
 *
 * 역할:
 * - 현재 운영 중인 과외 그룹 목록 표시
 * - 선생님: 그룹 생성, 학생/학부모 초대
 * - 학생/학부모: 소속 그룹 조회
 *
 * TODO (향후 디버깅/연결 단계):
 * - 실제 그룹 목록 API 연동 (fetchGroups)
 * - 로딩/에러 상태 UI 강화
 * - 필터/검색 UI (과목별, 학년별, 상태별)
 * - 페이지네이션
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchGroups } from '@/lib/api/groups';
import type { Group } from '@/types/group';
import { GroupCardSkeleton } from '@/components/ui/Skeleton';

export default function GroupsPage() {
  const router = useRouter();
  const { currentRole, isAuthenticated, currentUser } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 그룹 목록 로드
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const groupsData = await fetchGroups();
        setGroups(groupsData);
      } catch (err) {
        console.error('[GroupsPage] 그룹 목록 로드 실패:', err);
        setError('그룹 목록을 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadGroups();
    }
  }, [isAuthenticated]);

  // 그룹 생성 버튼 클릭 (선생님만)
  const handleCreateGroup = () => {
    router.push('/groups/new');
  };

  // 그룹 카드 클릭
  const handleGroupClick = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">과외 그룹</h1>
            <p className="mt-1 text-sm text-gray-500">
              현재 운영 중인 과외 그룹을 관리합니다.
            </p>
          </div>
          {currentRole === 'teacher' && (
            <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          )}
        </div>

        {/* 스켈레톤 UI - 그룹 카드 3개 표시 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GroupCardSkeleton />
          <GroupCardSkeleton />
          <GroupCardSkeleton />
        </div>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">과외 그룹</h1>
            <p className="mt-1 text-sm text-gray-500">
              현재 운영 중인 과외 그룹을 관리합니다.
            </p>
          </div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // 메인 UI
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">과외 그룹</h1>
          <p className="mt-1 text-sm text-gray-500">
            {currentRole === 'teacher'
              ? '현재 운영 중인 과외 그룹을 관리합니다.'
              : '소속된 과외 그룹을 확인할 수 있습니다.'}
          </p>
        </div>

        {/* 선생님만 그룹 생성 가능 */}
        {currentRole === 'teacher' && (
          <button
            type="button"
            onClick={handleCreateGroup}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            aria-label="새 과외 그룹 만들기"
          >
            + 새 그룹 만들기
          </button>
        )}
      </div>

      {/* 그룹 목록 */}
      {groups.length === 0 ? (
        // 빈 상태
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {currentRole === 'teacher'
              ? '아직 그룹이 없어요'
              : '참여 중인 그룹이 없어요'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {currentRole === 'teacher'
              ? '첫 번째 과외 그룹을 만들어보세요!'
              : '선생님의 초대 코드로 그룹에 참여할 수 있습니다.'}
          </p>
          {currentRole === 'teacher' && (
            <button
              type="button"
              onClick={handleCreateGroup}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              aria-label="첫 번째 과외 그룹 만들기"
            >
              그룹 만들기
            </button>
          )}
        </div>
      ) : (
        // 그룹 카드 리스트
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.groupId}
              onClick={() => handleGroupClick(group.groupId)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
            >
              {/* 그룹 이름 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {group.name}
              </h3>

              {/* 과목 뱃지 */}
              <div className="mb-3">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                  {group.subject}
                </span>
                {group.level && (
                  <span className="ml-2 inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {group.level}
                  </span>
                )}
              </div>

              {/* 그룹 정보 */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium text-gray-700 w-20">학생 수:</span>
                  <span>{group.memberCount}명</span>
                </div>

                {group.feePerSession && (
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">수업료:</span>
                    <span>{group.feePerSession.toLocaleString()}원/회</span>
                  </div>
                )}

                {group.nextLessonSummary && (
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-20">다음 수업:</span>
                    <span className="text-primary-600 font-medium">
                      {group.nextLessonSummary}
                    </span>
                  </div>
                )}

                {!group.nextLessonSummary && group.memberCount === 0 && (
                  <div className="flex items-center">
                    <span className="text-gray-500 text-xs">학생 초대 대기 중</span>
                  </div>
                )}
              </div>

              {/* 카드 하단 액션 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  aria-label={`${group.name} 그룹 상세 보기`}
                >
                  상세 보기 →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 개발 안내 (실제 API 연동 완료) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
          <p className="font-semibold text-green-900 mb-1">
            ✅ F-002 백엔드 API 연동 완료
          </p>
          <p className="text-green-800 mb-2">
            실제 백엔드 API(/api/v1/groups)와 연동되어 있습니다. 그룹 데이터는 DB에서 조회됩니다.
          </p>
          <p className="text-green-700 text-xs">
            현재 사용자: {currentUser?.name} ({currentRole})
          </p>
        </div>
      )}
    </div>
  );
}
