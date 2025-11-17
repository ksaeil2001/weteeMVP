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
} from '@/types/schedule';

import {
  getMockSchedulesByDateRange,
  getMockScheduleById,
  getMockMakeupSlots,
  getMockExamSchedules,
} from '@/mocks/schedules';

/**
 * 일정 목록 조회 (날짜 범위 기준)
 *
 * TODO(F-003): 실제 API 연동
 * - GET /api/v1/schedules?from=YYYY-MM-DD&to=YYYY-MM-DD&groupId=...&type=...
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { items: Schedule[], pagination: {...} } }
 *
 * @param params 조회 파라미터 (날짜 범위, 그룹 ID, 타입 등)
 * @returns Promise<Schedule[]>
 */
export async function fetchSchedules(
  params: ScheduleListParams
): Promise<Schedule[]> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<{ items: Schedule[] }>('GET', '/api/v1/schedules', { params });
  // return response.items;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchSchedules] 목업 데이터 반환:', params);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        getMockSchedulesByDateRange(params.from, params.to, params.groupId)
      );
    }, 300); // 네트워크 지연 시뮬레이션
  });
}

/**
 * 일정 상세 조회
 *
 * TODO(F-003): 실제 API 연동
 * - GET /api/v1/schedules/{scheduleId}
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: Schedule }
 *
 * @param scheduleId 일정 ID
 * @returns Promise<Schedule>
 */
export async function fetchScheduleById(
  scheduleId: string
): Promise<Schedule> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<Schedule>('GET', `/api/v1/schedules/${scheduleId}`);
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchScheduleById] 목업 데이터 반환:', scheduleId);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const schedule = getMockScheduleById(scheduleId);
      if (schedule) {
        resolve(schedule);
      } else {
        reject(new Error('일정을 찾을 수 없습니다.'));
      }
    }, 300);
  });
}

/**
 * 정규 수업 일정 등록 (반복 일정)
 *
 * TODO(F-003): 실제 API 연동
 * - POST /api/v1/schedules/regular
 * - Authorization: Bearer <access_token>
 * - 요청: CreateRegularSchedulePayload
 * - 응답: { success: true, data: { schedules: Schedule[] } }
 *
 * @param payload 정규 수업 등록 정보
 * @returns Promise<Schedule[]> 생성된 일정 목록
 */
export async function createRegularSchedule(
  payload: CreateRegularSchedulePayload
): Promise<Schedule[]> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<{ schedules: Schedule[] }>('POST', '/api/v1/schedules/regular', { body: payload });
  // return response.schedules;

  // 목업 데이터 반환 (개발 중)
  console.log('[createRegularSchedule] 목업 정규 수업 생성:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      // 간단한 목업: 앞으로 4주치 일정 생성
      const schedules: Schedule[] = [];
      const startDate = new Date(payload.recurrence.startDate);

      for (let i = 0; i < 8; i++) {
        // 8개 일정 생성 (4주 × 2회/주)
        const scheduleDate = new Date(startDate);
        scheduleDate.setDate(scheduleDate.getDate() + i * 3); // 3일 간격

        const [hours, minutes] = payload.startTime.split(':');
        scheduleDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const endDate = new Date(scheduleDate);
        endDate.setMinutes(endDate.getMinutes() + payload.duration);

        schedules.push({
          scheduleId: `schedule-new-${Date.now()}-${i}`,
          groupId: payload.groupId,
          title: payload.title,
          type: 'REGULAR',
          startAt: scheduleDate.toISOString(),
          endAt: endDate.toISOString(),
          status: 'SCHEDULED',
          location: payload.location,
          memo: payload.memo,
          teacherId: 'teacher-1',
          teacherName: '김선생',
          createdAt: new Date().toISOString(),
        });
      }

      resolve(schedules);
    }, 500);
  });
}

/**
 * 단일 일정 생성 (보강, 기타)
 *
 * TODO(F-003): 실제 API 연동
 * - POST /api/v1/schedules
 * - Authorization: Bearer <access_token>
 * - 요청: CreateSchedulePayload
 * - 응답: { success: true, data: Schedule }
 *
 * @param payload 일정 생성 정보
 * @returns Promise<Schedule>
 */
export async function createSchedule(
  payload: CreateSchedulePayload
): Promise<Schedule> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<Schedule>('POST', '/api/v1/schedules', { body: payload });
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[createSchedule] 목업 일정 생성:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSchedule: Schedule = {
        scheduleId: `schedule-${Date.now()}`,
        groupId: payload.groupId,
        title: payload.title,
        type: payload.type,
        startAt: payload.startAt,
        endAt: payload.endAt,
        status: 'SCHEDULED',
        location: payload.location,
        memo: payload.memo,
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
 * 일정 수정
 *
 * TODO(F-003): 실제 API 연동
 * - PATCH /api/v1/schedules/{scheduleId}
 * - Authorization: Bearer <access_token>
 * - 요청: UpdateSchedulePayload
 * - 응답: { success: true, data: Schedule }
 *
 * @param scheduleId 일정 ID
 * @param payload 수정할 일정 정보
 * @returns Promise<Schedule>
 */
export async function updateSchedule(
  scheduleId: string,
  payload: UpdateSchedulePayload
): Promise<Schedule> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<Schedule>('PATCH', `/api/v1/schedules/${scheduleId}`, { body: payload });
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[updateSchedule] 목업 일정 수정:', scheduleId, payload);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const schedule = getMockScheduleById(scheduleId);
      if (schedule) {
        const updatedSchedule: Schedule = {
          ...schedule,
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        resolve(updatedSchedule);
      } else {
        reject(new Error('일정을 찾을 수 없습니다.'));
      }
    }, 500);
  });
}

