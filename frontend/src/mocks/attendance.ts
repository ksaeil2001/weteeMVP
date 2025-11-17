/**
 * Mock Attendance Data - WeTee MVP
 * Feature: F-004 출결 관리
 *
 * 역할:
 * - 개발/테스트 단계에서 사용할 출결 목업 데이터 제공
 * - 실제 API 연동 전까지 UI 플로우 검증용
 *
 * TODO:
 * - 실제 API 연동 시 이 파일은 삭제하고 API 레이어로 교체
 */

import type {
  AttendanceRecord,
  AttendanceStatus,
  LessonAttendanceSummary,
  StudentAttendanceStats,
  AttendanceHistoryItem,
} from '@/types/attendance';

/**
 * 목업 출결 기록 목록
 * - 여러 그룹/수업/학생의 출결 데이터
 */
export const mockAttendanceRecords: AttendanceRecord[] = [
  // Group 1 (이학생 수학) - 최근 수업들
  {
    attendanceId: 'att-1',
    scheduleId: 'schedule-1',
    studentId: 'student-1',
    studentName: '이학생',
    status: 'PRESENT',
    notes: '수업 집중도 우수',
    recordedBy: 'teacher-1',
    recordedAt: '2025-11-12T17:00:00Z',
  },
  {
    attendanceId: 'att-2',
    scheduleId: 'schedule-2',
    studentId: 'student-1',
    studentName: '이학생',
    status: 'LATE',
    notes: '학교 일정으로 10분 지각',
    lateMinutes: 10,
    recordedBy: 'teacher-1',
    recordedAt: '2025-11-08T17:00:00Z',
  },
  {
    attendanceId: 'att-3',
    scheduleId: 'schedule-3',
    studentId: 'student-1',
    studentName: '이학생',
    status: 'PRESENT',
    recordedBy: 'teacher-1',
    recordedAt: '2025-11-05T17:00:00Z',
  },
  {
    attendanceId: 'att-4',
    scheduleId: 'schedule-4',
    studentId: 'student-1',
    studentName: '이학생',
    status: 'ABSENT',
    notes: '감기로 결석',
    recordedBy: 'teacher-1',
    recordedAt: '2025-11-01T17:00:00Z',
  },

  // Group 2 (최학생 영어)
  {
    attendanceId: 'att-5',
    scheduleId: 'schedule-5',
    studentId: 'student-2',
    studentName: '최학생',
    status: 'PRESENT',
    recordedBy: 'teacher-1',
    recordedAt: '2025-11-13T21:00:00Z',
  },
  {
    attendanceId: 'att-6',
    scheduleId: 'schedule-6',
    studentId: 'student-2',
    studentName: '최학생',
    status: 'PRESENT',
    recordedBy: 'teacher-1',
    recordedAt: '2025-11-11T21:00:00Z',
  },
  {
    attendanceId: 'att-7',
    scheduleId: 'schedule-7',
    studentId: 'student-2',
    studentName: '최학생',
    status: 'LATE',
    notes: '동아리 활동으로 15분 지각',
    lateMinutes: 15,
    recordedBy: 'teacher-1',
    recordedAt: '2025-11-06T21:00:00Z',
  },
  {
    attendanceId: 'att-8',
    scheduleId: 'schedule-8',
    studentId: 'student-2',
    studentName: '최학생',
    status: 'PRESENT',
    recordedBy: 'teacher-1',
    recordedAt: '2025-11-04T21:00:00Z',
  },

  // 추가 예시 데이터 (최근 한 달)
  {
    attendanceId: 'att-9',
    scheduleId: 'schedule-9',
    studentId: 'student-1',
    studentName: '이학생',
    status: 'PRESENT',
    recordedBy: 'teacher-1',
    recordedAt: '2025-10-29T17:00:00Z',
  },
  {
    attendanceId: 'att-10',
    scheduleId: 'schedule-10',
    studentId: 'student-1',
    studentName: '이학생',
    status: 'PRESENT',
    recordedBy: 'teacher-1',
    recordedAt: '2025-10-25T17:00:00Z',
  },
  {
    attendanceId: 'att-11',
    scheduleId: 'schedule-11',
    studentId: 'student-2',
    studentName: '최학생',
    status: 'PRESENT',
    recordedBy: 'teacher-1',
    recordedAt: '2025-10-28T21:00:00Z',
  },
  {
    attendanceId: 'att-12',
    scheduleId: 'schedule-12',
    studentId: 'student-2',
    studentName: '최학생',
    status: 'ABSENT',
    notes: '가족 행사로 결석',
    recordedBy: 'teacher-1',
    recordedAt: '2025-10-21T21:00:00Z',
  },
];

/**
 * 특정 수업(일정)의 출결 기록 조회
 */
export function getAttendanceForLesson(scheduleId: string): AttendanceRecord[] {
  return mockAttendanceRecords.filter(
    (record) => record.scheduleId === scheduleId
  );
}

/**
 * 특정 학생의 출결 기록 조회
 */
