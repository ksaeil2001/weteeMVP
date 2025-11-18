/**
 * Lessons API - WeTee MVP
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Based on:
 * - API_명세서.md (6.5 F-005: 수업 기록 및 진도 관리)
 * - backend/app/routers/lessons.py
 * - backend/app/routers/textbooks.py
 * - backend/app/schemas/lesson.py
 * - backend/app/schemas/textbook.py
 * - F-005_lesson_progress_completion_2025-11-18.md
 *
 * 역할:
 * - 수업 기록 및 진도 관련 API 엔드포인트와 실제 백엔드 연동
 * - 백엔드 응답(snake_case)을 프론트엔드 타입(camelCase)으로 변환
 * - apiClient.ts의 apiRequest를 사용하여 인증 및 에러 처리
 */

import type {
  LessonRecord,
  Textbook,
  ProgressRecord,
  CreateLessonRecordPayload,
  UpdateLessonRecordPayload,
  CreateTextbookPayload,
  UpdateTextbookPayload,
} from '@/types/lesson';

import { apiRequest } from '@/lib/apiClient';

// ==========================
// Backend Response Types (snake_case)
// ==========================

interface BackendProgressRecordOut {
  progress_record_id: string;
  lesson_record_id: string;
  textbook_id: string;
  textbook_title?: string | null;
  start_page: number;
  end_page: number;
  pages_covered: number;
  created_at: string;
}

interface BackendLessonRecordOut {
  lesson_record_id: string;
  schedule_id: string;
  group_id: string;
  content: string;
  student_feedback?: string | null;
  homework?: string | null;
  created_by: string;
  teacher_name?: string | null;
  is_shared: boolean;
  shared_at?: string | null;
  parent_viewed_at?: string | null;
  student_viewed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  progress_records?: BackendProgressRecordOut[] | null;
  schedule_title?: string | null;
  schedule_date?: string | null;
}

interface BackendTextbookOut {
  textbook_id: string;
  group_id: string;
  title: string;
  publisher?: string | null;
  total_pages?: number | null;
  start_page: number;
  is_active: boolean;
  current_page?: number | null;
  progress_percentage?: number | null;
  created_at: string;
  updated_at?: string | null;
}

interface BackendTextbookListResponse {
  items: BackendTextbookOut[];
}

interface BackendProgressSummary {
  textbook_id: string;
  textbook_title: string;
  publisher?: string | null;
  total_pages?: number | null;
  start_page: number;
  current_page: number;
  progress_percentage: number;
  total_lessons: number;
  average_pages_per_lesson: number;
  first_lesson_date?: string | null;
  last_lesson_date?: string | null;
}

interface BackendProgressHistoryItem {
  progress_record_id: string;
  lesson_record_id: string;
  lesson_date: string;
  start_page: number;
  end_page: number;
  pages_covered: number;
  content_preview?: string | null;
}

interface BackendProgressHistoryResponse {
  summary: BackendProgressSummary;
  history: BackendProgressHistoryItem[];
  chart_labels?: string[] | null;
  chart_values?: number[] | null;
}

// ==========================
// Request Payload Types (snake_case for backend)
// ==========================

interface BackendProgressRecordCreate {
  textbook_id: string;
  start_page: number;
  end_page: number;
}

interface BackendCreateLessonRecordPayload {
  content: string;
  student_feedback?: string;
  homework?: string;
  progress_records?: BackendProgressRecordCreate[];
}

interface BackendUpdateLessonRecordPayload {
  content?: string;
  student_feedback?: string;
  homework?: string;
}

interface BackendCreateTextbookPayload {
  title: string;
  publisher?: string;
  total_pages?: number;
  start_page?: number;
}

interface BackendUpdateTextbookPayload {
  title?: string;
  publisher?: string;
  total_pages?: number;
  is_active?: boolean;
}

// ==========================
// Response Converters (Backend → Frontend)
// ==========================

/**
 * 백엔드 진도 기록 응답을 프론트엔드 ProgressRecord 타입으로 변환
 */
function convertBackendProgressRecordToFrontend(
  backendProgress: BackendProgressRecordOut
): ProgressRecord {
  return {
    progressId: backendProgress.progress_record_id,
    lessonRecordId: backendProgress.lesson_record_id,
    textbook: {
      textbookId: backendProgress.textbook_id,
      name: backendProgress.textbook_title ?? '교재명 미제공',
    },
    pageStart: backendProgress.start_page,
    pageEnd: backendProgress.end_page,
    pagesCovered: backendProgress.pages_covered,
    createdAt: backendProgress.created_at,
  };
}

