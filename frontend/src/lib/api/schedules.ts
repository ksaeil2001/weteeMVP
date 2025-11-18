/**
 * Schedules API - WeTee MVP
 * Feature: F-003 수업 일정 관리
 *
 * Based on:
 * - API_명세서.md (6.3 F-003: 수업 일정 관리)
 * - F-003_수업_일정_관리.md
 *
 * 역할:
 * - 일정 관련 API 엔드포인트 시그니처 정의
 * - 현재는 목업 데이터 반환 (실제 API 연동 전)
 *
 * TODO (F-003 디버깅/연결 단계):
 * - 실제 FastAPI 백엔드 /api/v1/schedules 엔드포인트와 연결
 * - apiClient.ts의 apiRequest를 사용하여 네트워크 요청
 * - 에러 핸들링 강화 (네트워크 오류, 권한 오류 등)
 * - 페이지네이션 처리
 */

import type {
  Schedule,
  CreateRegularSchedulePayload,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  ScheduleListParams,
  CreateMakeupSlotPayload,
  MakeupSlot,
  BookMakeupSlotPayload,
  CreateExamSchedulePayload,
  ExamSchedule,
  ScheduleType,
  ScheduleStatus,
  RecurrenceFrequency,
  RecurrenceEndType,
} from '@/types/schedule';

import { apiRequest } from '@/lib/apiClient';

/**
 * Backend Schedule Response (snake_case)
 * Backend API에서 반환하는 스케줄 응답 형식
 */
interface BackendScheduleResponse {
  schedule_id: string;
  group_id: string;
  group_name?: string;
  title: string;
  type: string;
  start_at: string;
  end_at: string;
  status: string;
  recurrence_rule?: {
    frequency: string;
    interval: number;
    days_of_week?: number[];
    start_date: string;
    end_type: string;
    end_date?: string;
    end_count?: number;
  };
  location?: string;
  memo?: string;
  created_at: string;
  updated_at?: string;
  teacher_id?: string;
  teacher_name?: string;
  student_ids?: string[];
  student_names?: string[];
  original_schedule_id?: string;
  cancel_reason?: string;
  reschedule_reason?: string;
}

/**
 * Backend Adapter Payloads
 */
interface BackendCreateRegularSchedulePayload {
  group_id: string;
  student_ids?: string[];
  title: string;
  start_time: string;
  duration: number;
  location?: string;
  memo?: string;
  recurrence: {
    frequency: string;
    interval: number;
    days_of_week?: number[];
    start_date: string;
    end_type: string;
    end_date?: string;
    end_count?: number;
  };
}

interface BackendCreateSchedulePayload {
  group_id: string;
  title: string;
  type: string;
  start_at: string;
  end_at: string;
  location?: string;
  memo?: string;
  student_ids?: string[];
  original_schedule_id?: string;
}

interface BackendUpdateSchedulePayload {
  title?: string;
  start_at?: string;
  end_at?: string;
  location?: string;
  memo?: string;
  status?: string;
  reschedule_reason?: string;
  cancel_reason?: string;
}

/**
 * Pagination Info
 */
interface PaginationInfo {
  page?: number;
  size?: number;
  total?: number;
  total_pages?: number;
}

/**
 * ==========================
 * Adapter Functions (Backend ↔ Frontend)
 * ==========================
 *
 * Backend: snake_case (schedule_id, group_id, start_at)
 * Frontend: camelCase (scheduleId, groupId, startAt)
 */

/**
 * Backend ScheduleOut (snake_case) → Frontend Schedule (camelCase)
 */
