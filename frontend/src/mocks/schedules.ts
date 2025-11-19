/**
 * Mock Schedules Data - WeTee MVP
 * Feature: F-003 수업 일정 관리
 *
 * 역할:
 * - 개발/테스트 단계에서 사용할 목업 데이터 제공
 * - 실제 API 연동 전까지 UI 플로우 검증용
 *
 * TODO:
 * - 실제 API 연동 시 이 파일은 삭제하고 API 레이어로 교체
 */

import type {
  Schedule,
  // ScheduleType,
  // ScheduleStatus,
  MakeupSlot,
  ExamSchedule,
} from '@/types/schedule';

/**
 * 현재 날짜 기준으로 목업 날짜 생성 헬퍼
 */
function getDateOffset(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

function getDateOnlyOffset(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

/**
 * 목업 수업 일정 목록
 */
export const mockSchedules: Schedule[] = [
  // 오늘 일정 (2개)
  {
    scheduleId: 'schedule-1',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    title: '수학 수업',
    type: 'REGULAR',
    startAt: getDateOffset(0).split('T')[0] + 'T06:00:00Z', // 오늘 15:00 (UTC+9 기준)
    endAt: getDateOffset(0).split('T')[0] + 'T08:00:00Z', // 오늘 17:00
    status: 'SCHEDULED',
    location: '학생 집',
    memo: '이차함수 진도',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    studentIds: ['student-1'],
    studentNames: ['이학생'],
    createdAt: getDateOffset(-10),
  },
  {
    scheduleId: 'schedule-2',
    groupId: 'group-2',
    groupName: '최학생 영어 과외',
    title: '영어 수업',
    type: 'REGULAR',
    startAt: getDateOffset(0).split('T')[0] + 'T10:00:00Z', // 오늘 19:00
    endAt: getDateOffset(0).split('T')[0] + 'T12:00:00Z', // 오늘 21:00
    status: 'SCHEDULED',
    location: '온라인',
    memo: '문법 집중 수업',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    studentIds: ['student-2'],
    studentNames: ['최학생'],
    createdAt: getDateOffset(-15),
  },

  // 내일 일정
  {
    scheduleId: 'schedule-3',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    title: '수학 수업',
    type: 'REGULAR',
    startAt: getDateOffset(1).split('T')[0] + 'T06:00:00Z',
    endAt: getDateOffset(1).split('T')[0] + 'T08:00:00Z',
    status: 'SCHEDULED',
    location: '학생 집',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    studentIds: ['student-1'],
    studentNames: ['이학생'],
    createdAt: getDateOffset(-10),
  },

  // 모레 일정
  {
    scheduleId: 'schedule-4',
    groupId: 'group-2',
    groupName: '최학생 영어 과외',
    title: '영어 수업',
    type: 'REGULAR',
    startAt: getDateOffset(2).split('T')[0] + 'T10:00:00Z',
    endAt: getDateOffset(2).split('T')[0] + 'T12:00:00Z',
    status: 'SCHEDULED',
    location: '온라인',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    studentIds: ['student-2'],
    studentNames: ['최학생'],
    createdAt: getDateOffset(-15),
  },

  // 이번 주 토요일 - 보강 수업
  {
    scheduleId: 'schedule-5',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    title: '수학 보강 수업',
    type: 'MAKEUP',
    startAt: getDateOffset(4).split('T')[0] + 'T01:00:00Z', // 토요일 10:00
    endAt: getDateOffset(4).split('T')[0] + 'T03:00:00Z', // 토요일 12:00
    status: 'SCHEDULED',
    location: '학생 집',
    memo: '지난주 결석 보강',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    studentIds: ['student-1'],
    studentNames: ['이학생'],
    originalScheduleId: 'schedule-past-1',
    createdAt: getDateOffset(-2),
  },

  // 다음 주 월요일
  {
    scheduleId: 'schedule-6',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    title: '수학 수업',
    type: 'REGULAR',
    startAt: getDateOffset(7).split('T')[0] + 'T06:00:00Z',
    endAt: getDateOffset(7).split('T')[0] + 'T08:00:00Z',
    status: 'SCHEDULED',
    location: '학생 집',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    studentIds: ['student-1'],
    studentNames: ['이학생'],
    createdAt: getDateOffset(-10),
  },

  // 지난주 일정 (완료)
  {
    scheduleId: 'schedule-past-1',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    title: '수학 수업',
    type: 'REGULAR',
    startAt: getDateOffset(-7).split('T')[0] + 'T06:00:00Z',
    endAt: getDateOffset(-7).split('T')[0] + 'T08:00:00Z',
    status: 'DONE',
    location: '학생 집',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    studentIds: ['student-1'],
    studentNames: ['이학생'],
    createdAt: getDateOffset(-17),
  },

  // 지난주 일정 (취소됨)
  {
    scheduleId: 'schedule-past-2',
    groupId: 'group-2',
    groupName: '최학생 영어 과외',
    title: '영어 수업',
    type: 'REGULAR',
    startAt: getDateOffset(-5).split('T')[0] + 'T10:00:00Z',
    endAt: getDateOffset(-5).split('T')[0] + 'T12:00:00Z',
    status: 'CANCELED',
    location: '온라인',
    cancelReason: '학생 감기로 결석',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    studentIds: ['student-2'],
    studentNames: ['최학생'],
    createdAt: getDateOffset(-15),
  },
];

/**
 * 목업 보강 가능 시간 슬롯
 */
export const mockMakeupSlots: MakeupSlot[] = [
  {
    slotId: 'slot-1',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    date: getDateOnlyOffset(5), // 이번 주 일요일
    startTime: '10:00',
    endTime: '12:00',
    location: '학생 집',
    isBooked: false,
    createdAt: getDateOffset(-1),
  },
  {
    slotId: 'slot-2',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    date: getDateOnlyOffset(5),
    startTime: '14:00',
    endTime: '16:00',
    location: '카페',
    isBooked: true,
    bookedBy: {
      userId: 'student-2',
      name: '최학생',
    },
    createdAt: getDateOffset(-1),
  },
  {
    slotId: 'slot-3',
    teacherId: 'teacher-1',
    teacherName: '김선생',
    date: getDateOnlyOffset(6), // 다음 주 월요일
    startTime: '17:00',
    endTime: '19:00',
    isBooked: false,
    createdAt: getDateOffset(-1),
  },
];

/**
 * 목업 시험 일정
 */
export const mockExamSchedules: ExamSchedule[] = [
  {
    examId: 'exam-1',
    groupId: 'group-1',
    studentId: 'student-1',
    studentName: '이학생',
    examName: '기말고사',
    school: '서울중학교',
    startDate: getDateOnlyOffset(14), // 2주 후
    endDate: getDateOnlyOffset(18), // 2주 후 + 4일
    subjects: ['수학', '영어', '과학'],
    memo: '이차함수, 확률 집중 대비',
    createdAt: getDateOffset(-5),
  },
  {
    examId: 'exam-2',
    groupId: 'group-2',
    studentId: 'student-2',
    studentName: '최학생',
    examName: '모의고사',
    school: '강남고등학교',
    startDate: getDateOnlyOffset(7), // 1주 후
    endDate: getDateOnlyOffset(7),
    subjects: ['영어'],
    createdAt: getDateOffset(-3),
  },
];

/**
 * 그룹 ID로 일정 필터링
 */
export function getMockSchedulesByGroup(groupId: string): Schedule[] {
  return mockSchedules.filter((schedule) => schedule.groupId === groupId);
}

/**
 * 일정 ID로 일정 찾기
 */
export function getMockScheduleById(scheduleId: string): Schedule | undefined {
  return mockSchedules.find((schedule) => schedule.scheduleId === scheduleId);
}

/**
 * 날짜 범위로 일정 필터링
 */
export function getMockSchedulesByDateRange(
  from: string,
  to: string,
  groupId?: string
): Schedule[] {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  return mockSchedules.filter((schedule) => {
    const scheduleDate = new Date(schedule.startAt);
    const inRange = scheduleDate >= fromDate && scheduleDate <= toDate;
    const matchesGroup = groupId ? schedule.groupId === groupId : true;
    return inRange && matchesGroup;
  });
}

/**
 * 보강 가능 시간 슬롯 조회
 */
export function getMockMakeupSlots(groupId?: string): MakeupSlot[] {
  if (groupId) {
    return mockMakeupSlots.filter(
      (slot) => !slot.groupId || slot.groupId === groupId
    );
  }
  return mockMakeupSlots;
}

/**
 * 시험 일정 조회 (그룹 또는 학생 기준)
 */
export function getMockExamSchedules(
  groupId?: string,
  studentId?: string
): ExamSchedule[] {
  return mockExamSchedules.filter((exam) => {
    const matchesGroup = groupId ? exam.groupId === groupId : true;
    const matchesStudent = studentId ? exam.studentId === studentId : true;
    return matchesGroup && matchesStudent;
  });
}