/**
 * 백엔드 수업 기록 응답을 프론트엔드 LessonRecord 타입으로 변환
 */
function convertBackendLessonRecordToFrontend(
  backendRecord: BackendLessonRecordOut
): LessonRecord {
  return {
    lessonRecordId: backendRecord.lesson_record_id,
    scheduleId: backendRecord.schedule_id,
    groupId: backendRecord.group_id,
    date: backendRecord.schedule_date ?? backendRecord.created_at.split('T')[0],
    title: backendRecord.schedule_title,
    content: backendRecord.content,
    studentFeedback: backendRecord.student_feedback ?? undefined,
    homework: backendRecord.homework ?? undefined,
    progressRecords: backendRecord.progress_records?.map(
      convertBackendProgressRecordToFrontend
    ),
    createdBy: {
      userId: backendRecord.created_by,
      name: backendRecord.teacher_name ?? '선생님',
    },
    isShared: backendRecord.is_shared,
    sharedAt: backendRecord.shared_at ?? undefined,
    viewedBy: {
      parentViewedAt: backendRecord.parent_viewed_at ?? undefined,
      studentViewedAt: backendRecord.student_viewed_at ?? undefined,
    },
    createdAt: backendRecord.created_at,
    updatedAt: backendRecord.updated_at ?? undefined,
  };
}

/**
 * 백엔드 교재 응답을 프론트엔드 Textbook 타입으로 변환
 */
function convertBackendTextbookToFrontend(
  backendTextbook: BackendTextbookOut
): Textbook {
  return {
    textbookId: backendTextbook.textbook_id,
    groupId: backendTextbook.group_id,
    name: backendTextbook.title,
    publisher: backendTextbook.publisher ?? undefined,
    totalPages: backendTextbook.total_pages ?? undefined,
    startPage: backendTextbook.start_page,
    currentPage: backendTextbook.current_page ?? undefined,
    progressPercentage: backendTextbook.progress_percentage ?? undefined,
    isActive: backendTextbook.is_active,
    createdAt: backendTextbook.created_at,
    updatedAt: backendTextbook.updated_at ?? undefined,
  };
}

// ==========================
// Request Converters (Frontend → Backend)
// ==========================

/**
 * 프론트엔드 수업 기록 작성 페이로드를 백엔드 형식으로 변환
 */
function convertCreateLessonRecordPayloadToBackend(
  payload: CreateLessonRecordPayload
): BackendCreateLessonRecordPayload {
  return {
    content: payload.content,
    student_feedback: payload.studentFeedback,
    homework: payload.homework,
    progress_records: payload.progressRecords?.map((pr) => ({
      textbook_id: pr.textbookId,
      start_page: pr.pageStart ?? 1,
      end_page: pr.pageEnd ?? 1,
    })),
  };
}

/**
 * 프론트엔드 수업 기록 수정 페이로드를 백엔드 형식으로 변환
 */
function convertUpdateLessonRecordPayloadToBackend(
  payload: UpdateLessonRecordPayload
): BackendUpdateLessonRecordPayload {
  return {
    content: payload.content,
    student_feedback: payload.studentFeedback,
    homework: payload.homework,
  };
}

/**
 * 프론트엔드 교재 등록 페이로드를 백엔드 형식으로 변환
 */
function convertCreateTextbookPayloadToBackend(
  payload: CreateTextbookPayload
): BackendCreateTextbookPayload {
  return {
    title: payload.name,
    publisher: payload.publisher,
    total_pages: payload.totalPages,
    start_page: payload.startPage,
  };
}

/**
 * 프론트엔드 교재 수정 페이로드를 백엔드 형식으로 변환
 */
function convertUpdateTextbookPayloadToBackend(
  payload: UpdateTextbookPayload
): BackendUpdateTextbookPayload {
  return {
    title: payload.name,
    publisher: payload.publisher,
    total_pages: payload.totalPages,
    is_active: payload.isActive,
  };
}

// ==========================
// API Functions - Lesson Records
// ==========================