function adaptScheduleFromBackend(backendSchedule: BackendScheduleResponse): Schedule {
  return {
    scheduleId: backendSchedule.schedule_id,
    groupId: backendSchedule.group_id,
    groupName: backendSchedule.group_name,
    title: backendSchedule.title,
    type: backendSchedule.type as ScheduleType,
    startAt: backendSchedule.start_at,
    endAt: backendSchedule.end_at,
    status: backendSchedule.status as ScheduleStatus,
    recurrenceRule: backendSchedule.recurrence_rule
      ? {
          frequency: backendSchedule.recurrence_rule.frequency as RecurrenceFrequency,
          interval: backendSchedule.recurrence_rule.interval,
          daysOfWeek: backendSchedule.recurrence_rule.days_of_week,
          startDate: backendSchedule.recurrence_rule.start_date,
          endType: backendSchedule.recurrence_rule.end_type as RecurrenceEndType,
          endDate: backendSchedule.recurrence_rule.end_date,
          endCount: backendSchedule.recurrence_rule.end_count,
        }
      : undefined,
    location: backendSchedule.location,
    memo: backendSchedule.memo,
    createdAt: backendSchedule.created_at,
    updatedAt: backendSchedule.updated_at,
    teacherId: backendSchedule.teacher_id,
    teacherName: backendSchedule.teacher_name,
    studentIds: backendSchedule.student_ids,
    studentNames: backendSchedule.student_names,
    originalScheduleId: backendSchedule.original_schedule_id,
    cancelReason: backendSchedule.cancel_reason,
    rescheduleReason: backendSchedule.reschedule_reason,
  };
}

/**
 * Frontend CreateRegularSchedulePayload (camelCase) → Backend (snake_case)
 */
function adaptCreateRegularSchedulePayload(
  payload: CreateRegularSchedulePayload
): BackendCreateRegularSchedulePayload {
  return {
    group_id: payload.groupId,
    student_ids: payload.studentIds,
    title: payload.title,
    start_time: payload.startTime,
    duration: payload.duration,
    location: payload.location,
    memo: payload.memo,
    recurrence: {
      frequency: payload.recurrence.frequency,
      interval: payload.recurrence.interval,
      days_of_week: payload.recurrence.daysOfWeek,
      start_date: payload.recurrence.startDate,
      end_type: payload.recurrence.endType,
      end_date: payload.recurrence.endDate,
      end_count: payload.recurrence.endCount,
    },
  };
}

/**
 * Frontend CreateSchedulePayload (camelCase) → Backend (snake_case)
 */
function adaptCreateSchedulePayload(payload: CreateSchedulePayload): BackendCreateSchedulePayload {
  return {
    group_id: payload.groupId,
    title: payload.title,
    type: payload.type,
    start_at: payload.startAt,
    end_at: payload.endAt,
    location: payload.location,
    memo: payload.memo,
    student_ids: payload.studentIds,
    original_schedule_id: payload.originalScheduleId,
  };
}

/**
 * Frontend UpdateSchedulePayload (camelCase) → Backend (snake_case)
 */
function adaptUpdateSchedulePayload(payload: UpdateSchedulePayload): BackendUpdateSchedulePayload {
  return {
    title: payload.title,
    start_at: payload.startAt,
    end_at: payload.endAt,
    location: payload.location,
    memo: payload.memo,
    status: payload.status,
    reschedule_reason: payload.rescheduleReason,
    cancel_reason: payload.cancelReason,
  };
}

/**
 * ==========================
 * API Functions
 * ==========================
 */

/**
 * 일정 목록 조회 (날짜 범위 기준)
 *
 * GET /api/v1/schedules?from=YYYY-MM-DD&to=YYYY-MM-DD&groupId=...&type=...
 * Authorization: Bearer <access_token>
 * 응답: { items: ScheduleOut[], pagination: {...} }
 *
 * @param params 조회 파라미터 (날짜 범위, 그룹 ID, 타입 등)
 * @returns Promise<Schedule[]>
 */
export async function fetchSchedules(
  params: ScheduleListParams
): Promise<Schedule[]> {
  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append('from_date', params.from);
  queryParams.append('to_date', params.to);
  if (params.groupId) queryParams.append('group_id', params.groupId);
  if (params.studentId) queryParams.append('student_id', params.studentId);
  if (params.type) queryParams.append('type', params.type);
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.size) queryParams.append('size', params.size.toString());

  const response = await apiRequest<{
    items: BackendScheduleResponse[];
    pagination: PaginationInfo;
  }>(`/schedules?${queryParams.toString()}`, {
    method: 'GET',
  });

  // Convert backend response (snake_case) to frontend format (camelCase)
  return response.items.map(adaptScheduleFromBackend);
}

