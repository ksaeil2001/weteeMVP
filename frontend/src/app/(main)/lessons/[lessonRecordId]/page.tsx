/**
 * Lesson Record Detail Page - WeTee MVP
 * Screen: S-023 (수업 기록 상세 화면)
 * Route: /lessons/[lessonRecordId]
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Based on:
 * - F-005_수업_기록_및_진도_관리.md (시나리오 2: 학부모가 수업 기록 확인)
 * - UX_UI_설계서.md (S-023: 수업 기록 상세 화면)
 * - API_명세서.md (GET /api/v1/lesson-records/{lesson_record_id})
 *
 * 역할:
 * - 수업 기록 상세 조회
 * - 선생님/학생/학부모 모두 조회 가능 (그룹 멤버)
 * - 선생님: 수정/삭제 가능
 *
 * 권한: 그룹 멤버만 조회 가능
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/lib/hooks/useAuth';
import { getLessonRecord, deleteLessonRecord } from '@/lib/api/lessons';
import type { LessonRecord } from '@/types/lesson';

export default function LessonRecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lessonRecordId = params?.lessonRecordId as string;
  const { isAuthenticated, currentRole, isLoading: authLoading } = useAuth();

  // 수업 기록 상태
  const [record, setRecord] = useState<LessonRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 삭제 처리 상태
  const [isDeleting, setIsDeleting] = useState(false);

  // 수업 기록 로드
  useEffect(() => {
    if (!lessonRecordId || !isAuthenticated) return;

    async function loadRecord() {
      try {
        setLoading(true);
        setError(null);
        const data = await getLessonRecord(lessonRecordId);
        setRecord(data);
      } catch (err) {
        console.error('수업 기록 로드 실패:', err);
        setError('수업 기록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [lessonRecordId, isAuthenticated]);

  // 수정 페이지로 이동
  function handleEdit() {
    router.push(`/lessons/${lessonRecordId}/edit`);
  }

  // 삭제 처리
  async function handleDelete() {
    if (!record) return;

    const confirmDelete = confirm(
      '이 수업 기록을 삭제하시겠습니까?\n삭제된 기록은 복구할 수 없습니다.'
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await deleteLessonRecord(lessonRecordId);
      alert('수업 기록이 삭제되었습니다.');
      router.push('/lessons');
    } catch (err) {
      console.error('수업 기록 삭제 실패:', err);
      alert('수업 기록 삭제에 실패했습니다. 작성 후 24시간이 지났거나 권한이 없을 수 있습니다.');
    } finally {
      setIsDeleting(false);
    }
  }

  // 권한 체크
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600">수업 기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">수업 기록을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/lessons')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            수업 기록 목록으로
          </button>
        </div>
      </div>
    );
  }

  // 날짜 포맷팅
  const formattedDate = new Date(record.date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 수정/삭제 가능 여부 확인
  const createdAt = new Date(record.createdAt);
  const now = new Date();
  const hoursSinceCreation =
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const daysSinceCreation = hoursSinceCreation / 24;
  const canEdit = currentRole === 'teacher' && daysSinceCreation <= 30;
  const canDelete = currentRole === 'teacher' && hoursSinceCreation <= 24;

  return (
    <div className="space-y-6 pb-8">
      {/* 페이지 헤더 */}
      <PageHeader
        title="수업 기록"
        subtitle={formattedDate}
        actions={
          currentRole === 'teacher' ? (
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  수정
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              )}
            </div>
          ) : null
        }
      />

      {/* 상단 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* 날짜 */}
          <span className="text-lg font-bold text-gray-900">{formattedDate}</span>

          {/* 공유 상태 배지 */}
          {record.isShared ? (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
              공유됨
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
              비공개
            </span>
          )}

          {/* 수정됨 표시 */}
          {record.updatedAt && record.updatedAt !== record.createdAt && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
              수정됨
            </span>
          )}
        </div>

        {/* 그룹/수업 정보 */}
        {record.groupName && (
          <p className="text-sm text-gray-600 mb-2">
            그룹: {record.groupName}
          </p>
        )}
        {record.title && (
          <p className="text-sm text-gray-600">수업: {record.title}</p>
        )}
      </div>

      {/* 오늘 배운 내용 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          오늘 배운 내용
        </h3>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-900 whitespace-pre-wrap">{record.content}</p>
        </div>
      </div>

      {/* 진도 */}
      {record.progressRecords && record.progressRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            진도
          </h3>
          <div className="space-y-3">
            {record.progressRecords.map((progress, index) => (
              <div
                key={progress.progressId || index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {progress.textbook.name}
                  </span>
                  {progress.pagesCovered && (
                    <span className="text-sm text-primary-600 font-medium">
                      {progress.pagesCovered}페이지 진행
                    </span>
                  )}
                </div>
                {progress.pageStart && progress.pageEnd && (
                  <p className="text-sm text-gray-600 mt-1">
                    {progress.pageStart} ~ {progress.pageEnd}페이지
                  </p>
                )}
                {progress.notes && (
                  <p className="text-sm text-gray-500 mt-1">{progress.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 학생 상태 */}
      {record.studentFeedback && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            학생 상태
          </h3>
          <p className="text-gray-900 whitespace-pre-wrap">
            {record.studentFeedback}
          </p>
        </div>
      )}

      {/* 숙제 */}
      {record.homework && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            숙제
          </h3>
          <p className="text-gray-900 whitespace-pre-wrap">{record.homework}</p>
          {record.homeworkDueDate && (
            <p className="text-sm text-gray-500 mt-2">
              제출 기한:{' '}
              {new Date(record.homeworkDueDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* 조회 정보 */}
      {(record.viewedBy?.parentViewedAt || record.viewedBy?.studentViewedAt) && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            조회 정보
          </h3>
          {record.viewedBy.parentViewedAt && (
            <p className="text-sm text-gray-600">
              학부모 확인:{' '}
              {new Date(record.viewedBy.parentViewedAt).toLocaleString('ko-KR')}
            </p>
          )}
          {record.viewedBy.studentViewedAt && (
            <p className="text-sm text-gray-600">
              학생 확인:{' '}
              {new Date(record.viewedBy.studentViewedAt).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      )}

      {/* 기록 정보 */}
      <div className="text-xs text-gray-400 text-center space-y-1">
        <p>작성자: {record.createdBy.name}</p>
        <p>
          작성 시간: {new Date(record.createdAt).toLocaleString('ko-KR')}
        </p>
        {record.updatedAt && record.updatedAt !== record.createdAt && (
          <p>
            수정 시간: {new Date(record.updatedAt).toLocaleString('ko-KR')}
          </p>
        )}
      </div>

      {/* 수정 제한 안내 (선생님용) */}
      {currentRole === 'teacher' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-medium text-blue-900 mb-1">수정/삭제 안내</p>
          <ul className="text-blue-800 space-y-1 list-disc list-inside">
            <li>수정: 작성 후 30일 이내 가능</li>
            <li>삭제: 작성 후 24시간 이내 가능</li>
          </ul>
          {!canEdit && daysSinceCreation > 30 && (
            <p className="text-blue-600 mt-2">
              이 기록은 30일이 지나 더 이상 수정할 수 없습니다.
            </p>
          )}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/lessons')}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          목록으로
        </button>
        {currentRole === 'teacher' && (
          <button
            onClick={() =>
              router.push(`/lessons/create/${record.scheduleId}`)
            }
            className="flex-1 py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            새 수업 기록
          </button>
        )}
      </div>
    </div>
  );
}
