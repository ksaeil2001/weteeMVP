/**
 * Mock Lessons Data - WeTee MVP
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * 역할:
 * - 개발/테스트 단계에서 사용할 목업 데이터 제공
 * - 실제 API 연동 전까지 UI 플로우 검증용
 *
 * TODO:
 * - 실제 API 연동 시 이 파일은 삭제하고 API 레이어로 교체
 */

import type {
  LessonRecord,
  Textbook,
  ProgressRecord,
  StudentEvaluation,
  GroupProgressSummary,
  StudentProgressSummary,
  ProgressReport,
  LessonRecordCardView,
} from '@/types/lesson';

/**
 * 목업 교재 목록
 */
export const mockTextbooks: Textbook[] = [
  {
    textbookId: 'textbook-1',
    groupId: 'group-1',
    name: '수학의 정석 상권',
    publisher: '홍성대',
    totalPages: 500,
    startPage: 1,
    currentPage: 150,
    progressPercentage: 30.0,
    isActive: true,
    createdAt: '2025-11-01T09:00:00Z',
    updatedAt: '2025-11-12T16:30:00Z',
  },
  {
    textbookId: 'textbook-2',
    groupId: 'group-1',
    name: '자이스토리 수학 II',
    publisher: '수경출판사',
    totalPages: 240,
    startPage: 1,
    currentPage: 67,
    progressPercentage: 27.9,
    isActive: true,
    createdAt: '2025-11-05T10:00:00Z',
    updatedAt: '2025-11-12T16:30:00Z',
  },
  {
    textbookId: 'textbook-3',
    groupId: 'group-2',
    name: '능률 영어 독해',
    publisher: '능률',
    totalPages: 320,
    startPage: 1,
    currentPage: 85,
    progressPercentage: 26.6,
    isActive: true,
    createdAt: '2025-11-05T10:30:00Z',
  },
];

/**
 * 목업 진도 기록
 */
export const mockProgressRecords: ProgressRecord[] = [
  {
    progressId: 'progress-1',
    lessonRecordId: 'lesson-1',
    textbook: {
      textbookId: 'textbook-2',
      name: '자이스토리 수학 II',
    },
    unit: '2-1 이차함수',
    pageStart: 53,
    pageEnd: 67,
    pagesCovered: 15,
    notes: '이차함수 완료',
    createdAt: '2025-11-12T16:30:00Z',
  },
  {
    progressId: 'progress-2',
    lessonRecordId: 'lesson-2',
    textbook: {
      textbookId: 'textbook-1',
      name: '수학의 정석 상권',
    },
    unit: '1-3 함수의 극한',
    pageStart: 120,
    pageEnd: 135,
    pagesCovered: 16,
    notes: '극한 개념 정리',
    createdAt: '2025-11-10T16:30:00Z',
  },
];

/**
 * 목업 학생별 평가
 */
export const mockStudentEvaluations: StudentEvaluation[] = [
  {
    studentId: 'student-1',
    studentName: '이학생',
    understanding: 4,
    concentration: 5,
    difficulty: 3,
    memo: '이해도가 높고 집중력이 좋습니다.',
  },
  {
    studentId: 'student-2',
    studentName: '최학생',
    understanding: 3,
    concentration: 3,
    difficulty: 4,
    memo: '조금 어려워하지만 열심히 따라옵니다.',
  },
];

/**
 * 목업 수업 기록 목록
 */
