/**
 * Attendance API - WeTee MVP
 * Feature: F-004 출결 관리
 *
 * Based on:
 * - API_명세서.md (6.4 F-004: 출결 관리)
 *
 * 역할:
 * - 출결 관련 API 엔드포인트 시그니처 정의
 * - 현재는 목업 데이터 반환 (실제 API 연동 전)
 *
 * TODO (F-004 디버깅/연결 단계):
 * - 실제 FastAPI 백엔드 /api/v1/attendance 엔드포인트와 연결
 * - apiClient.ts의 apiRequest를 사용하여 네트워크 요청
 * - 에러 핸들링 강화 (네트워크 오류, 권한 오류 등)
 */

import type {
  AttendanceRecord,
  CheckAttendancePayload,
  UpdateAttendancePayload,
  StudentAttendanceStats,
  AttendanceStatsParams,
  LessonAttendanceSummary,
  AttendanceHistoryItem,
} from '@/types/attendance';

import {
  getAttendanceForLesson,
  getStudentAttendanceStats,
  getStudentAttendanceHistory,
  getGroupAttendanceSummaries,
  mockAttendanceRecords,
} from '@/mocks/attendance';

/**
 * 출결 체크 (선생님만 가능)
 *
 * TODO(F-004): 실제 API 연동
 * - POST /api/v1/schedules/{schedule_id}/attendance
 * - Authorization: Bearer <access_token>
 * - 요청: CheckAttendancePayload
 * - 응답: { success: true, data: { attendances: AttendanceRecord[] } }
 *
 * @param payload 출결 체크 정보
 * @returns Promise<AttendanceRecord[]>
 */
export async function checkAttendance(
  payload: CheckAttendancePayload
): Promise<AttendanceRecord[]> {
  // TODO(F-004): 실제 API 호출
  // const response = await apiRequest<{ attendances: AttendanceRecord[] }>(
  //   'POST',
  //   `/api/v1/schedules/${payload.scheduleId}/attendance`,
  //   { body: payload }
  // );
  // return response.attendances;

  // 목업 데이터 반환 (개발 중)
  console.log('[checkAttendance] 목업 출결 체크:', payload);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newRecords: AttendanceRecord[] = payload.attendances.map(
        (att, index) => ({
          attendanceId: `att-new-${Date.now()}-${index}`,
          scheduleId: payload.scheduleId,
          studentId: att.studentId,
          studentName: `학생 ${att.studentId}`,
          status: att.status,
          notes: att.notes,
          lateMinutes: att.lateMinutes,
          recordedBy: 'teacher-1',
          recordedAt:
            payload.checkedAt || new Date().toISOString(),
        })
      );
      resolve(newRecords);
    }, 500);
  });
}

/**
 * 출결 수정 (선생님만 가능)
 *
 * TODO(F-004): 실제 API 연동
 * - PATCH /api/v1/attendance/{attendance_id}
 * - Authorization: Bearer <access_token>
 * - 요청: UpdateAttendancePayload
 * - 응답: { success: true, data: AttendanceRecord }
 *
 * @param attendanceId 출결 ID
 * @param payload 수정할 출결 정보
 * @returns Promise<AttendanceRecord>
 */
export async function updateAttendance(
  attendanceId: string,
  payload: UpdateAttendancePayload
): Promise<AttendanceRecord> {
  // TODO(F-004): 실제 API 호출
  // const response = await apiRequest<AttendanceRecord>(
  //   'PATCH',
  //   `/api/v1/attendance/${attendanceId}`,
  //   { body: payload }
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[updateAttendance] 목업 출결 수정:', attendanceId, payload);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = mockAttendanceRecords.find(
        (r) => r.attendanceId === attendanceId
      );
      if (existing) {
        const updated: AttendanceRecord = {
          ...existing,
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        resolve(updated);
      } else {
        reject(new Error('출결 기록을 찾을 수 없습니다.'));
      }
    }, 500);
  });
}

/**
 * 특정 수업(일정)의 출결 기록 조회
 *
 * TODO(F-004): 실제 API 연동
 * - GET /api/v1/schedules/{schedule_id}/attendance
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { attendances: AttendanceRecord[] } }
 *
 * @param scheduleId 일정 ID
 * @returns Promise<AttendanceRecord[]>
 */
