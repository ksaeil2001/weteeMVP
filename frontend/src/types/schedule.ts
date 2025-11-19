/**
 * Schedule Types - WeTee MVP
 * Feature: F-003 수업 일정 관리
 *
 * Based on:
 * - F-003_수업_일정_관리.md
 * - API_명세서.md (6.3 F-003)
 * - 데이터베이스_설계서.md (schedules 테이블)
 * - UX_UI_설계서.md (S-012~S-018)
 */

/**
 * 수업 일정 타입
 */
export type ScheduleType =
  | 'REGULAR'    // 정규 수업
  | 'MAKEUP'     // 보강 수업
  | 'EXAM'       // 시험 일정
  | 'HOLIDAY'    // 휴강
  | 'OTHER';     // 기타

/**
 * 일정 상태
 */
export type ScheduleStatus =
  | 'SCHEDULED'  // 예정
  | 'CONFIRMED'  // 확정됨
  | 'DONE'       // 완료
  | 'CANCELED'   // 취소됨
  | 'RESCHEDULED'; // 일정 변경됨

/**
 * 반복 빈도
 */
export type RecurrenceFrequency =
  | 'daily'      // 매일
  | 'weekly'     // 매주
  | 'biweekly'   // 격주
  | 'monthly';   // 매월

/**
 * 종료 조건 타입
 */
export type RecurrenceEndType =
  | 'date'       // 종료일 지정
  | 'count'      // 횟수 지정
  | 'never';     // 무한 반복

/**
 * 반복 규칙
 */
export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number; // 1 = 매주, 2 = 격주 등
  daysOfWeek?: number[]; // 1(월) ~ 7(일)
  startDate: string; // YYYY-MM-DD
  endType: RecurrenceEndType;
  endDate?: string; // endType이 'date'일 때
  endCount?: number; // endType이 'count'일 때
}

/**
 * 수업 일정
 */
export interface Schedule {
  scheduleId: string;
  groupId: string;
  groupName?: string; // 표시용
  title: string; // 예: "수학 수업", "영어 보강"
  type: ScheduleType;
  startAt: string; // ISO8601 형식
  endAt: string; // ISO8601 형식
  status: ScheduleStatus;
  recurrenceRule?: RecurrenceRule; // 정규 수업인 경우
  location?: string; // 수업 장소
  memo?: string;
  createdAt: string;
  updatedAt?: string;

  // 관련 정보
  teacherId?: string;
  teacherName?: string;
  studentIds?: string[];
  studentNames?: string[];

  // 원래 일정 (보강/변경인 경우)
  originalScheduleId?: string;

  // 취소/변경 사유
  cancelReason?: string;
  rescheduleReason?: string;
}

/**
 * 정규 수업 등록 요청 (S-013)
 */
export interface CreateRegularSchedulePayload {
  groupId: string;
  studentIds?: string[]; // 그룹 내 특정 학생만 선택 가능
  title: string;
  startTime: string; // HH:mm 형식 (예: "15:00")
  duration: number; // 분 단위 (예: 120)
  location?: string;
  memo?: string;

  // 반복 규칙
  recurrence: {
    frequency: RecurrenceFrequency;
    interval: number;
    daysOfWeek: number[]; // 1(월) ~ 7(일)
    startDate: string; // YYYY-MM-DD
    endType: RecurrenceEndType;
    endDate?: string;
    endCount?: number;
  };
}

/**
 * 단일 일정 생성 요청 (보강, 기타)
 */
export interface CreateSchedulePayload {
  groupId: string;
  title: string;
  type: ScheduleType;
  startAt: string; // ISO8601
  endAt: string; // ISO8601
  location?: string;
  memo?: string;
  studentIds?: string[];

  // 보강인 경우 원래 일정 ID
  originalScheduleId?: string;
}

/**
 * 일정 수정 요청 (S-015)
 */
export interface UpdateSchedulePayload {
  title?: string;
  startAt?: string;
  endAt?: string;
  location?: string;
  memo?: string;
  status?: ScheduleStatus;

  // 변경 사유 (필수)
  rescheduleReason?: string;
  cancelReason?: string;
}

/**
 * 보강 가능 시간 오픈 요청 (S-016, 선생님)
 */
export interface CreateMakeupSlotPayload {
  groupId?: string; // 특정 그룹, 없으면 전체 그룹
  slots: {
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    location?: string;
  }[];
}

/**
 * 보강 가능 시간 슬롯
 */
export interface MakeupSlot {
  slotId: string;
  teacherId: string;
  teacherName?: string;
  groupId?: string;
  groupName?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  isBooked: boolean;
  bookedBy?: {
    userId: string;
    name: string;
  };
  createdAt: string;
}

/**
 * 보강 예약 요청 (S-017, 학생)
 */
export interface BookMakeupSlotPayload {
  slotId: string;
  originalScheduleId: string; // 원래 결석한 일정 ID
}

/**
 * 시험 일정 등록 요청 (S-018)
 */
export interface CreateExamSchedulePayload {
  groupId: string;
  studentId: string;
  examName: string; // 예: "기말고사"
  school?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  subjects?: string[]; // 예: ["수학", "영어", "과학"]
  memo?: string;
}

/**
 * 시험 일정
 */
export interface ExamSchedule {
  examId: string;
  groupId: string;
  studentId: string;
  studentName?: string;
  examName: string;
  school?: string;
  startDate: string;
  endDate: string;
  subjects?: string[];
  memo?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 일정 목록 조회 쿼리 파라미터
 */
export interface ScheduleListParams {
  groupId?: string;
  studentId?: string;
  type?: ScheduleType;
  status?: ScheduleStatus;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  page?: number;
  size?: number;
}

/**
 * 달력 뷰 타입 (S-012)
 */
export type CalendarViewType = 'month' | 'week' | 'day' | 'list';

/**
 * 달력 이벤트 (UI 표시용)
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: ScheduleType;
  status: ScheduleStatus;
  color: string; // 배경색
  textColor: string;
  metadata?: Schedule | ExamSchedule;
}