/**
 * 수업 기록 작성 (선생님만 가능)
 *
 * POST /api/v1/lesson-records/schedules/{schedule_id}
 *
 * 비즈니스 규칙:
 * - content: 필수, 10-2000자
 * - studentFeedback: 선택, 최대 500자
 * - homework: 선택, 최대 1000자
 * - progressRecords: 최대 5개 교재 진도 기록 가능
 *
 * @param payload 수업 기록 작성 정보
 * @returns Promise<LessonRecord>
 */
export async function createLessonRecord(
  payload: CreateLessonRecordPayload
): Promise<LessonRecord> {
  const backendPayload = convertCreateLessonRecordPayloadToBackend(payload);

  const response = await apiRequest<BackendLessonRecordOut>(
    `/lesson-records/schedules/${payload.scheduleId}`,
    {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    }
  );

  return convertBackendLessonRecordToFrontend(response);
}

/**
 * 수업 기록 상세 조회
 *
 * GET /api/v1/lesson-records/{lesson_record_id}
 *
 * - 그룹 멤버만 조회 가능
 * - 학부모/학생 조회 시 읽음 상태 자동 업데이트
 *
 * @param lessonRecordId 수업 기록 ID
 * @returns Promise<LessonRecord>
 */
export async function getLessonRecord(
  lessonRecordId: string
): Promise<LessonRecord> {
  const response = await apiRequest<BackendLessonRecordOut>(
    `/lesson-records/${lessonRecordId}`,
    {
      method: 'GET',
    }
  );

  return convertBackendLessonRecordToFrontend(response);
}

/**
 * 수업 기록 수정 (선생님만 가능)
 *
 * PATCH /api/v1/lesson-records/{lesson_record_id}
 *
 * 비즈니스 규칙:
 * - 작성 후 30일 이내만 수정 가능
 * - 본인이 작성한 기록만 수정 가능
 * - 진도 기록은 수정 불가
 *
 * @param lessonRecordId 수업 기록 ID
 * @param payload 수정할 정보
 * @returns Promise<LessonRecord>
 */
export async function updateLessonRecord(
  lessonRecordId: string,
  payload: UpdateLessonRecordPayload
): Promise<LessonRecord> {
  const backendPayload = convertUpdateLessonRecordPayloadToBackend(payload);

  const response = await apiRequest<BackendLessonRecordOut>(
    `/lesson-records/${lessonRecordId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(backendPayload),
    }
  );

  return convertBackendLessonRecordToFrontend(response);
}

/**
 * 수업 기록 삭제 (선생님만 가능)
 *
 * DELETE /api/v1/lesson-records/{lesson_record_id}
 *
 * 비즈니스 규칙:
 * - 작성 후 24시간 이내만 삭제 가능
 * - 본인이 작성한 기록만 삭제 가능
 *
 * @param lessonRecordId 수업 기록 ID
 * @returns Promise<void>
 */
export async function deleteLessonRecord(
  lessonRecordId: string
): Promise<void> {
  await apiRequest<void>(`/lesson-records/${lessonRecordId}`, {
    method: 'DELETE',
  });
}

// ==========================
// API Functions - Textbooks
// ==========================

/**
 * 교재 등록 (선생님만 가능)
 *
 * POST /api/v1/textbooks/groups/{group_id}
 *
 * 비즈니스 규칙:
 * - name: 필수, 1-200자
 * - 교재명 중복 허용
 *
 * @param payload 교재 등록 정보
 * @returns Promise<Textbook>
 */
export async function createTextbook(
  payload: CreateTextbookPayload
): Promise<Textbook> {
  const backendPayload = convertCreateTextbookPayloadToBackend(payload);

  const response = await apiRequest<BackendTextbookOut>(
    `/textbooks/groups/${payload.groupId}`,
    {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    }
  );

  return convertBackendTextbookToFrontend(response);
}

/**
 * 그룹별 교재 목록 조회
 *
 * GET /api/v1/textbooks/groups/{group_id}
 *
 * - 그룹 멤버만 조회 가능
 * - 현재 진도, 진도율 포함
 *
 * @param groupId 그룹 ID
 * @param includeInactive 비활성 교재 포함 여부 (기본: false)
 * @returns Promise<Textbook[]>
 */
export async function getTextbooks(
  groupId: string,
  includeInactive: boolean = false
): Promise<Textbook[]> {
  const queryParams = new URLSearchParams();
  if (includeInactive) {
    queryParams.append('include_inactive', 'true');
  }

  const response = await apiRequest<BackendTextbookListResponse>(
    `/textbooks/groups/${groupId}?${queryParams.toString()}`,
    {
      method: 'GET',
    }
  );

  return response.items.map(convertBackendTextbookToFrontend);
}

/**
 * 교재 수정 (선생님만 가능)
 *
 * PATCH /api/v1/textbooks/{textbook_id}
 *
 * - is_active를 false로 설정하여 숨기기 가능
 *
 * @param textbookId 교재 ID
 * @param payload 수정할 정보
 * @returns Promise<Textbook>
 */
export async function updateTextbook(
  textbookId: string,
  payload: UpdateTextbookPayload
): Promise<Textbook> {
  const backendPayload = convertUpdateTextbookPayloadToBackend(payload);

  const response = await apiRequest<BackendTextbookOut>(
    `/textbooks/${textbookId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(backendPayload),
    }
  );

  return convertBackendTextbookToFrontend(response);
}

