/**
 * Attendance Types - WeTee MVP
 * Feature: F-004 출결 관리
 *
 * Based on:
 * - F-004_출결_관리.md
 * - API_명세서.md (6.4 F-004)
 * - 데이터베이스_설계서.md (attendances 테이블)
 * - UX_UI_설계서.md (S-019~S-021)
 */

/**
 * 출결 상태 타입
 * - PRESENT: 출석
 * - LATE: 지각
 * - EARLY_LEAVE: 조퇴
 * - ABSENT: 결석
 */
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT';

/**
 * 출결 기록
 */
export interface AttendanceRecord {
  attendanceId: string;
  scheduleId: string;
  studentId: string;
  studentName?: string;
  status: AttendanceStatus;
  notes?: string; // 지각/결석 사유 등
  lateMinutes?: number; // 지각 시 몇 분 늦었는지
  recordedBy?: string; // 기록한 선생님 ID
  recordedAt: string; // ISO8601
  updatedAt?: string;
}

/**
 * 수업별 출결 요약 (특정 일정의 전체 학생 출결)
 */
export interface LessonAttendanceSummary {
  scheduleId: string;
  groupId: string;
  groupName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalStudents: number;
  attendanceRate: number; // 출석률 (%)
}

/**
 * 학생별 출결 통계
 */
export interface StudentAttendanceStats {
  studentId: string;
  studentName?: string;
  groupId?: string;
  groupName?: string;
  period: {
    startDate: string;
    endDate: string;
  };
  stats: {
    totalSessions: number; // 전체 수업 수
    present: number;
    late: number;
    absent: number;
    attendanceRate: number; // 출석률 (%)
  };
}

/**
 * 출결 체크 요청 (한 수업의 전체 학생)
 */
export interface CheckAttendancePayload {
  scheduleId: string;
  attendances: {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
    lateMinutes?: number;
  }[];
  checkedAt?: string; // ISO8601, 기본값은 현재 시각
}

/**
 * 출결 수정 요청
 */
export interface UpdateAttendancePayload {
  status?: AttendanceStatus;
  notes?: string;
  lateMinutes?: number;
}

/**
 * 출결 통계 조회 파라미터
 */
export interface AttendanceStatsParams {
  groupId: string;
  studentId?: string; // 특정 학생, 없으면 그룹 전체
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * 출결 히스토리 항목 (학생별 출결 내역)
 */
export interface AttendanceHistoryItem {
  attendanceId: string;
  scheduleId: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  groupName: string;
  subject: string;
  status: AttendanceStatus;
  notes?: string;
  lateMinutes?: number;
  recordedAt: string;
}

/**
 * 출결 상태 색상 맵핑 (UI 표시용)
 */
export const ATTENDANCE_STATUS_COLORS: Record<
  AttendanceStatus,
  { bg: string; text: string; label: string }
> = {
  PRESENT: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: '출석',
  },
  LATE: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: '지각',
  },
  EARLY_LEAVE: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    label: '조퇴',
  },
  ABSENT: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    label: '결석',
  },
};

/**
 * 출결 상태 아이콘 맵핑 (UI 표시용)
 */
export const ATTENDANCE_STATUS_ICONS: Record<AttendanceStatus, string> = {
  PRESENT: '✓',
  LATE: '⏰',
  EARLY_LEAVE: '🚪',
  ABSENT: '✗',
};

/**
 * 출결 요약 카운트 (UI 표시용)
 * TODO(F-004): 실제 구현에서 사용
 */
export interface AttendanceSummaryCounts {
  totalStudents: number;
  present: number;
  late: number;
  absent: number;
  makeup?: number;
  excused?: number;
}

/**
 * 출결 변경 로그 항목 (UI 표시용)
 * TODO(F-004): 실제 구현에서 사용
 */
export interface AttendanceChangeLogItem {
  changeId: string;
  attendanceId: string;
  changedAt: string;
  changedBy: string;
  previousStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason?: string;
}
