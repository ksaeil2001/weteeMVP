/**
 * Lesson Record Input Page
 * Screen: S-031 수업 기록 입력 화면
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Path: /groups/[groupId]/schedule/[scheduleId]/log
 *
 * Based on:
 * - F-005_수업_기록_및_진도_관리.md
 * - UX_UI_설계서.md (S-031)
 *
 * 역할:
 * - 선생님이 출석 체크 후 수업 기록 작성
 * - 교재별 진도 입력 (최대 5개)
 * - 수업 내용, 숙제, 학생별 평가 입력
 * - 임시 저장 / 저장 완료 기능
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchTextbooks } from '@/lib/api/lessons';
import { createLessonRecord } from '@/lib/api/lessons';
import type { Textbook, CreateLessonRecordPayload } from '@/types/lesson';
import type { Schedule } from '@/types/schedule';
import type { Group, GroupMember } from '@/types/group';

// TODO(F-005): 실제 스케줄·그룹 정보 조회 API 연동
// 현재는 간단한 목업 데이터 사용
const getMockSchedule = (scheduleId: string): Schedule => ({
  scheduleId,
  groupId: 'group-1',
  title: '수학 수업',
  type: 'REGULAR',
  startAt: '2025-11-17T15:00:00Z',
  endAt: '2025-11-17T16:30:00Z',
  status: 'DONE',
  createdAt: '2025-11-01T00:00:00Z',
});

const getMockGroup = (groupId: string): Group => ({
  groupId,
  name: '이학생 수학 과외',
  subject: '수학',
  level: '중3',
  teacher: {
    userId: 'teacher-1',
    name: '김선생',
  },
  memberCount: 2,
  members: [
    {
      userId: 'student-1',
      name: '이학생',
      role: 'student',
      joinedAt: '2025-11-02T10:00:00Z',
    },
  ],
  createdAt: '2025-11-01T09:00:00Z',
});

interface ProgressRecordInput {
  textbookId: string;
  unit?: string;
  pageStart?: number;
  pageEnd?: number;
  notes?: string;
}

interface StudentEvaluationInput {
  studentId: string;
  understanding?: number;
  concentration?: number;
  difficulty?: number;
  memo?: string;
}

export default function LessonRecordInputPage({
  params,
}: {
  params: Promise<{ groupId: string; scheduleId: string }>;
}) {
  const { groupId, scheduleId } = use(params);
  const { currentRole } = useAuth();
  const router = useRouter();

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 상태
  const [content, setContent] = useState('');
  const [studentFeedback, setStudentFeedback] = useState('');
  const [homework, setHomework] = useState('');
  const [homeworkDueDate, setHomeworkDueDate] = useState('');

  // 진도 기록 (다중 교재 지원, 최대 5개)
  const [progressRecords, setProgressRecords] = useState<ProgressRecordInput[]>([
    { textbookId: '', unit: '', pageStart: undefined, pageEnd: undefined, notes: '' },
  ]);

  // 학생별 평가 (선택)
  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluationInput[]>([]);

  useEffect(() => {
    if (!groupId || !scheduleId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO(F-005): 실제 API 연동
        const scheduleData = getMockSchedule(scheduleId);
        const groupData = getMockGroup(groupId);
        const textbooksData = await fetchTextbooks(groupId);

        setSchedule(scheduleData);
        setGroup(groupData);
        setTextbooks(textbooksData);

        // 학생 목록으로 평가 초기화
        if (groupData.members) {
          const students = groupData.members.filter((m) => m.role === 'student');
          setStudentEvaluations(
            students.map((s) => ({
              studentId: s.userId,
              understanding: undefined,
              concentration: undefined,
              difficulty: undefined,
              memo: '',
            }))
          );
        }
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [groupId, scheduleId]);

  const addProgressRecord = () => {
    if (progressRecords.length >= 5) {
      alert('진도 기록은 최대 5개까지 추가할 수 있습니다.');
      return;
    }
    setProgressRecords([
      ...progressRecords,
      { textbookId: '', unit: '', pageStart: undefined, pageEnd: undefined, notes: '' },
    ]);
  };

  const removeProgressRecord = (index: number) => {
    setProgressRecords(progressRecords.filter((_, i) => i !== index));
  };

  const updateProgressRecord = (
    index: number,
    field: keyof ProgressRecordInput,
    value: string | number | undefined
  ) => {
    const updated = [...progressRecords];
    updated[index] = { ...updated[index], [field]: value };
    setProgressRecords(updated);
  };

  const updateStudentEvaluation = (
    studentId: string,
    field: keyof StudentEvaluationInput,
    value: number | string | undefined
  ) => {
    setStudentEvaluations((prev) =>
      prev.map((ev) => (ev.studentId === studentId ? { ...ev, [field]: value } : ev))
    );
  };

  const handleSubmit = async (isShared: boolean) => {
    // 유효성 검사
    if (content.trim().length < 10) {
      alert('수업 내용을 최소 10자 이상 입력해주세요.');
      return;
    }

    if (content.length > 2000) {
      alert('수업 내용은 최대 2000자까지 입력 가능합니다.');
      return;
    }

    if (studentFeedback.length > 500) {
      alert('학생 상태는 최대 500자까지 입력 가능합니다.');
      return;
    }

    if (homework.length > 1000) {
      alert('숙제는 최대 1000자까지 입력 가능합니다.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 빈 진도 기록 제거
      const validProgressRecords = progressRecords.filter(
        (pr) => pr.textbookId && (pr.unit || pr.pageStart || pr.pageEnd)
      );

      // 빈 평가 제거
      const validEvaluations = studentEvaluations.filter(
        (ev) => ev.understanding || ev.concentration || ev.difficulty || ev.memo
      );

      const payload: CreateLessonRecordPayload = {
        scheduleId,
        groupId,
        content: content.trim(),
        studentFeedback: studentFeedback.trim() || undefined,
        homework: homework.trim() || undefined,
        homeworkDueDate: homeworkDueDate || undefined,
        progressRecords: validProgressRecords.length > 0 ? validProgressRecords : undefined,
        studentEvaluations: validEvaluations.length > 0 ? validEvaluations : undefined,
        isShared,
      };

      const result = await createLessonRecord(payload);

      alert(isShared ? '수업 기록이 저장되고 공유되었습니다.' : '임시 저장되었습니다.');
      router.push(`/lessons/${result.lessonRecordId}`);
    } catch (err) {
      console.error('수업 기록 저장 실패:', err);
      setError('수업 기록 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">로딩 중...</div>
      </div>
    );
  }

  if (error || !schedule || !group) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">
          {error || '데이터를 찾을 수 없습니다.'}
        </div>
        <div className="text-center mt-4">
          <Link href={`/groups/${groupId}`} className="text-blue-600 hover:underline">
            ← 그룹으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isTeacher = currentRole === 'teacher';

  if (!isTeacher) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-600">수업 기록은 선생님만 작성할 수 있습니다.</div>
        <div className="text-center mt-4">
          <Link href={`/groups/${groupId}`} className="text-blue-600 hover:underline">
            ← 그룹으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const scheduleDate = new Date(schedule.startAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  const scheduleTime = `${new Date(schedule.startAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${new Date(schedule.endAt).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const students = group.members?.filter((m) => m.role === 'student') || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Link href={`/groups/${groupId}`} className="text-blue-600 hover:underline">
            ← 그룹으로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold mt-2">수업 기록 작성</h1>
        </div>

        {/* 수업 정보 카드 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">수업 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">날짜</div>
              <div className="font-medium">{scheduleDate}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">시간</div>
              <div className="font-medium">{scheduleTime}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">그룹</div>
              <div className="font-medium">{group.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">과목</div>
              <div className="font-medium">{group.subject}</div>
            </div>
          </div>
        </div>

        {/* 수업 내용 입력 폼 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">수업 내용</h2>

          {/* 수업 내용 (필수) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              오늘 배운 내용 <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2">(최소 10자, 최대 2000자)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 이차방정식의 판별식(b²-4ac)을 이용하여 근의 개수를 판별하는 방법을 학습했습니다..."
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {content.length} / 2000자
            </div>
          </div>

          {/* 학생 상태 (선택) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학생 상태 (선택)
              <span className="text-xs text-gray-500 ml-2">(최대 500자)</span>
            </label>
            <textarea
              value={studentFeedback}
              onChange={(e) => setStudentFeedback(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 오늘 컨디션이 좋아 보였고, 집중도가 높았습니다."
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {studentFeedback.length} / 500자
            </div>
          </div>
        </div>

        {/* 진도 기록 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">진도 기록 (선택)</h2>
            <button
              onClick={addProgressRecord}
              disabled={progressRecords.length >= 5}
              className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
            >
              + 교재 추가 ({progressRecords.length}/5)
            </button>
          </div>

          {progressRecords.map((pr, index) => (
            <div key={index} className="border rounded-lg p-4 mb-4 last:mb-0">
              <div className="flex justify-between items-start mb-3">
                <div className="font-medium text-sm">교재 {index + 1}</div>
                {progressRecords.length > 1 && (
                  <button
                    onClick={() => removeProgressRecord(index)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    삭제
                  </button>
                )}
              </div>

              {/* 교재 선택 */}
              <div className="mb-3">
                <label className="block text-sm text-gray-700 mb-1">교재</label>
                <select
                  value={pr.textbookId}
                  onChange={(e) => updateProgressRecord(index, 'textbookId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">교재 선택...</option>
                  {textbooks.map((tb) => (
                    <option key={tb.textbookId} value={tb.textbookId}>
                      {tb.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 단원/챕터 */}
              <div className="mb-3">
                <label className="block text-sm text-gray-700 mb-1">단원/챕터</label>
                <input
                  type="text"
                  value={pr.unit || ''}
                  onChange={(e) => updateProgressRecord(index, 'unit', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 2-1 이차함수"
                />
              </div>

              {/* 페이지 범위 */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">시작 페이지</label>
                  <input
                    type="number"
                    value={pr.pageStart || ''}
                    onChange={(e) =>
                      updateProgressRecord(index, 'pageStart', parseInt(e.target.value) || undefined)
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="53"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">끝 페이지</label>
                  <input
                    type="number"
                    value={pr.pageEnd || ''}
                    onChange={(e) =>
                      updateProgressRecord(index, 'pageEnd', parseInt(e.target.value) || undefined)
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="67"
                  />
                </div>
              </div>

              {/* 진도 메모 */}
              <div>
                <label className="block text-sm text-gray-700 mb-1">메모</label>
                <input
                  type="text"
                  value={pr.notes || ''}
                  onChange={(e) => updateProgressRecord(index, 'notes', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 어려운 문제는 다음 시간에 복습"
                />
              </div>
            </div>
          ))}

          {textbooks.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              등록된 교재가 없습니다.
              <br />
              <Link href={`/groups/${groupId}/textbooks`} className="text-blue-600 hover:underline">
                교재 관리 페이지에서 교재를 먼저 등록해주세요
              </Link>
            </div>
          )}
        </div>

        {/* 숙제 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">숙제 (선택)</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              숙제 내용
              <span className="text-xs text-gray-500 ml-2">(최대 1000자)</span>
            </label>
            <textarea
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 교재 68~75페이지 문제 풀어오기"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {homework.length} / 1000자
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제출 기한</label>
            <input
              type="date"
              value={homeworkDueDate}
              onChange={(e) => setHomeworkDueDate(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 학생별 평가 (선택) */}
        {students.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">학생별 평가 (선택)</h2>

            {students.map((student) => {
              const evaluation = studentEvaluations.find((ev) => ev.studentId === student.userId);
              if (!evaluation) return null;

              return (
                <div key={student.userId} className="border rounded-lg p-4 mb-4 last:mb-0">
                  <div className="font-medium mb-3">{student.name}</div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    {/* 이해도 */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">이해도</label>
                      <select
                        value={evaluation.understanding || ''}
                        onChange={(e) =>
                          updateStudentEvaluation(
                            student.userId,
                            'understanding',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">선택...</option>
                        <option value="1">1 (매우 낮음)</option>
                        <option value="2">2 (낮음)</option>
                        <option value="3">3 (보통)</option>
                        <option value="4">4 (높음)</option>
                        <option value="5">5 (매우 높음)</option>
                      </select>
                    </div>

                    {/* 집중도 */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">집중도</label>
                      <select
                        value={evaluation.concentration || ''}
                        onChange={(e) =>
                          updateStudentEvaluation(
                            student.userId,
                            'concentration',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">선택...</option>
                        <option value="1">1 (매우 낮음)</option>
                        <option value="2">2 (낮음)</option>
                        <option value="3">3 (보통)</option>
                        <option value="4">4 (높음)</option>
                        <option value="5">5 (매우 높음)</option>
                      </select>
                    </div>

                    {/* 체감 난이도 */}
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">체감 난이도</label>
                      <select
                        value={evaluation.difficulty || ''}
                        onChange={(e) =>
                          updateStudentEvaluation(
                            student.userId,
                            'difficulty',
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">선택...</option>
                        <option value="1">1 (매우 쉬움)</option>
                        <option value="2">2 (쉬움)</option>
                        <option value="3">3 (보통)</option>
                        <option value="4">4 (어려움)</option>
                        <option value="5">5 (매우 어려움)</option>
                      </select>
                    </div>
                  </div>

                  {/* 메모 */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">메모</label>
                    <input
                      type="text"
                      value={evaluation.memo || ''}
                      onChange={(e) =>
                        updateStudentEvaluation(student.userId, 'memo', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="학생별 특이사항 메모"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || content.trim().length < 10}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? '저장 중...' : '임시 저장'}
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting || content.trim().length < 10}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? '저장 중...' : '저장 완료 (학부모 공유)'}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-3 text-center">
            * 임시 저장은 학부모에게 공유되지 않습니다. 저장 완료 시 자동으로 학부모에게 공유됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}