/**
 * 일정 상세 조회
 *
 * GET /api/v1/schedules/{scheduleId}
 * Authorization: Bearer <access_token>
 * 응답: ScheduleOut
 *
 * @param scheduleId 일정 ID
 * @returns Promise<Schedule>
 */
export async function fetchScheduleById(
  scheduleId: string
): Promise<Schedule> {
  const backendSchedule = await apiRequest<BackendScheduleResponse>(
    `/schedules/${scheduleId}`,
    {
      method: 'GET',
    }
  );

  return adaptScheduleFromBackend(backendSchedule);
}

/**
 * 정규 수업 일정 등록 (반복 일정)
 *
 * POST /api/v1/schedules/regular
 * Authorization: Bearer <access_token>
 * 요청: CreateRegularSchedulePayload
 * 응답: { schedules: ScheduleOut[] }
 *
 * @param payload 정규 수업 등록 정보
 * @returns Promise<Schedule[]> 생성된 일정 목록
 */
export async function createRegularSchedule(
  payload: CreateRegularSchedulePayload
): Promise<Schedule[]> {
  const backendPayload = adaptCreateRegularSchedulePayload(payload);

  const response = await apiRequest<{ schedules: BackendScheduleResponse[] }>(
    '/schedules/regular',
    {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    }
  );

  return response.schedules.map(adaptScheduleFromBackend);
}

/**
 * 단일 일정 생성 (보강, 기타)
 *
 * POST /api/v1/schedules
 * Authorization: Bearer <access_token>
 * 요청: CreateSchedulePayload
 * 응답: ScheduleOut
 *
 * @param payload 일정 생성 정보
 * @returns Promise<Schedule>
 */
export async function createSchedule(
  payload: CreateSchedulePayload
): Promise<Schedule> {
  const backendPayload = adaptCreateSchedulePayload(payload);

  const backendSchedule = await apiRequest<BackendScheduleResponse>('/schedules', {
    method: 'POST',
    body: JSON.stringify(backendPayload),
  });

  return adaptScheduleFromBackend(backendSchedule);
}

/**
 * 일정 수정
 *
 * PATCH /api/v1/schedules/{scheduleId}
 * Authorization: Bearer <access_token>
 * 요청: UpdateSchedulePayload
 * 응답: ScheduleOut
 *
 * @param scheduleId 일정 ID
 * @param payload 수정할 일정 정보
 * @returns Promise<Schedule>
 */
export async function updateSchedule(
  scheduleId: string,
  payload: UpdateSchedulePayload
): Promise<Schedule> {
  const backendPayload = adaptUpdateSchedulePayload(payload);

  const backendSchedule = await apiRequest<BackendScheduleResponse>(
    `/schedules/${scheduleId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(backendPayload),
    }
  );

  return adaptScheduleFromBackend(backendSchedule);
}

/**
 * 일정 삭제
 *
 * DELETE /api/v1/schedules/{scheduleId}
 * Authorization: Bearer <access_token>
 * 응답: 204 No Content
 *
 * @param scheduleId 일정 ID
 * @returns Promise<void>
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  await apiRequest<void>(`/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
}

/**
 * ==========================
 * TODO(Phase 2): Makeup Slots, Exam Schedules
 * ==========================
 *
 * Backend에서 아직 구현되지 않음 (backend/app/schemas/schedule.py 참조)
 * 현재는 목업 데이터로 동작하며, 실제 API 연동은 Phase 2에서 진행 예정
 */

/**
 * 보강 가능 시간 오픈 (선생님)
 *
 * TODO(Phase 2): 백엔드 API 구현 후 연동
 * - POST /api/v1/schedules/makeup-slots
 * - Authorization: Bearer <access_token>
 * - 요청: CreateMakeupSlotPayload
 * - 응답: { slots: MakeupSlot[] }
 *
 * @param payload 보강 시간 오픈 정보
 * @returns Promise<MakeupSlot[]>
 */
export async function createMakeupSlots(
  payload: CreateMakeupSlotPayload
): Promise<MakeupSlot[]> {
  // TODO(Phase 2): 실제 API 구현 대기 중
  console.warn('[createMakeupSlots] Phase 2 기능: 목업 데이터 반환');
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSlots: MakeupSlot[] = payload.slots.map((slot, index) => ({
        slotId: `slot-new-${Date.now()}-${index}`,
        teacherId: 'teacher-1',
        teacherName: '김선생',
        groupId: payload.groupId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        location: slot.location,
        isBooked: false,
        createdAt: new Date().toISOString(),
      }));
      resolve(newSlots);
    }, 500);
  });
}