export async function fetchLessonAttendance(
  scheduleId: string
): Promise<AttendanceRecord[]> {
  // TODO(F-004): 실제 API 호출
  // const response = await apiRequest<{ attendances: AttendanceRecord[] }>(
  //   'GET',
  //   `/api/v1/schedules/${scheduleId}/attendance`
  // );
  // return response.attendances;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchLessonAttendance] 목업 수업 출결 조회:', scheduleId);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getAttendanceForLesson(scheduleId));
    }, 300);
  });
}

/**
 * 그룹별 출결 요약 목록 조회 (특정 기간)
 *
 * TODO(F-004): 실제 API 연동
 * - GET /api/v1/groups/{group_id}/attendance/summaries?start_date=...&end_date=...
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { summaries: LessonAttendanceSummary[] } }
 *
 * @param groupId 그룹 ID
 * @param period 조회 기간
 * @returns Promise<LessonAttendanceSummary[]>
 */
export async function fetchGroupAttendanceSummaries(
  groupId: string,
  period: { startDate: string; endDate: string }
): Promise<LessonAttendanceSummary[]> {
  // TODO(F-004): 실제 API 호출
  // const response = await apiRequest<{ summaries: LessonAttendanceSummary[] }>(
  //   'GET',
  //   `/api/v1/groups/${groupId}/attendance/summaries`,
  //   { params: { start_date: period.startDate, end_date: period.endDate } }
  // );
  // return response.summaries;

  // 목업 데이터 반환 (개발 중)
  console.log(
    '[fetchGroupAttendanceSummaries] 목업 그룹 출결 요약 조회:',
    groupId,
    period
  );
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getGroupAttendanceSummaries(groupId, period));
    }, 300);
  });
}

/**
 * 학생별 출결 통계 조회
 *
 * TODO(F-004): 실제 API 연동
 * - GET /api/v1/groups/{group_id}/attendance/stats?student_id=...&start_date=...&end_date=...
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: StudentAttendanceStats }
 *
 * @param params 조회 파라미터
 * @returns Promise<StudentAttendanceStats>
 */
export async function fetchStudentAttendanceStats(
  params: AttendanceStatsParams
): Promise<StudentAttendanceStats> {
  // TODO(F-004): 실제 API 호출
  // const response = await apiRequest<StudentAttendanceStats>(
  //   'GET',
  //   `/api/v1/groups/${params.groupId}/attendance/stats`,
  //   { params: { student_id: params.studentId, start_date: params.startDate, end_date: params.endDate } }
  // );
  // return response;

  // 목업 데이터 반환 (개발 중)
  console.log('[fetchStudentAttendanceStats] 목업 학생 출결 통계 조회:', params);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        getStudentAttendanceStats(
          params.studentId || 'student-1',
          params.groupId,
          { startDate: params.startDate, endDate: params.endDate }
        )
      );
    }, 300);
  });
}

/**
 * 학생별 출결 히스토리 조회
 *
 * TODO(F-004): 실제 API 연동
 * - GET /api/v1/students/{student_id}/attendance/history?start_date=...&end_date=...
 * - Authorization: Bearer <access_token>
 * - 응답: { success: true, data: { items: AttendanceHistoryItem[] } }
 *
 * @param studentId 학생 ID
 * @param period 조회 기간 (선택)
 * @returns Promise<AttendanceHistoryItem[]>
 */
export async function fetchStudentAttendanceHistory(
  studentId: string,
  period?: { startDate?: string; endDate?: string }
): Promise<AttendanceHistoryItem[]> {
  // TODO(F-004): 실제 API 호출
  // const response = await apiRequest<{ items: AttendanceHistoryItem[] }>(
  //   'GET',
  //   `/api/v1/students/${studentId}/attendance/history`,
  //   { params: period }
  // );
  // return response.items;

  // 목업 데이터 반환 (개발 중)
  console.log(
    '[fetchStudentAttendanceHistory] 목업 학생 출결 히스토리 조회:',
    studentId,
    period
  );
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStudentAttendanceHistory(studentId, period));
    }, 300);
  });
}
