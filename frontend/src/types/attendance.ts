// Step 7: 출결 관리 타입 기본 정의
// TODO: 현재는 mock 데이터 및 UI 레벨에서만 사용, 추후 API 타입으로 확장 예정

/**
 * 출결 상태 타입
 * - present: 출석
 * - late: 지각
 * - absent: 결석
 * - makeup: 보강
 * - excused: 공결
 */
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'makeup' | 'excused';

/**
 * 출결 요약 집계 데이터
 */
export interface AttendanceSummaryCounts {
  totalStudents: number;
  present: number;
  late: number;
  absent: number;
  makeup: number;
  excused: number;
}

/**
 * 출결 변경 이력 아이템
 */
export interface AttendanceChangeLogItem {
  id: string;
  date: string;        // 'YYYY-MM-DD'
  studentName: string;
  groupName: string;
  previousStatus: AttendanceStatus;
  currentStatus: AttendanceStatus;
  reason?: string;
}
