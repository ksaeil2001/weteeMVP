/**
 * Group Detail Page - WeTee MVP
 * Screen: S-008 (그룹 상세 화면)
 * Route: /groups/[groupId]
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md (시나리오 1, 2, 3)
 * - UX_UI_설계서.md (S-008)
 * - API_명세서.md (6.2.5 그룹 상세 조회)
 *
 * 역할:
 * - 그룹 기본 정보 표시 (탭 구조)
 * - 탭: 개요 / 학생 / 일정 / 출결 / 진도 / 정산
 * - 기본 선택 탭: 학생 (명세서 요구사항)
 * - 선생님: 그룹 수정, 학생/학부모 초대 코드 생성
 * - 학생/학부모: 그룹 정보 조회만 가능
 */

'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchGroupById } from '@/lib/api/groups';
import type { Group } from '@/types/group';
import { InviteCodeManagement } from '@/components/groups';
import Link from 'next/link';

// 탭 정의
const TABS = [
  { id: 'overview', label: '개요' },
  { id: 'students', label: '학생' },
  { id: 'schedule', label: '일정' },
  { id: 'attendance', label: '출결' },
  { id: 'progress', label: '진도' },
  { id: 'billing', label: '정산' },
] as const;

type TabId = typeof TABS[number]['id'];

// 탭 콘텐츠를 분리한 내부 컴포넌트
function GroupDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params?.groupId as string;

  const { currentRole, isAuthenticated } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL 쿼리 파라미터에서 탭 상태 읽기 (기본값: students)
  const activeTab = (searchParams.get('tab') as TabId) || 'students';

  // 탭 변경 핸들러
  const handleTabChange = (tabId: TabId) => {
    router.push(`/groups/${groupId}?tab=${tabId}`);
  };

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

  // 개요 탭 콘텐츠
  const renderOverviewTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  );

  // 학생 탭 콘텐츠
  const renderStudentsTab = () => (
    <div className="space-y-6">
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">
                      {member.role === 'student' && '학생'}
                      {member.role === 'parent' && '학부모'}
                      {member.linkedStudent && ` (자녀: ${member.linkedStudent.name})`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(member.joinedAt).toLocaleDateString()} 가입
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 mb-1">아직 학생이 없습니다.</p>
            {currentRole === 'teacher' && (
              <p className="text-xs text-gray-400">
                위 초대 코드 관리에서 코드를 생성하여 학생/학부모를 초대하세요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // 일정 탭 콘텐츠
  const renderScheduleTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">수업 일정</h3>
        <p className="text-sm text-gray-500 mb-4">
          이 그룹의 수업 일정을 확인하고 관리할 수 있습니다.
        </p>
        <Link
          href={`/schedule?groupId=${groupId}`}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          일정 관리로 이동
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );

  // 출결 탭 콘텐츠
  const renderAttendanceTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">출결 관리</h3>
        <p className="text-sm text-gray-500 mb-4">
          학생들의 출결 현황을 확인하고 관리할 수 있습니다.
        </p>
        <Link
          href={`/groups/${groupId}/attendance`}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          출결 관리로 이동
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );

  // 진도 탭 콘텐츠
  const renderProgressTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">진도 관리</h3>
        <p className="text-sm text-gray-500 mb-4">
          수업 기록과 진도 현황을 확인할 수 있습니다.
        </p>
        <Link
          href={`/groups/${groupId}/progress`}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          진도 관리로 이동
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );

  // 정산 탭 콘텐츠
  const renderBillingTab = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">정산 관리</h3>
        <p className="text-sm text-gray-500 mb-4">
          수업료 정산 내역을 확인할 수 있습니다.
        </p>
        <Link
          href={`/groups/${groupId}/billing`}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          정산 관리로 이동
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );

  // 현재 탭에 따른 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'students':
        return renderStudentsTab();
      case 'schedule':
        return renderScheduleTab();
      case 'attendance':
        return renderAttendanceTab();
      case 'progress':
        return renderProgressTab();
      case 'billing':
        return renderBillingTab();
      default:
        return renderStudentsTab();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          그룹 목록
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

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="탭 메뉴" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              className={`
                py-3 px-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={activeTab}>
        {renderTabContent()}
      </div>
    </div>
  );
}

// Suspense로 감싼 메인 export 컴포넌트
export default function GroupDetailPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-500">그룹 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    }>
      <GroupDetailContent />
    </Suspense>
  );
}