/**
 * 보강 가능 시간 조회
 *
 * TODO(Phase 2): 백엔드 API 구현 후 연동
 * - GET /api/v1/schedules/makeup-slots?groupId=...
 * - Authorization: Bearer <access_token>
 * - 응답: { items: MakeupSlot[] }
 *
 * @param groupId 그룹 ID (선택)
 * @returns Promise<MakeupSlot[]>
 */
export async function fetchMakeupSlots(
  groupId?: string
): Promise<MakeupSlot[]> {
  // TODO(Phase 2): 실제 API 구현 대기 중
  console.warn('[fetchMakeupSlots] Phase 2 기능: 목업 데이터 반환');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]); // Empty array for now
    }, 300);
  });
}

/**
 * 보강 수업 예약 (학생)
 *
 * TODO(Phase 2): 백엔드 API 구현 후 연동
 * - POST /api/v1/schedules/makeup-slots/{slotId}/book
 * - Authorization: Bearer <access_token>
 * - 요청: BookMakeupSlotPayload
 * - 응답: Schedule
 *
 * @param payload 보강 예약 정보
 * @returns Promise<Schedule> 생성된 보강 수업 일정
 */
export async function bookMakeupSlot(
  payload: BookMakeupSlotPayload
): Promise<Schedule> {
  // TODO(Phase 2): 실제 API 구현 대기 중
  console.warn('[bookMakeupSlot] Phase 2 기능: 목업 데이터 반환');
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSchedule: Schedule = {
        scheduleId: `schedule-makeup-${Date.now()}`,
        groupId: 'group-1',
        title: '수학 보강 수업',
        type: 'MAKEUP',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        originalScheduleId: payload.originalScheduleId,
        teacherId: 'teacher-1',
        teacherName: '김선생',
        createdAt: new Date().toISOString(),
      };
      resolve(newSchedule);
    }, 500);
  });
}

/**
 * 시험 일정 등록
 *
 * TODO(Phase 2): 백엔드 API 구현 후 연동
 * - POST /api/v1/schedules/exams
 * - Authorization: Bearer <access_token>
 * - 요청: CreateExamSchedulePayload
 * - 응답: ExamSchedule
 *
 * @param payload 시험 일정 정보
 * @returns Promise<ExamSchedule>
 */
export async function createExamSchedule(
  payload: CreateExamSchedulePayload
): Promise<ExamSchedule> {
  // TODO(Phase 2): 실제 API 구현 대기 중
  console.warn('[createExamSchedule] Phase 2 기능: 목업 데이터 반환');
  return new Promise((resolve) => {
    setTimeout(() => {
      const newExam: ExamSchedule = {
        examId: `exam-${Date.now()}`,
        groupId: payload.groupId,
        studentId: payload.studentId,
        examName: payload.examName,
        school: payload.school,
        startDate: payload.startDate,
        endDate: payload.endDate,
        subjects: payload.subjects,
        memo: payload.memo,
        createdAt: new Date().toISOString(),
      };
      resolve(newExam);
    }, 500);
  });
}

/**
 * 시험 일정 조회
 *
 * TODO(Phase 2): 백엔드 API 구현 후 연동
 * - GET /api/v1/schedules/exams?groupId=...&studentId=...
 * - Authorization: Bearer <access_token>
 * - 응답: { items: ExamSchedule[] }
 *
 * @param groupId 그룹 ID (선택)
 * @param studentId 학생 ID (선택)
 * @returns Promise<ExamSchedule[]>
 */
export async function fetchExamSchedules(
  groupId?: string,
  studentId?: string
): Promise<ExamSchedule[]> {
  // TODO(Phase 2): 실제 API 구현 대기 중
  console.warn('[fetchExamSchedules] Phase 2 기능: 목업 데이터 반환');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]); // Empty array for now
    }, 300);
  });
}