export const mockLessonRecords: LessonRecord[] = [
  {
    lessonRecordId: 'lesson-1',
    scheduleId: 'schedule-1',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    date: '2025-11-12',
    title: '이차방정식의 판별식 개념 및 문제 풀이',
    content:
      '이차방정식의 판별식(b²-4ac) 개념 이해.\n근의 개수 판별 연습.\n응용 문제 5개 풀이.\n\n학생이 판별식 개념을 빠르게 이해했습니다. 어려운 문제도 포기하지 않고 끝까지 풀려고 노력했습니다.',
    keyPoints: ['이차방정식', '판별식', 'b²-4ac', '근의 개수'],
    studentFeedback:
      '판별식 개념을 빠르게 이해했어요. 어려운 문제도 포기하지 않고 끝까지 풀려고 했습니다. 다음 시간에 활용 문제 더 풀어보면 좋을 것 같아요.',
    homework: '교과서 67~70페이지 문제 풀어오기. 틀린 문제는 다시 풀어보세요.',
    homeworkDueDate: '2025-11-15',
    progressRecords: [mockProgressRecords[0]],
    studentEvaluations: [mockStudentEvaluations[0]],
    createdBy: {
      userId: 'teacher-1',
      name: '김선생',
    },
    isShared: true,
    sharedAt: '2025-11-12T16:35:00Z',
    viewedBy: {
      parentViewedAt: '2025-11-12T18:20:00Z',
      studentViewedAt: '2025-11-12T17:10:00Z',
    },
    createdAt: '2025-11-12T16:30:00Z',
    updatedAt: '2025-11-12T16:35:00Z',
  },
  {
    lessonRecordId: 'lesson-2',
    scheduleId: 'schedule-2',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    date: '2025-11-10',
    title: '함수의 극한 개념 정리',
    content:
      '함수의 극한 개념 설명.\n좌극한과 우극한의 차이.\n극한값 계산 연습 문제 풀이.\n\n기본 개념은 잘 이해했으나, 계산 실수가 조금 있었습니다.',
    keyPoints: ['함수의 극한', '좌극한', '우극한'],
    studentFeedback: '개념은 이해했으나 계산 실수가 있었습니다. 다음 시간에 복습 필요.',
    homework: '문제집 120~135페이지 기본 문제 풀이',
    progressRecords: [mockProgressRecords[1]],
    studentEvaluations: [
      {
        studentId: 'student-1',
        studentName: '이학생',
        understanding: 4,
        concentration: 4,
        difficulty: 3,
      },
    ],
    createdBy: {
      userId: 'teacher-1',
      name: '김선생',
    },
    isShared: true,
    sharedAt: '2025-11-10T16:35:00Z',
    viewedBy: {
      parentViewedAt: '2025-11-10T19:30:00Z',
      studentViewedAt: '2025-11-10T18:00:00Z',
    },
    createdAt: '2025-11-10T16:30:00Z',
  },
  {
    lessonRecordId: 'lesson-3',
    scheduleId: 'schedule-3',
    groupId: 'group-1',
    groupName: '이학생 수학 과외',
    date: '2025-11-08',
    title: '삼각함수 기본 개념',
    content:
      '삼각함수의 정의 (sin, cos, tan).\n단위원을 이용한 삼각함수 값 계산.\n삼각함수의 그래프 그리기.\n\n처음 배우는 내용이라 조금 어려워했지만, 단위원 개념은 잘 이해했습니다.',
    keyPoints: ['삼각함수', 'sin', 'cos', 'tan', '단위원'],
    studentFeedback: '처음 배우는 내용이라 어려워했으나 단위원 개념은 잘 이해했습니다.',
    homework: '삼각함수 표 암기하기, 기본 문제 5개',
    homeworkDueDate: '2025-11-10',
    progressRecords: [
      {
        progressId: 'progress-3',
        lessonRecordId: 'lesson-3',
        textbook: {
          textbookId: 'textbook-1',
          name: '수학의 정석 상권',
        },
        unit: '2-1 삼각함수',
        pageStart: 100,
        pageEnd: 119,
        pagesCovered: 20,
        notes: '삼각함수 기본 개념',
      },
    ],
    studentEvaluations: [
      {
        studentId: 'student-1',
        studentName: '이학생',
        understanding: 3,
        concentration: 4,
        difficulty: 4,
        memo: '새로운 개념이라 조금 어려워했습니다.',
      },
    ],
    createdBy: {
      userId: 'teacher-1',
      name: '김선생',
    },
    isShared: true,
    sharedAt: '2025-11-08T16:35:00Z',
    viewedBy: {
      parentViewedAt: '2025-11-08T20:00:00Z',
      studentViewedAt: '2025-11-08T18:30:00Z',
    },
    createdAt: '2025-11-08T16:30:00Z',
  },
  {
    lessonRecordId: 'lesson-4',
    scheduleId: 'schedule-4',
    groupId: 'group-2',
    groupName: '최학생 영어 과외',
    date: '2025-11-11',
    title: '영어 독해 연습',
    content: '긴 지문 독해 연습.\n주요 구문 분석.\n어휘 암기 테스트.',
    keyPoints: ['독해', '구문 분석', '어휘'],
    studentFeedback: '독해 속도가 빨라졌습니다. 어휘력도 향상되고 있습니다.',
    homework: '단어 50개 암기, 지문 2개 해석',
    homeworkDueDate: '2025-11-13',
    progressRecords: [
      {
        progressId: 'progress-4',
        lessonRecordId: 'lesson-4',
        textbook: {
          textbookId: 'textbook-3',
          name: '능률 영어 독해',
        },
        unit: 'Unit 5',
        pageStart: 70,
        pageEnd: 84,
        pagesCovered: 15,
        notes: '독해 연습',
      },
    ],
    studentEvaluations: [mockStudentEvaluations[1]],
    createdBy: {
      userId: 'teacher-1',
      name: '김선생',
    },
    isShared: true,
    sharedAt: '2025-11-11T19:35:00Z',
    viewedBy: {
      parentViewedAt: '2025-11-11T21:00:00Z',
    },
    createdAt: '2025-11-11T19:30:00Z',
  },
];