export function getAttendanceForStudent(
  studentId: string,
  options?: { startDate?: string; endDate?: string }
): AttendanceRecord[] {
  let records = mockAttendanceRecords.filter(
    (record) => record.studentId === studentId
  );

  if (options?.startDate) {
    records = records.filter(
      (record) => record.recordedAt >= options.startDate!
    );
  }

  if (options?.endDate) {
    records = records.filter((record) => record.recordedAt <= options.endDate!);
  }

  return records.sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
}

/**
 * 수업별 출결 요약 생성
 */
export function getLessonAttendanceSummary(
  scheduleId: string
): LessonAttendanceSummary | null {
  const records = getAttendanceForLesson(scheduleId);

  if (records.length === 0) {
    return null;
  }

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const totalStudents = records.length;
  const attendanceRate =
    totalStudents > 0
      ? Math.round(((presentCount + lateCount) / totalStudents) * 100)
      : 0;

  // 임시로 날짜/시간 생성 (실제로는 schedule 데이터에서 가져와야 함)
  const firstRecord = records[0];
  const recordDate = new Date(firstRecord.recordedAt);

  return {
    scheduleId,
    groupId: 'group-1', // 임시
    groupName: '이학생 수학 과외', // 임시
    date: recordDate.toISOString().split('T')[0],
    startTime: '15:00',
    endTime: '16:30',
    presentCount,
    lateCount,
    absentCount,
    totalStudents,
    attendanceRate,
  };
}

/**
 * 학생별 출결 통계 생성
 */
export function getStudentAttendanceStats(
  studentId: string,
  groupId?: string,
  period?: { startDate: string; endDate: string }
): StudentAttendanceStats {
  const defaultPeriod = period || {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  };

  const records = getAttendanceForStudent(studentId, {
    startDate: defaultPeriod.startDate,
    endDate: defaultPeriod.endDate,
  });

  const present = records.filter((r) => r.status === 'PRESENT').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;
  const totalSessions = records.length;
  const attendanceRate =
    totalSessions > 0
      ? Math.round(((present + late) / totalSessions) * 100 * 10) / 10
      : 0;

  return {
    studentId,
    studentName:
      records.length > 0 ? records[0].studentName : `학생 ${studentId}`,
    groupId,
    groupName: groupId ? `그룹 ${groupId}` : undefined,
    period: defaultPeriod,
    stats: {
      totalSessions,
      present,
      late,
      absent,
      attendanceRate,
    },
  };
}

/**
 * 학생별 출결 히스토리 생성 (UI 표시용)
 */
export function getStudentAttendanceHistory(
  studentId: string,
  options?: { startDate?: string; endDate?: string }
): AttendanceHistoryItem[] {
  const records = getAttendanceForStudent(studentId, options);

  return records.map((record) => {
    const recordDate = new Date(record.recordedAt);

    return {
      attendanceId: record.attendanceId,
      scheduleId: record.scheduleId,
      date: recordDate.toISOString().split('T')[0],
      startTime: '15:00', // 임시 (실제로는 schedule 데이터에서)
      endTime: '16:30', // 임시
      groupName: '수학 과외', // 임시
      subject: '수학', // 임시
      status: record.status,
      notes: record.notes,
      lateMinutes: record.lateMinutes,
      recordedAt: record.recordedAt,
    };
  });
}

/**
 * 그룹별 전체 출결 요약 목록 (기간 내)
 */
export function getGroupAttendanceSummaries(
  groupId: string,
  period: { startDate: string; endDate: string }
): LessonAttendanceSummary[] {
  // 실제로는 해당 그룹의 모든 일정을 조회하고, 각각의 출결 요약을 생성
  // 목업에서는 간단히 처리
  const summaries: LessonAttendanceSummary[] = [
    {
      scheduleId: 'schedule-1',
      groupId,
      groupName: '이학생 수학 과외',
      date: '2025-11-12',
      startTime: '15:00',
      endTime: '16:30',
      presentCount: 1,
      lateCount: 0,
      absentCount: 0,
      totalStudents: 1,
      attendanceRate: 100,
    },
    {
      scheduleId: 'schedule-2',
      groupId,
      groupName: '이학생 수학 과외',
      date: '2025-11-08',
      startTime: '15:00',
      endTime: '16:30',
      presentCount: 0,
      lateCount: 1,
      absentCount: 0,
      totalStudents: 1,
      attendanceRate: 100,
    },
    {
      scheduleId: 'schedule-3',
      groupId,
      groupName: '이학생 수학 과외',
      date: '2025-11-05',
      startTime: '15:00',
      endTime: '16:30',
      presentCount: 1,
      lateCount: 0,
      absentCount: 0,
      totalStudents: 1,
      attendanceRate: 100,
    },
    {
      scheduleId: 'schedule-4',
      groupId,
      groupName: '이학생 수학 과외',
      date: '2025-11-01',
      startTime: '15:00',
      endTime: '16:30',
      presentCount: 0,
      lateCount: 0,
      absentCount: 1,
      totalStudents: 1,
      attendanceRate: 0,
    },
  ];

  // 기간 필터링
  return summaries.filter((summary) => {
    return summary.date >= period.startDate && summary.date <= period.endDate;
  });
}
