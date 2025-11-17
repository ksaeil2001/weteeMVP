/**
 * Group Progress Dashboard Page
 * Screen: S-030 그룹 진도 대시보드
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Path: /groups/[groupId]/progress
 *
 * Based on:
 * - F-005_수업_기록_및_진도_관리.md
 * - UX_UI_설계서.md (S-030)
 *
 * 역할:
 * - 그룹의 전체 진도 요약 표시
 * - 교재별 진행률 표시
 * - 최근 수업 기록 요약 (최대 5개)
 * - "새 수업 기록 작성" 버튼 (선생님만)
 * - "진도 히스토리 보기" 버튼 → S-032로 이동
 */

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchGroupProgressSummary } from '@/lib/api/lessons';
import type { GroupProgressSummary } from '@/types/lesson';

export default function GroupProgressDashboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { currentRole } = useAuth();
  const [summary, setSummary] = useState<GroupProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;

    const loadProgressSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGroupProgressSummary(groupId);
        setSummary(data);
      } catch (err) {
        console.error('진도 요약 조회 실패:', err);
        setError('진도 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadProgressSummary();
  }, [groupId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">로딩 중...</div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          {error || '진도 정보를 찾을 수 없습니다.'}
        </div>
        <div className="text-center mt-4">
          <Link
            href={`/groups/${groupId}`}
            className="text-blue-600 hover:underline"
          >
            ← 그룹으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isTeacher = currentRole === 'teacher';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <Link
            href={`/groups/${groupId}`}
            className="text-blue-600 hover:underline"
          >
            ← 그룹으로 돌아가기
          </Link>
        </div>
        <h1 className="text-2xl font-bold">{summary.groupName} - 진도 현황</h1>
        <p className="text-gray-600 mt-1">과목: {summary.subject}</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* 통계 요약 카드 */}
        {summary.stats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">전체 통계</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-gray-600">총 수업 횟수</div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.stats.totalLessons}회
                </div>
              </div>
              {summary.stats.averagePagesPerLesson && (
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-sm text-gray-600">평균 진도</div>
                  <div className="text-2xl font-bold text-green-600">
                    {summary.stats.averagePagesPerLesson.toFixed(1)}페이지/회
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 교재별 진행률 */}
        {summary.textbooks && summary.textbooks.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">교재별 진도</h2>
            <div className="space-y-4">
              {summary.textbooks.map((textbook) => (
                <div key={textbook.textbookId} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{textbook.name}</div>
                      <div className="text-sm text-gray-600">
                        {textbook.currentPage}
                        {textbook.totalPages ? ` / ${textbook.totalPages}` : ''} 페이지
                      </div>
                    </div>
                    {textbook.progressPercentage !== undefined && (
                      <div className="text-lg font-semibold text-blue-600">
                        {textbook.progressPercentage.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  {textbook.progressPercentage !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${textbook.progressPercentage}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최근 수업 기록 요약 */}
        {summary.recentLessons && summary.recentLessons.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">최근 수업 기록</h2>
              <Link
                href={`/groups/${groupId}/progress/history`}
                className="text-sm text-blue-600 hover:underline"
              >
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-3">
              {summary.recentLessons.map((lesson) => (
                <Link
                  key={lesson.lessonRecordId}
                  href={`/lessons/${lesson.lessonRecordId}`}
                  className="block border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-600">{lesson.date}</span>
                        {lesson.homeworkAssigned && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            숙제
                          </span>
                        )}
                      </div>
                      <div className="font-medium">
                        {lesson.title || lesson.unit || '수업 기록'}
                      </div>
                      {lesson.unit && <div className="text-sm text-gray-600">{lesson.unit}</div>}
                    </div>
                    <div className="text-blue-600">→</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 (선생님만) */}
        {isTeacher && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-3">
              <Link
                href={`/groups/${groupId}/progress/history`}
                className="block w-full text-center py-3 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                진도 히스토리 전체 보기
              </Link>
              <div className="text-center text-sm text-gray-500">
                새 수업 기록 작성은 일정에서 출결 체크 후 가능합니다
              </div>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {!summary.recentLessons || summary.recentLessons.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📝</div>
            <div className="text-gray-600 mb-2">아직 수업 기록이 없습니다</div>
            <div className="text-sm text-gray-500">
              {isTeacher
                ? '첫 수업을 진행하고 기록을 작성해보세요!'
                : '선생님이 수업 기록을 작성하면 여기에 표시됩니다'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
