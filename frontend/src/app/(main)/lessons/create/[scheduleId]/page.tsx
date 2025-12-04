/**
 * Lesson Record Create Page - WeTee MVP
 * Screen: S-022 (수업 기록 작성 화면)
 * Route: /lessons/create/[scheduleId]
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Based on:
 * - F-005_수업_기록_및_진도_관리.md (시나리오 1: 선생님이 수업 직후 기록 작성)
 * - UX_UI_설계서.md (S-022: 수업 기록 작성 화면)
 * - API_명세서.md (POST /api/v1/lesson-records/schedules/{schedule_id})
 *
 * 역할:
 * - 선생님이 수업 종료 후 기록 작성
 * - 오늘 배운 내용, 진도, 학생 상태, 숙제 입력
 * - 학부모 공유 여부 설정
 *
 * 권한: TEACHER만 접근 가능
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/lib/hooks/useAuth';
import { fetchScheduleById } from '@/lib/api/schedules';
import { createLessonRecord, getTextbooks } from '@/lib/api/lessons';
import type { Schedule } from '@/types/schedule';
import type { Textbook, CreateLessonRecordPayload } from '@/types/lesson';

// 학생 상태 레벨 라벨
const LEVEL_LABELS = ['매우 낮음', '낮음', '보통', '높음', '매우 높음'];

// 진도 기록 타입
interface ProgressEntry {
  id: string;
  textbookId: string;
  startPage: number | null;
  endPage: number | null;
}

// 임시 저장 키
const DRAFT_STORAGE_KEY = 'wetee_lesson_record_draft';

export default function LessonRecordCreatePage() {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params?.scheduleId as string;
  const { isAuthenticated, currentRole, isLoading: authLoading } = useAuth();

  // 일정 정보 상태
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // 교재 목록 상태
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [textbooksLoading, setTextbooksLoading] = useState(false);

  // 폼 상태
  const [content, setContent] = useState('');
  const [studentFeedback, setStudentFeedback] = useState('');
  const [homework, setHomework] = useState('');
  const [homeworkDueDate, setHomeworkDueDate] = useState('');
  const [shareWithParent, setShareWithParent] = useState(true);

  // 학생 상태 (1-5 점수)
  const [understanding, setUnderstanding] = useState<number>(3);
  const [concentration, setConcentration] = useState<number>(3);
  const [participation, setParticipation] = useState<number>(3);
  const [studentNotes, setStudentNotes] = useState('');

  // 진도 기록 (다중)
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 임시 저장 상태
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // 일정 정보 로드
  useEffect(() => {
    if (!scheduleId) return;

    async function loadSchedule() {
      try {
        setScheduleLoading(true);
        setScheduleError(null);
        const data = await fetchScheduleById(scheduleId);
        setSchedule(data);

        // 그룹 ID가 있으면 교재 목록도 로드
        if (data.groupId) {
          loadTextbooks(data.groupId);
        }
      } catch (error) {
        console.error('일정 로드 실패:', error);
        setScheduleError('수업 정보를 불러올 수 없습니다.');
      } finally {
        setScheduleLoading(false);
      }
    }

    loadSchedule();
  }, [scheduleId]);

  // 교재 목록 로드
  async function loadTextbooks(groupId: string) {
    try {
      setTextbooksLoading(true);
      const data = await getTextbooks(groupId);
      setTextbooks(data);
    } catch (error) {
      console.error('교재 목록 로드 실패:', error);
    } finally {
      setTextbooksLoading(false);
    }
  }

  // 임시 저장 데이터 복구
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // 같은 일정에 대한 임시 저장인지 확인
        if (parsed.scheduleId === scheduleId) {
          setHasDraft(true);
        }
      } catch {
        // 파싱 실패 시 무시
      }
    }
  }, [scheduleId]);

  // 임시 저장 복구 함수
  function restoreDraft() {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft);
      if (parsed.scheduleId !== scheduleId) return;

      setContent(parsed.content || '');
      setStudentFeedback(parsed.studentFeedback || '');
      setHomework(parsed.homework || '');
      setHomeworkDueDate(parsed.homeworkDueDate || '');
      setShareWithParent(parsed.shareWithParent ?? true);
      setUnderstanding(parsed.understanding || 3);
      setConcentration(parsed.concentration || 3);
      setParticipation(parsed.participation || 3);
      setStudentNotes(parsed.studentNotes || '');
      setProgressEntries(parsed.progressEntries || []);
      setHasDraft(false);
    } catch {
      // 복구 실패 시 무시
    }
  }

  // 임시 저장 제거 함수
  function discardDraft() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
  }

  // 자동 임시 저장 (5초마다)
  useEffect(() => {
    if (!content || !scheduleId) return;

    const timer = setInterval(() => {
      const draftData = {
        scheduleId,
        content,
        studentFeedback,
        homework,
        homeworkDueDate,
        shareWithParent,
        understanding,
        concentration,
        participation,
        studentNotes,
        progressEntries,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
    }, 5000);

    return () => clearInterval(timer);
  }, [
    scheduleId,
    content,
    studentFeedback,
    homework,
    homeworkDueDate,
    shareWithParent,
    understanding,
    concentration,
    participation,
    studentNotes,
    progressEntries,
  ]);

  // 진도 입력 추가
  function addProgressEntry() {
    if (progressEntries.length >= 5) {
      alert('최대 5개의 교재 진도까지 입력 가능합니다.');
      return;
    }
    setProgressEntries([
      ...progressEntries,
      {
        id: `progress-${Date.now()}`,
        textbookId: '',
        startPage: null,
        endPage: null,
      },
    ]);
  }

  // 진도 입력 삭제
  function removeProgressEntry(id: string) {
    setProgressEntries(progressEntries.filter((p) => p.id !== id));
  }

  // 진도 입력 수정
  function updateProgressEntry(
    id: string,
    field: keyof ProgressEntry,
    value: string | number | null
  ) {
    setProgressEntries(
      progressEntries.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    );
  }

  // 폼 유효성 검사
  const validate = useCallback((): string | null => {
    if (!content.trim()) {
      return '오늘 배운 내용을 입력해주세요.';
    }

    if (content.trim().length < 10) {
      return '오늘 배운 내용을 최소 10자 이상 입력해주세요.';
    }

    if (content.length > 2000) {
      return '오늘 배운 내용은 2000자 이하로 작성해주세요.';
    }

    // 진도 유효성 검사
    for (const entry of progressEntries) {
      if (entry.textbookId && entry.startPage && entry.endPage) {
        if (entry.startPage > entry.endPage) {
          return '시작 페이지가 끝 페이지보다 클 수 없습니다.';
        }
      }
      if (entry.textbookId && (!entry.startPage || !entry.endPage)) {
        return '교재를 선택한 경우 시작 페이지와 끝 페이지를 모두 입력해주세요.';
      }
    }

    return null;
  }, [content, progressEntries]);

  // 폼 제출
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      // 학생 상태 메모 조합
      let combinedFeedback = studentFeedback;
      const statusParts: string[] = [];
      if (understanding !== 3)
        statusParts.push(`이해도: ${LEVEL_LABELS[understanding - 1]}`);
      if (concentration !== 3)
        statusParts.push(`집중도: ${LEVEL_LABELS[concentration - 1]}`);
      if (participation !== 3)
        statusParts.push(`참여도: ${LEVEL_LABELS[participation - 1]}`);
      if (studentNotes.trim()) statusParts.push(studentNotes.trim());
      if (statusParts.length > 0) {
        combinedFeedback = statusParts.join(' / ') + (studentFeedback ? ` | ${studentFeedback}` : '');
      }

      // 진도 기록 필터링 (유효한 것만)
      const validProgressRecords = progressEntries
        .filter((p) => p.textbookId && p.startPage && p.endPage)
        .map((p) => ({
          textbookId: p.textbookId,
          pageStart: p.startPage!,
          pageEnd: p.endPage!,
        }));

      const payload: CreateLessonRecordPayload = {
        scheduleId,
        groupId: schedule?.groupId || '',
        content: content.trim(),
        studentFeedback: combinedFeedback || undefined,
        homework: homework.trim() || undefined,
        homeworkDueDate: homeworkDueDate || undefined,
        progressRecords:
          validProgressRecords.length > 0 ? validProgressRecords : undefined,
        isShared: shareWithParent,
      };

      const result = await createLessonRecord(payload);

      // 임시 저장 삭제
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      // 성공 알림
      alert('수업 기록이 저장되었습니다.');

      // 생성된 기록 상세 페이지로 이동
      router.push(`/lessons/${result.lessonRecordId}`);
    } catch (error: unknown) {
      console.error('수업 기록 저장 실패:', error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : '수업 기록 저장에 실패했습니다. 다시 시도해주세요.';
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // 취소 핸들러
  function handleCancel() {
    if (content.trim() || studentFeedback.trim() || homework.trim()) {
      const shouldExit = confirm(
        '작성 중인 내용이 있습니다. 정말로 나가시겠습니까?\n(임시 저장된 내용은 유지됩니다)'
      );
      if (!shouldExit) return;
    }
    router.back();
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

  // 선생님 권한 체크
  if (!authLoading && currentRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            수업 기록은 선생님만 작성할 수 있습니다.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            메인으로 이동
          </button>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (scheduleLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600">수업 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 일정 로드 에러
  if (scheduleError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{scheduleError}</p>
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

  // 날짜 포맷팅
  const formattedDate = schedule
    ? new Date(schedule.startAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    : '';

  const formattedStartTime = schedule
    ? new Date(schedule.startAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const formattedEndTime = schedule
    ? new Date(schedule.endAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="space-y-6 pb-24">
      {/* 페이지 헤더 */}
      <PageHeader
        title="수업 기록 작성"
        subtitle="수업 내용, 진도, 숙제를 기록합니다."
        actions={
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            취소
          </button>
        }
      />

      {/* 임시 저장 복구 알림 */}
      {hasDraft && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            이전에 작성 중이던 내용이 있습니다.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={restoreDraft}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
            >
              복구하기
            </button>
            <button
              onClick={discardDraft}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              무시하기
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 수업 정보 (읽기 전용) */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-3">수업 정보</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">수업 날짜</p>
              <p className="font-semibold text-gray-900">{formattedDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">수업 시간</p>
              <p className="font-semibold text-gray-900">
                {formattedStartTime} - {formattedEndTime}
              </p>
            </div>
            {schedule?.title && (
              <div>
                <p className="text-sm text-gray-600">수업명</p>
                <p className="font-semibold text-gray-900">{schedule.title}</p>
              </div>
            )}
            {schedule?.groupName && (
              <div>
                <p className="text-sm text-gray-600">그룹</p>
                <p className="font-semibold text-gray-900">
                  {schedule.groupName}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* 오늘 배운 내용 (필수) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            오늘 배운 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={6}
            placeholder={`예: 삼각함수 sin, cos, tan의 정의와 예제 풀이
- sin θ = 대변/빗변
- 예제 3개 풀이
- 학생이 cos의 개념을 잘 이해함`}
            required
          />
          <div className="flex justify-between mt-2">
            <p className="text-xs text-gray-500">
              학부모님이 보실 수 있습니다. 구체적으로 작성해주세요.
            </p>
            <p
              className={`text-xs ${content.length > 2000 ? 'text-red-500' : 'text-gray-500'}`}
            >
              {content.length} / 2000
            </p>
          </div>
        </div>

        {/* 진도 (선택) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            진도
          </label>

          {progressEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">
                  교재 {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeProgressEntry(entry.id)}
                  className="text-red-500 hover:text-red-600 text-sm"
                >
                  삭제
                </button>
              </div>

              {/* 교재 선택 */}
              <select
                value={entry.textbookId}
                onChange={(e) =>
                  updateProgressEntry(entry.id, 'textbookId', e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
              >
                <option value="">교재 선택</option>
                {textbooks.map((tb) => (
                  <option key={tb.textbookId} value={tb.textbookId}>
                    {tb.name}
                    {tb.publisher && ` (${tb.publisher})`}
                  </option>
                ))}
              </select>

              {/* 페이지 범위 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">시작 페이지</label>
                  <input
                    type="number"
                    min={1}
                    value={entry.startPage || ''}
                    onChange={(e) =>
                      updateProgressEntry(
                        entry.id,
                        'startPage',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="45"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">끝 페이지</label>
                  <input
                    type="number"
                    min={1}
                    value={entry.endPage || ''}
                    onChange={(e) =>
                      updateProgressEntry(
                        entry.id,
                        'endPage',
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="52"
                  />
                </div>
              </div>

              {/* 진행 페이지 수 표시 */}
              {entry.startPage && entry.endPage && entry.endPage >= entry.startPage && (
                <p className="text-xs text-primary-600 mt-2">
                  {entry.endPage - entry.startPage + 1}페이지 진행
                </p>
              )}
            </div>
          ))}

          {/* 교재 진도 추가 버튼 */}
          <div className="flex gap-2 flex-wrap">
            {progressEntries.length < 5 && (
              <button
                type="button"
                onClick={addProgressEntry}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + 교재 진도 추가
              </button>
            )}
            {textbooksLoading && (
              <span className="text-xs text-gray-500">교재 목록 로딩 중...</span>
            )}
            {!textbooksLoading && textbooks.length === 0 && (
              <span className="text-xs text-gray-500">
                등록된 교재가 없습니다.{' '}
                <button
                  type="button"
                  onClick={() => router.push('/lessons/textbooks')}
                  className="text-primary-600 hover:underline"
                >
                  교재 등록하기
                </button>
              </span>
            )}
          </div>
        </div>

        {/* 학생 상태 (선택) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            학생 상태
          </label>

          {/* 이해도 */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">이해도</p>
            <div className="flex gap-1 sm:gap-2">
              {LEVEL_LABELS.map((level, idx) => (
                <button
                  key={level}
                  type="button"
                  className={`flex-1 py-2 px-1 sm:px-2 rounded-lg border text-xs sm:text-sm transition-colors ${
                    understanding === idx + 1
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setUnderstanding(idx + 1)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* 집중도 */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">집중도</p>
            <div className="flex gap-1 sm:gap-2">
              {LEVEL_LABELS.map((level, idx) => (
                <button
                  key={level}
                  type="button"
                  className={`flex-1 py-2 px-1 sm:px-2 rounded-lg border text-xs sm:text-sm transition-colors ${
                    concentration === idx + 1
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setConcentration(idx + 1)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* 참여도 */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">참여도</p>
            <div className="flex gap-1 sm:gap-2">
              {LEVEL_LABELS.map((level, idx) => (
                <button
                  key={level}
                  type="button"
                  className={`flex-1 py-2 px-1 sm:px-2 rounded-lg border text-xs sm:text-sm transition-colors ${
                    participation === idx + 1
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setParticipation(idx + 1)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* 추가 메모 */}
          <div>
            <label className="text-sm text-gray-600">추가 메모 (선택)</label>
            <textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="예: 오늘 평소보다 피곤해 보였음. 다음 시간에 복습 필요"
            />
          </div>
        </div>

        {/* 숙제 (선택) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            숙제
          </label>

          <textarea
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none mb-3"
            rows={4}
            placeholder={`예: 수학의 정석 p.45-52 복습
문제집 3-1번부터 3-10번까지 풀어오기`}
          />

          {/* 제출 기한 */}
          <div>
            <label className="text-xs text-gray-600">제출 기한</label>
            <input
              type="date"
              value={homeworkDueDate}
              onChange={(e) => setHomeworkDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* 학부모 공유 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 text-blue-600 mt-0.5"
              checked={shareWithParent}
              onChange={(e) => setShareWithParent(e.target.checked)}
            />
            <div className="ml-3">
              <span className="text-sm font-medium text-gray-900">
                학부모님께 이 기록을 공유합니다
              </span>
              <p className="text-xs text-gray-600 mt-1">
                체크 해제 시 학부모님이 이 수업 기록을 볼 수 없습니다.
              </p>
            </div>
          </label>
        </div>

        {/* 자동 저장 상태 */}
        {lastSaved && (
          <p className="text-xs text-gray-500 text-center">
            자동 저장됨:{' '}
            {lastSaved.toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        )}
      </form>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="flex-1 py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      {/* 로딩 오버레이 */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-700 text-center">저장 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
