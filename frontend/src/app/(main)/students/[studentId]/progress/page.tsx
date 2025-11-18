/**
 * Student Progress Report Page
 * Screen: S-033 학생별 학습 리포트
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Path: /students/[studentId]/progress
 *
 * Based on:
 * - F-005_수업_기록_및_진도_관리.md
 * - UX_UI_설계서.md (S-033)
 *
 * 역할:
 * - 학생별 누적 진도, 최근 수업 요약
 * - 평균 이해도·집중도·숙제 수행률 통계
 * - 약점 단원 표시 (목업 데이터)
 * - 선생님·학생·학부모 모두 조회 가능
 */

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchStudentProgressSummary } from '@/lib/api/lessons';
import type { StudentProgressSummary } from '@/types/lesson';

export default function StudentProgressReportPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const { currentRole } = useAuth();

  const [summary, setSummary] = useState<StudentProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const loadProgressSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        // TODO: 백엔드 API 구현 후 실제 데이터로 변환
        await fetchStudentProgressSummary();
        setSummary(null);
      } catch (err) {
        console.error('학생 진도 요약 조회 실패:', err);
        setError('학생 진도 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadProgressSummary();
  }, [studentId]);

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
          {error || '학생 진도 정보를 찾을 수 없습니다.'}
        </div>
        <div className="text-center mt-4">
          <Link href="/" className="text-blue-600 hover:underline">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isTeacher = currentRole === 'teacher';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href={summary.groupId ? `/groups/${summary.groupId}` : '/'}
            className="text-blue-600 hover:underline"
          >
            ← {summary.groupName || '그룹'}으로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold mt-2">{summary.studentName} 학습 리포트</h1>
          <p className="text-gray-600 mt-1">
            {summary.groupName} - {summary.subject}
          </p>
        </div>

        {/* 통계 카드 */}
        {summary.stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">전체 통계</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-gray-600">총 수업 횟수</div>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.stats.totalLessons}회
                </div>
              </div>

              {summary.stats.averageUnderstanding !== undefined && (
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-sm text-gray-600">평균 이해도</div>
                  <div className="text-2xl font-bold text-green-600">
                    {summary.stats.averageUnderstanding.toFixed(1)}/5
                  </div>
                </div>
              )}

              {summary.stats.averageConcentration !== undefined && (
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-sm text-gray-600">평균 집중도</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {summary.stats.averageConcentration.toFixed(1)}/5
                  </div>
                </div>
              )}

              {summary.stats.homeworkCompletionRate !== undefined && (
                <div className="bg-yellow-50 p-4 rounded">
                  <div className="text-sm text-gray-600">숙제 수행률</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {summary.stats.homeworkCompletionRate.toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 누적 진도 범위 */}
        {summary.progressRange && summary.progressRange.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">교재별 누적 진도</h2>
            <div className="space-y-4">
              {summary.progressRange.map((range, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{range.textbookName}</div>
                      <div className="text-sm text-gray-600">
                        {range.startPage}p → {range.currentPage}p
                        {range.totalPages && ` / ${range.totalPages}p`}
                      </div>
                    </div>
                    {range.completionRate !== undefined && (
                      <div className="text-lg font-semibold text-blue-600">
                        {range.completionRate.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  {range.completionRate !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${range.completionRate}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최근 수업 요약 */}
        {summary.recentLessons && summary.recentLessons.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">최근 수업 ({summary.recentLessons.length}회)</h2>
            <div className="space-y-3">
              {summary.recentLessons.map((lesson) => (
                <Link
                  key={lesson.lessonRecordId}
                  href={`/lessons/${lesson.lessonRecordId}`}
                  className="block border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-600">{lesson.date}</span>
                        {lesson.homework && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            숙제
                          </span>
                        )}
                      </div>
                      {lesson.unit && (
                        <div className="font-medium">{lesson.unit}</div>
                      )}
                      {lesson.pagesCovered !== undefined && (
                        <div className="text-sm text-gray-600">
                          {lesson.pagesCovered}페이지 진행
                        </div>
                      )}
                    </div>
                    <div className="text-blue-600">→</div>
                  </div>

                  {/* 평가 표시 */}
                  {(lesson.understanding !== undefined ||
                    lesson.concentration !== undefined) && (
                    <div className="flex gap-4 text-sm mt-2">
                      {lesson.understanding !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">이해도:</span>
                          <span className="font-medium text-green-600">
                            {lesson.understanding}/5
                          </span>
                        </div>
                      )}
                      {lesson.concentration !== undefined && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">집중도:</span>
                          <span className="font-medium text-purple-600">
                            {lesson.concentration}/5
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {lesson.homework && (
                    <div className="text-sm text-gray-700 mt-2 line-clamp-1">
                      📝 {lesson.homework}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 약점 단원 (목업 데이터) */}
        {summary.weakUnits && summary.weakUnits.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">보완이 필요한 단원</h2>
            <div className="space-y-3">
              {summary.weakUnits.map((weak, index) => (
                <div key={index} className="border-l-4 border-orange-400 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{weak.unit}</div>
                    <div className="text-sm">
                      <span className="text-gray-600">이해도: </span>
                      <span className="font-medium text-orange-600">
                        {weak.understanding}/5
                      </span>
                    </div>
                  </div>
                  {weak.notes && (
                    <div className="text-sm text-gray-600">{weak.notes}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              * 이해도가 낮은 단원들을 자동으로 표시합니다
            </div>
          </div>
        )}

        {/* 액션 버튼 (선생님만) */}
        {isTeacher && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-3">
              <Link
                href={`/students/${studentId}/progress/detail`}
                className="block w-full text-center py-3 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                상세 분석 보기
              </Link>
              <div className="text-center text-sm text-gray-500">
                학생별 상세 분석 및 학습 패턴을 확인할 수 있습니다
              </div>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {(!summary.recentLessons || summary.recentLessons.length === 0) && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
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
