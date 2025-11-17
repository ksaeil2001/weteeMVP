/**
 * Group Progress History Page
 * Screen: S-032 그룹 진도 히스토리
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Path: /groups/[groupId]/progress/history
 *
 * Based on:
 * - F-005_수업_기록_및_진도_관리.md
 * - UX_UI_설계서.md (S-032)
 *
 * 역할:
 * - 그룹의 전체 수업 기록 타임라인 표시
 * - 날짜, 교재별 필터링
 * - 각 기록 클릭 시 상세 화면으로 이동
 * - 리포트 생성 버튼 (선생님만)
 */

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchLessonRecords, fetchTextbooks } from '@/lib/api/lessons';
import type { LessonRecord, Textbook, LessonRecordListParams } from '@/types/lesson';

export default function GroupProgressHistoryPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { currentRole } = useAuth();

  const [lessonRecords, setLessonRecords] = useState<LessonRecord[]>([]);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTextbook, setSelectedTextbook] = useState('');

  useEffect(() => {
    if (!groupId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: LessonRecordListParams = {
          groupId,
          from: fromDate || undefined,
          to: toDate || undefined,
        };

        const [recordsData, textbooksData] = await Promise.all([
          fetchLessonRecords(params),
          fetchTextbooks(groupId),
        ]);

        // 교재 필터 적용 (클라이언트 측)
        let filtered = recordsData;
        if (selectedTextbook) {
          filtered = recordsData.filter((record) =>
            record.progressRecords?.some((pr) => pr.textbook.textbookId === selectedTextbook)
          );
        }

        setLessonRecords(filtered);
        setTextbooks(textbooksData);
      } catch (err) {
        console.error('수업 기록 조회 실패:', err);
        setError('수업 기록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId, fromDate, toDate, selectedTextbook]);

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedTextbook('');
  };

  const isTeacher = currentRole === 'teacher';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}/progress`}
            className="text-blue-600 hover:underline"
          >
            ← 진도 대시보드로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold mt-2">진도 히스토리</h1>
          <p className="text-gray-600 mt-1">전체 수업 기록 타임라인</p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">필터</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 시작 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 날짜
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 날짜
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 교재 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                교재
              </label>
              <select
                value={selectedTextbook}
                onChange={(e) => setSelectedTextbook(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체 교재</option>
                {textbooks.map((tb) => (
                  <option key={tb.textbookId} value={tb.textbookId}>
                    {tb.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleResetFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              필터 초기화
            </button>
          </div>
        </div>

        {/* 리포트 생성 버튼 (선생님만) */}
        {isTeacher && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-blue-900">진도 리포트 생성</div>
                <div className="text-sm text-blue-700 mt-1">
                  선택한 기간의 진도를 요약한 리포트를 생성할 수 있습니다
                </div>
              </div>
              <Link
                href={`/groups/${groupId}/progress/report`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                리포트 생성
              </Link>
            </div>
          </div>
        )}

        {/* 수업 기록 목록 */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-600">로딩 중...</div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-red-600">{error}</div>
          </div>
        ) : lessonRecords.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <div className="text-gray-600 mb-2">수업 기록이 없습니다</div>
            <div className="text-sm text-gray-500">
              {fromDate || toDate || selectedTextbook
                ? '필터 조건을 변경해보세요'
                : '첫 수업을 진행하고 기록을 작성해보세요'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              총 {lessonRecords.length}개의 수업 기록
            </div>

            {lessonRecords.map((record) => {
              // 진도 범위 요약
              const progressSummary = record.progressRecords
                ?.map((pr) => {
                  if (pr.pageStart && pr.pageEnd) {
                    return `${pr.textbook.name} ${pr.pageStart}~${pr.pageEnd}p`;
                  } else if (pr.unit) {
                    return `${pr.textbook.name} ${pr.unit}`;
                  } else {
                    return pr.textbook.name;
                  }
                })
                .join(', ');

              return (
                <Link
                  key={record.lessonRecordId}
                  href={`/lessons/${record.lessonRecordId}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition p-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-600">{record.date}</span>
                        {record.homework && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            숙제
                          </span>
                        )}
                        {!record.isShared && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                            임시 저장
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-lg">
                        {record.title || '수업 기록'}
                      </div>
                    </div>
                    <div className="text-blue-600">→</div>
                  </div>

                  {progressSummary && (
                    <div className="text-sm text-gray-600 mb-2">
                      📖 {progressSummary}
                    </div>
                  )}

                  <div className="text-sm text-gray-700 line-clamp-2">
                    {record.content}
                  </div>

                  {/* 조회 상태 표시 */}
                  {record.viewedBy && (
                    <div className="mt-3 flex gap-3 text-xs text-gray-500">
                      {record.viewedBy.parentViewedAt && (
                        <span>
                          👨‍👩‍👧 학부모 확인:{' '}
                          {new Date(record.viewedBy.parentViewedAt).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                      {record.viewedBy.studentViewedAt && (
                        <span>
                          🎓 학생 확인:{' '}
                          {new Date(record.viewedBy.studentViewedAt).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 (TODO: v2) */}
        {/* TODO(v2): 페이지네이션 구현 - 현재는 전체 목록만 표시 */}
      </div>
    </div>
  );
}