/**
 * 일정 삭제
 *
 * TODO(F-003): 실제 API 연동
 * - DELETE /api/v1/schedules/{scheduleId}
 * - Authorization: Bearer <access_token>
 * - 응답: 204 No Content
 *
 * @param scheduleId 일정 ID
 * @returns Promise<void>
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  // TODO(F-003): 실제 API 호출
  // await apiRequest('DELETE', `/api/v1/schedules/${scheduleId}`);

  // 목업 데이터 반환 (개발 중)
  console.log('[deleteSchedule] 목업 일정 삭제:', scheduleId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
}

/**
 * 보강 가능 시간 오픈 (선생님)
 *
 * TODO(F-003): 실제 API 연동
 * - POST /api/v1/schedules/makeup-slots
 * - Authorization: Bearer <access_token>
 * - 요청: CreateMakeupSlotPayload
 * - 응답: { success: true, data: { slots: MakeupSlot[] } }
 *
 * @param payload 보강 시간 오픈 정보
 * @returns Promise<MakeupSlot[]>
 */
export async function createMakeupSlots(
  payload: CreateMakeupSlotPayload
): Promise<MakeupSlot[]> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<{ slots: MakeupSlot[] }>('POST', '/api/v1/schedules/makeup-slots', { body: payload });
  // return response.slots;

  // 목업 데이터 반환 (개발 중)
  console.log('[createMakeupSlots] 목업 보강 시간 오픈:', payload);
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
 * TODO(F-003): 실제 API 연동
 * - GET /api/v1/schedules/makeup-slots?groupId=...
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { items: MakeupSlot[] } }
 *
 * @param groupId 그룹 ID (선택)
 * @returns Promise<MakeupSlot[]>
 */
export async function fetchMakeupSlots(
  groupId?: string
): Promise<MakeupSlot[]> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<{ items: MakeupSlot[] }>('GET', '/api/v1/schedules/makeup-slots', { params: { groupId } });
  // return response.items;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchMakeupSlots] 목업 보강 시간 조회:', groupId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockMakeupSlots(groupId));
    }, 300);
  });
}

/**
 * 보강 수업 예약 (학생)
 *
 * TODO(F-003): 실제 API 연동
 * - POST /api/v1/schedules/makeup-slots/{slotId}/book
 * - Authorization: Bearer <access_token>
 * - 요청: BookMakeupSlotPayload
 * - 응답: { success: true, data: Schedule }
 *
 * @param payload 보강 예약 정보
 * @returns Promise<Schedule> 생성된 보강 수업 일정
 */
export async function bookMakeupSlot(
  payload: BookMakeupSlotPayload
): Promise<Schedule> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<Schedule>('POST', `/api/v1/schedules/makeup-slots/${payload.slotId}/book`, { body: payload });
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[bookMakeupSlot] 목업 보강 예약:', payload);
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
 * TODO(F-003): 실제 API 연동
 * - POST /api/v1/schedules/exams
 * - Authorization: Bearer <access_token>
 * - 요청: CreateExamSchedulePayload
 * - 응답: { success: true, data: ExamSchedule }
 *
 * @param payload 시험 일정 정보
 * @returns Promise<ExamSchedule>
 */
export async function createExamSchedule(
  payload: CreateExamSchedulePayload
): Promise<ExamSchedule> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<ExamSchedule>('POST', '/api/v1/schedules/exams', { body: payload });
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[createExamSchedule] 목업 시험 일정 생성:', payload);
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
 * TODO(F-003): 실제 API 연동
 * - GET /api/v1/schedules/exams?groupId=...&studentId=...
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { items: ExamSchedule[] } }
 *
 * @param groupId 그룹 ID (선택)
 * @param studentId 학생 ID (선택)
 * @returns Promise<ExamSchedule[]>
 */
export async function fetchExamSchedules(
  groupId?: string,
  studentId?: string
): Promise<ExamSchedule[]> {
  // TODO(F-003): 실제 API 호출
  // const response = await apiRequest<{ items: ExamSchedule[] }>('GET', '/api/v1/schedules/exams', { params: { groupId, studentId } });
  // return response.items;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchExamSchedules] 목업 시험 일정 조회:', {
    groupId,
    studentId,
  });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockExamSchedules(groupId, studentId));
    }, 300);
  });
}
