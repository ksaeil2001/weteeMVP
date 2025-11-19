/**
 * Attendance API - WeTee MVP
 * Feature: F-004 출결 관리
 *
 * Based on:
 * - API_명세서.md (6.4 F-004: 출결 관리)
 * - backend/app/routers/attendances.py
 * - backend/app/schemas/attendance.py
 * - F-004_attendance_completion_2025-11-18.md
 *
 * 역할:
 * - 출결 관련 API 엔드포인트와 실제 백엔드 연동
 * - 백엔드 응답(snake_case)을 프론트엔드 타입(camelCase)으로 변환
 * - apiClient.ts의 apiRequest를 사용하여 인증 및 에러 처리
 */

import type {
  AttendanceRecord,
  CheckAttendancePayload,
  UpdateAttendancePayload,
  StudentAttendanceStats,
  AttendanceStatsParams,
  LessonAttendanceSummary,
  AttendanceHistoryItem,
  AttendanceStatus,
} from '@/types/attendance';

import { apiRequest } from '@/lib/apiClient';

// ==========================
// Backend Response Types (snake_case)
// ==========================

interface BackendStudentInfo {
  user_id: string;
  name: string;
}

interface BackendAttendanceOut {
  attendance_id: string;
  schedule_id: string;
  student_id: string;
  student?: BackendStudentInfo;
  status: 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT';
  late_minutes?: number | null;
  notes?: string | null;
  recorded_at: string; // ISO8601
  updated_at?: string | null;
}

interface BackendBatchAttendanceResponse {
  schedule_id: string;
  attendances: BackendAttendanceOut[];
}

interface BackendAttendanceListResponse {
  items: BackendAttendanceOut[];
  total: number;
}

interface BackendAttendanceStats {
  total_sessions: number;
  present: number;
  late: number;
  early_leave: number;
  absent: number;
  attendance_rate: number; // percentage
}

interface BackendRecentAttendanceRecord {
  schedule_id: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT';
  notes?: string | null;
}

interface BackendAttendanceStatsResponse {
  student?: BackendStudentInfo;
  period: {
    start_date: string;
    end_date: string;
  };
  stats: BackendAttendanceStats;
  recent_records: BackendRecentAttendanceRecord[];
}

// ==========================
// Request Payload Types (snake_case for backend)
// ==========================

interface BackendBatchAttendanceItemPayload {
  student_id: string;
  status: 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT';
  late_minutes?: number;
  notes?: string;
}

interface BackendBatchCreateAttendancePayload {
  attendances: BackendBatchAttendanceItemPayload[];
  checked_at?: string;
}

interface BackendUpdateAttendancePayload {
  status?: 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT';
  late_minutes?: number;
  notes?: string;
}

// ==========================
// Response Converters (Backend → Frontend)
// ==========================

/**
 * 백엔드 출결 응답을 프론트엔드 AttendanceRecord 타입으로 변환
 */
function convertBackendAttendanceToFrontend(
  backendAttendance: BackendAttendanceOut
): AttendanceRecord {
  return {
    attendanceId: backendAttendance.attendance_id,
    scheduleId: backendAttendance.schedule_id,
    studentId: backendAttendance.student_id,
    studentName: backendAttendance.student?.name,
    status: backendAttendance.status as AttendanceStatus,
    notes: backendAttendance.notes ?? undefined,
    lateMinutes: backendAttendance.late_minutes ?? undefined,
    recordedBy: undefined, // TODO(v2): 백엔드에서 recorded_by 필드 추가
    recordedAt: backendAttendance.recorded_at,
    updatedAt: backendAttendance.updated_at ?? undefined,
  };
}

/**
 * 백엔드 출결 통계 응답을 프론트엔드 StudentAttendanceStats 타입으로 변환
 */
function convertBackendStatsToFrontend(
  backendStats: BackendAttendanceStatsResponse
): StudentAttendanceStats {
  return {
    studentId: backendStats.student?.user_id ?? '',
    studentName: backendStats.student?.name,
    groupId: undefined, // TODO(v2): 백엔드에서 group_id 포함
    groupName: undefined,
    period: {
      startDate: backendStats.period.start_date,
      endDate: backendStats.period.end_date,
    },
    stats: {
      totalSessions: backendStats.stats.total_sessions,
      present: backendStats.stats.present,
      late: backendStats.stats.late,
      absent: backendStats.stats.absent,
      attendanceRate: backendStats.stats.attendance_rate,
    },
  };
}

// ==========================
// Request Converters (Frontend → Backend)
// ==========================

/**
 * 프론트엔드 출결 체크 페이로드를 백엔드 형식으로 변환
 */
function convertCheckAttendancePayloadToBackend(
  payload: CheckAttendancePayload
): BackendBatchCreateAttendancePayload {
  return {
    attendances: payload.attendances.map((att) => ({
      student_id: att.studentId,
      status: att.status as 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT',
      late_minutes: att.lateMinutes,
      notes: att.notes,
    })),
    checked_at: payload.checkedAt,
  };
}

/**
 * 프론트엔드 출결 수정 페이로드를 백엔드 형식으로 변환
 */
function convertUpdateAttendancePayloadToBackend(
  payload: UpdateAttendancePayload
): BackendUpdateAttendancePayload {
  return {
    status: payload.status as
      | 'PRESENT'
      | 'LATE'
      | 'EARLY_LEAVE'
      | 'ABSENT'
      | undefined,
    late_minutes: payload.lateMinutes,
    notes: payload.notes,
  };
}