/**
 * 그룹 ID로 수업 기록 목록 조회 (목업)
 */
export function getMockLessonRecordsByGroup(groupId: string): LessonRecord[] {
  return mockLessonRecords.filter((record) => record.groupId === groupId);
}

/**
 * 수업 기록 ID로 상세 조회 (목업)
 */
export function getMockLessonRecordById(
  lessonRecordId: string
): LessonRecord | null {
  return (
    mockLessonRecords.find(
      (record) => record.lessonRecordId === lessonRecordId
    ) || null
  );
}

/**
 * 그룹 ID로 교재 목록 조회 (목업)
 */
export function getMockTextbooksByGroup(groupId: string): Textbook[] {
  return mockTextbooks.filter((textbook) => textbook.groupId === groupId);
}

/**
 * 교재 ID로 상세 조회 (목업)
 */
export function getMockTextbookById(textbookId: string): Textbook | null {
  return (
    mockTextbooks.find((textbook) => textbook.textbookId === textbookId) ||
    null
  );
}

/**
 * 그룹 진도 요약 조회 (목업)
 * S-030: 그룹 진도 대시보드
 */
export function getMockGroupProgressSummary(
  groupId: string
): GroupProgressSummary | null {
  const groupLessons = getMockLessonRecordsByGroup(groupId);
  const groupTextbooks = getMockTextbooksByGroup(groupId);

  if (groupLessons.length === 0) {
    return null;
  }

  const firstLesson = groupLessons[0];

  return {
    groupId,
    groupName: firstLesson.groupName || '그룹',
    subject: '수학', // 목업 데이터
    textbooks: groupTextbooks.map((tb) => ({
      textbookId: tb.textbookId,
      name: tb.name,
      currentPage: tb.currentPage || 0,
      totalPages: tb.totalPages,
      progressPercentage: tb.progressPercentage,
    })),
    recentLessons: groupLessons.slice(0, 5).map((lesson) => ({
      lessonRecordId: lesson.lessonRecordId,
      date: lesson.date,
      title: lesson.title,
      unit: lesson.progressRecords?.[0]?.unit,
      homeworkAssigned: !!lesson.homework,
    })),
    stats: {
      totalLessons: groupLessons.length,
      averagePagesPerLesson: 15.0, // 목업 데이터
    },
  };
}

/**
 * 학생별 학습 리포트 조회 (목업)
 * S-033: 학생별 학습 리포트
 */
