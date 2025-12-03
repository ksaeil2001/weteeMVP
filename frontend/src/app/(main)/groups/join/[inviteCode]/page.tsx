/**
 * Group Join Page - WeTee MVP
 * Screen: S-010 (초대 코드로 그룹 가입 화면)
 * Route: /groups/join/[inviteCode]
 *
 * Based on:
 * - F-002_과외_그룹_생성_및_매칭.md (시나리오 2: 학생/학부모 초대 코드로 가입)
 * - UX_UI_설계서.md (S-010: 그룹 가입 화면)
 *
 * 역할:
 * - 초대 코드를 통한 그룹 가입
 * - 학생/학부모만 접근 가능
 * - 초대 코드 유효성 검증
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { joinGroup } from '@/lib/api/groups';

export default function GroupJoinPage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params?.inviteCode as string;
  const { isAuthenticated, currentUser, currentRole } = useAuth();

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 권한 체크
  useEffect(() => {
    if (!isAuthenticated) {
      // 로그인되지 않은 경우 로그인 페이지로 이동
      router.push(`/login?redirect=/groups/join/${inviteCode}`);
      return;
    }

    if (currentRole === 'teacher') {
      // 선생님은 그룹 가입 불가
      setError('선생님 계정은 초대 코드로 그룹에 가입할 수 없습니다. 그룹 생성 기능을 사용해주세요.');
      return;
    }
  }, [isAuthenticated, currentRole, inviteCode, router]);

  // 초대 코드 검증 및 그룹 정보 표시 (향후 구현)
  useEffect(() => {
    if (inviteCode && isAuthenticated && currentRole !== 'teacher') {
      // TODO(v2): 초대 코드 유효성 검증 API 호출
      // GET /api/v1/groups/invite/{code}/preview
      // 그룹 정보 미리보기 (그룹명, 과목, 선생님 이름 등)
    }
  }, [inviteCode, isAuthenticated, currentRole]);

  // 그룹 가입 처리
  async function handleJoinGroup() {
    if (!inviteCode) {
      setError('초대 코드가 올바르지 않습니다.');
      return;
    }

    try {
      setJoining(true);
      setError(null);

      const group = await joinGroup({ inviteCode });

      // 가입 성공
      alert(`"${group.name}" 그룹에 가입되었습니다!`);
      router.push(`/groups/${group.groupId}`);
    } catch (err) {
      console.error('그룹 가입 실패:', err);

      // 에러 메시지 처리
      const error = err as { status?: number; detail?: string; message?: string };
      const errorMessage = error?.detail || error?.message || '알 수 없는 오류가 발생했습니다.';

      if (error?.status === 404) {
        setError('초대 코드를 찾을 수 없습니다. 코드가 만료되었거나 잘못된 코드입니다.');
      } else if (error?.status === 409) {
        setError('이미 이 그룹에 가입되어 있습니다.');
      } else if (error?.status === 400) {
        if (errorMessage.includes('expired')) {
          setError('초대 코드가 만료되었습니다. 선생님께 새로운 초대 코드를 요청해주세요.');
        } else if (errorMessage.includes('max uses')) {
          setError('초대 코드 사용 횟수가 초과되었습니다. 선생님께 새로운 초대 코드를 요청해주세요.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setJoining(false);
    }
  }

  // 로딩 중
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👥</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              과외 그룹 가입
            </h1>
            <p className="text-gray-600">
              초대 코드를 통해 과외 그룹에 가입합니다
            </p>
          </div>

          {/* 초대 코드 표시 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              초대 코드
            </label>
            <div className="px-4 py-3 bg-gray-100 rounded-lg text-center">
              <span className="text-2xl font-mono font-bold text-blue-600">
                {inviteCode}
              </span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* 안내 메시지 */}
          {!error && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ✓ 로그인됨: {currentUser?.name || currentUser?.email}
              </p>
              <p className="text-sm text-blue-800 mt-1">
                ✓ 역할: {currentRole === 'student' ? '학생' : '학부모'}
              </p>
            </div>
          )}

          {/* 그룹 정보 미리보기 (TODO) */}
          {/*
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">가입할 그룹 정보</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-600">그룹명:</span> <span className="font-medium">고2 수학반</span></p>
              <p><span className="text-gray-600">과목:</span> <span className="font-medium">수학</span></p>
              <p><span className="text-gray-600">선생님:</span> <span className="font-medium">김선생님</span></p>
            </div>
          </div>
          */}

          {/* 버튼 */}
          <div className="space-y-3">
            {!error && (
              <button
                onClick={handleJoinGroup}
                disabled={joining}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? '가입 중...' : '그룹 가입하기'}
              </button>
            )}

            <button
              onClick={() => router.push('/groups')}
              className="w-full px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              {error ? '그룹 목록으로' : '취소'}
            </button>
          </div>

          {/* 도움말 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              초대 코드는 선생님이 발급합니다.<br />
              초대 코드가 없다면 선생님께 문의해주세요.
            </p>
          </div>
        </div>

        {/* 개발 안내 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
            <p className="font-semibold text-blue-900 mb-1">
              💻 개발 모드: 초대 코드 가입 페이지
            </p>
            <p className="text-blue-800">
              API 연동 완료. 백엔드에서 초대 코드 검증 후 그룹 가입이 처리됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