/**
 * 교재 삭제 (선생님만 가능)
 *
 * DELETE /api/v1/textbooks/{textbook_id}
 *
 * 비즈니스 규칙:
 * - 진도 기록이 있는 교재는 삭제 불가
 * - 진도 기록이 있으면 409 Conflict 반환
 *
 * @param textbookId 교재 ID
 * @returns Promise<void>
 */
export async function deleteTextbook(textbookId: string): Promise<void> {
  await apiRequest<void>(`/textbooks/${textbookId}`, {
    method: 'DELETE',
  });
}

/**
 * 교재별 진도 요약 및 히스토리 조회
 *
 * GET /api/v1/textbooks/groups/{group_id}/progress/{textbook_id}
 *
 * - 그룹 멤버만 조회 가능
 * - 진도율, 평균 진도, 차트 데이터 포함
 *
 * @param groupId 그룹 ID
 * @param textbookId 교재 ID
 * @returns Promise<BackendProgressHistoryResponse>
 */
export async function getProgressSummary(
  groupId: string,
  textbookId: string
): Promise<BackendProgressHistoryResponse> {
  const response = await apiRequest<BackendProgressHistoryResponse>(
    `/textbooks/groups/${groupId}/progress/${textbookId}`,
    {
      method: 'GET',
    }
  );

  return response;
}

// ==========================
// Legacy Mock Functions (Deprecated)
// ==========================

// TODO(v2): 아래 함수들은 목업 데이터 기반으로 구현되어 있으며,
// 백엔드 API가 추가되면 위와 동일한 패턴으로 실제 연동해야 합니다.

/**
 * @deprecated 백엔드 API 미구현, 목업 데이터 반환
 */
export async function fetchLessonRecords(): Promise<LessonRecord[]> {
  console.warn('[fetchLessonRecords] 백엔드 API 미구현, 빈 배열 반환');
  return [];
}

/**
 * @deprecated 백엔드 API 미구현, 목업 데이터 반환
 */
export async function fetchLessonRecordById(
  lessonRecordId: string
): Promise<LessonRecord> {
  console.warn('[fetchLessonRecordById] 백엔드 API 미구현, getLessonRecord 사용 권장');
  return getLessonRecord(lessonRecordId);
}

/**
 * @deprecated 백엔드 API 미구현, 목업 데이터 반환
 */
export async function fetchTextbooks(groupId: string): Promise<Textbook[]> {
  console.warn('[fetchTextbooks] 백엔드 API 미구현, getTextbooks 사용 권장');
  return getTextbooks(groupId);
}

/**
 * @deprecated 백엔드 API 미구현
 */
export async function fetchGroupProgressSummary(): Promise<any> {
  console.warn('[fetchGroupProgressSummary] 백엔드 API 미구현');
  return null;
}

/**
 * @deprecated 백엔드 API 미구현
 */
export async function fetchStudentProgressSummary(): Promise<any> {
  console.warn('[fetchStudentProgressSummary] 백엔드 API 미구현');
  return null;
}

/**
 * @deprecated 백엔드 API 미구현
 */
export async function generateProgressReport(): Promise<any> {
  console.warn('[generateProgressReport] 백엔드 API 미구현');
  return null;
}

/**
 * @deprecated 백엔드 API 미구현
 */
export async function shareProgressReportToParents(): Promise<void> {
  console.warn('[shareProgressReportToParents] 백엔드 API 미구현');
}

/**
 * @deprecated 백엔드 API 미구현
 */
export async function fetchLessonRecordCards(): Promise<any[]> {
  console.warn('[fetchLessonRecordCards] 백엔드 API 미구현');
  return [];
}