// ==========================
// API Functions
// ==========================

/**
 * 출결 체크 (선생님만 가능)
 *
 * POST /api/v1/attendances/schedules/{schedule_id}/batch
 *
 * @param payload 출결 체크 정보
 * @returns Promise<AttendanceRecord[]>
 */
export async function checkAttendance(
  payload: CheckAttendancePayload
): Promise<AttendanceRecord[]> {
  const backendPayload = convertCheckAttendancePayloadToBackend(payload);

  const response = await apiRequest<BackendBatchAttendanceResponse>(
    `/attendances/schedules/${payload.scheduleId}/batch`,
    {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    }
  );

  return response.attendances.map(convertBackendAttendanceToFrontend);
}

/**
 * 출결 수정 (선생님만 가능)
 *
 * PATCH /api/v1/attendances/{attendance_id}
 *
 * @param attendanceId 출결 ID
 * @param payload 수정할 출결 정보
 * @returns Promise<AttendanceRecord>
 */
export async function updateAttendance(
  attendanceId: string,
  payload: UpdateAttendancePayload
): Promise<AttendanceRecord> {
  const backendPayload = convertUpdateAttendancePayloadToBackend(payload);

  const response = await apiRequest<BackendAttendanceOut>(
    `/attendances/${attendanceId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(backendPayload),
    }
  );

  return convertBackendAttendanceToFrontend(response);
}

/**
 * 특정 수업(일정)의 출결 기록 조회
 *
 * GET /api/v1/attendances/schedules/{schedule_id}
 *
 * @param scheduleId 일정 ID
 * @returns Promise<AttendanceRecord[]>
 */
export async function fetchLessonAttendance(
  scheduleId: string
): Promise<AttendanceRecord[]> {
  const response = await apiRequest<BackendAttendanceListResponse>(
    `/attendances/schedules/${scheduleId}`,
    {
      method: 'GET',
    }
  );

  return response.items.map(convertBackendAttendanceToFrontend);
}

/**
 * 그룹별 출결 요약 목록 조회 (특정 기간)
 *
 * TODO(v2): 백엔드에 해당 엔드포인트 추가 필요
 * 현재는 일정별 출결을 모아서 요약하는 방식으로 대체
 *
 * @param groupId 그룹 ID
 * @param period 조회 기간
 * @returns Promise<LessonAttendanceSummary[]>
 */
export async function fetchGroupAttendanceSummaries(
  _groupId: string,
  _period: { startDate: string; endDate: string }
): Promise<LessonAttendanceSummary[]> {
  // TODO(v2): 백엔드 API 구현 후 연동
  // GET /api/v1/groups/{group_id}/attendances/summaries?start_date=...&end_date=...
  console.warn(
    '[fetchGroupAttendanceSummaries] 백엔드 API 미구현, 빈 배열 반환'
  );
  return [];
}

/**
 * 학생별 출결 통계 조회
 *
 * GET /api/v1/attendances/groups/{group_id}/stats?student_id=...&start_date=...&end_date=...
 *
 * @param params 조회 파라미터
 * @returns Promise<StudentAttendanceStats>
 */
export async function fetchStudentAttendanceStats(
  params: AttendanceStatsParams
): Promise<StudentAttendanceStats> {
  const queryParams = new URLSearchParams();
  if (params.studentId) queryParams.append('student_id', params.studentId);
  if (params.startDate) queryParams.append('start_date', params.startDate);
  if (params.endDate) queryParams.append('end_date', params.endDate);

  const response = await apiRequest<BackendAttendanceStatsResponse>(
    `/attendances/groups/${params.groupId}/stats?${queryParams.toString()}`,
    {
      method: 'GET',
    }
  );

  return convertBackendStatsToFrontend(response);
}

/**
 * 학생별 출결 히스토리 조회
 *
 * GET /api/v1/attendances/students/{student_id}?start_date=...&end_date=...
 *
 * @param studentId 학생 ID
 * @param period 조회 기간 (선택)
 * @returns Promise<AttendanceHistoryItem[]>
 */
export async function fetchStudentAttendanceHistory(
  studentId: string,
  period?: { startDate?: string; endDate?: string }
): Promise<AttendanceHistoryItem[]> {
  const queryParams = new URLSearchParams();
  if (period?.startDate) queryParams.append('start_date', period.startDate);
  if (period?.endDate) queryParams.append('end_date', period.endDate);

  const response = await apiRequest<BackendAttendanceListResponse>(
    `/attendances/students/${studentId}?${queryParams.toString()}`,
    {
      method: 'GET',
    }
  );

  // 백엔드는 AttendanceOut 배열을 반환하므로, 프론트엔드 AttendanceHistoryItem으로 변환
  // TODO(v2): 백엔드에서 schedule 정보(date, time, group, subject)를 포함하도록 개선
  return response.items.map((item) => ({
    attendanceId: item.attendance_id,
    scheduleId: item.schedule_id,
    date: item.recorded_at.split('T')[0], // ISO8601 → YYYY-MM-DD
    startTime: '00:00', // TODO(v2): 백엔드에서 schedule 조인 필요
    endTime: '00:00',
    groupName: '그룹명 미제공',
    subject: '과목 미제공',
    status: item.status as AttendanceStatus,
    notes: item.notes ?? undefined,
    lateMinutes: item.late_minutes ?? undefined,
    recordedAt: item.recorded_at,
  }));
}