export function getMockStudentProgressSummary(
  studentId: string,
  groupId?: string
): StudentProgressSummary | null {
  // 목업 데이터: 학생 ID에 해당하는 수업 기록 필터링
  const studentLessons = mockLessonRecords.filter((lesson) => {
    const hasStudent = lesson.studentEvaluations?.some(
      (ev) => ev.studentId === studentId
    );
    return hasStudent && (!groupId || lesson.groupId === groupId);
  });

  if (studentLessons.length === 0) {
    return null;
  }

  const firstLesson = studentLessons[0];

  // 평균 이해도/집중도 계산
  let totalUnderstanding = 0;
  let totalConcentration = 0;
  let count = 0;

  studentLessons.forEach((lesson) => {
    const evaluation = lesson.studentEvaluations?.find(
      (e) => e.studentId === studentId
    );
    if (evaluation) {
      if (evaluation.understanding) {
        totalUnderstanding += evaluation.understanding;
        count++;
      }
      if (evaluation.concentration) {
        totalConcentration += evaluation.concentration;
      }
    }
  });

  const averageUnderstanding =
    count > 0 ? Math.round((totalUnderstanding / count) * 10) / 10 : 0;
  const averageConcentration =
    count > 0 ? Math.round((totalConcentration / count) * 10) / 10 : 0;

  return {
    studentId,
    studentName: studentLessons[0].studentEvaluations?.[0]?.studentName || '학생',
    groupId: firstLesson.groupId,
    groupName: firstLesson.groupName || '그룹',
    subject: '수학', // 목업 데이터
    progressRange: [
      {
        textbookName: '자이스토리 수학 II',
        startPage: 1,
        currentPage: 67,
        totalPages: 240,
        completionRate: 27.9,
      },
    ],
    recentLessons: studentLessons.slice(0, 5).map((lesson) => {
      const evaluation = lesson.studentEvaluations?.find(
        (e) => e.studentId === studentId
      );
      return {
        lessonRecordId: lesson.lessonRecordId,
        date: lesson.date,
        unit: lesson.progressRecords?.[0]?.unit,
        pagesCovered: lesson.progressRecords?.[0]?.pagesCovered,
        homework: lesson.homework,
        understanding: evaluation?.understanding,
        concentration: evaluation?.concentration,
      };
    }),
    stats: {
      totalLessons: studentLessons.length,
      averageUnderstanding,
      averageConcentration,
      homeworkCompletionRate: 85.0, // 목업 데이터
    },
    weakUnits: [
      {
        unit: '2-1 삼각함수',
        understanding: 3,
        notes: '새로운 개념이라 조금 어려워했습니다.',
      },
    ],
  };
}

/**
 * 진도 리포트 생성 (목업)
 * S-026: 진도 리포트 화면 (선생님)
 */
export function getMockProgressReport(groupId: string): ProgressReport {
  const groupLessons = getMockLessonRecordsByGroup(groupId);
  const groupTextbooks = getMockTextbooksByGroup(groupId);

  return {
    reportId: `report-${groupId}-${Date.now()}`,
    groupId,
    groupName: groupLessons[0]?.groupName || '그룹',
    period: {
      from: '2025-11-01',
      to: '2025-11-30',
    },
    stats: {
      totalLessons: groupLessons.length,
      totalHours: groupLessons.length * 1.5, // 수업당 1.5시간 가정
      totalPages: 67,
      averagePagesPerLesson: 8.4,
      attendanceRate: 100.0,
    },
    keyTopics: ['이차방정식', '판별식', '삼각함수', '함수의 극한', 'b²-4ac'],
    textbookProgress: groupTextbooks.map((tb) => ({
      textbookName: tb.name,
      startPage: tb.startPage || 1,
      endPage: tb.currentPage || 0,
      progressPercentage: tb.progressPercentage || 0,
    })),
    studentSummaries: [
      {
        studentId: 'student-1',
        studentName: '이학생',
        averageUnderstanding: 3.7,
        averageConcentration: 4.3,
        homeworkCompletionRate: 85.0,
      },
    ],
    createdAt: new Date().toISOString(),
  };
}

/**
 * 수업 기록 카드 뷰 변환 (목업)
 * UI 표시용
 */
export function convertToLessonRecordCardView(
  lesson: LessonRecord
): LessonRecordCardView {
  const pageRange =
    lesson.progressRecords && lesson.progressRecords.length > 0
      ? `${lesson.progressRecords[0].pageStart} ~ ${lesson.progressRecords[0].pageEnd}페이지`
      : undefined;

  const contentPreview =
    lesson.content.length > 50
      ? lesson.content.substring(0, 50) + '...'
      : lesson.content;

  return {
    lessonRecordId: lesson.lessonRecordId,
    date: lesson.date,
    title: lesson.title,
    unit: lesson.progressRecords?.[0]?.unit,
    pageRange,
    homeworkAssigned: !!lesson.homework,
    contentPreview,
    isViewed: !!lesson.viewedBy?.parentViewedAt,
  };
}
