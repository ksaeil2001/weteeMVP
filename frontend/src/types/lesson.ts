/**
 * Lesson Record Types - WeTee MVP
 * Feature: F-005 수업 기록 및 진도 관리
 *
 * Based on:
 * - F-005_수업_기록_및_진도_관리.md
 * - API_명세서.md (6.5 F-005)
 * - 데이터베이스_설계서.md (lesson_records, textbooks, progress_records)
 * - UX_UI_설계서.md (S-022~S-026)
 */

/**
 * 수업 기록
 * S-022: 수업 기록 작성 화면 (선생님)
 * S-023: 수업 기록 상세 화면
 */
export interface LessonRecord {
  lessonRecordId: string;
  scheduleId: string;
  groupId: string;
  groupName?: string; // 표시용
  date: string; // YYYY-MM-DD
  title?: string; // 예: "수학 2-1 단원 함수 - 개념 정리"

  // 수업 내용
  content: string; // 오늘 배운 내용 (필수, 최소 10자)
  keyPoints?: string[]; // 핵심 개념/키워드
  studentFeedback?: string; // 학생 상태 (선택, 최대 500자)
  homework?: string; // 숙제 (선택, 최대 1000자)
  homeworkDueDate?: string; // 숙제 제출 기한 (YYYY-MM-DD)

  // 진도 기록 (다중 교재 가능)
  progressRecords?: ProgressRecord[];

  // 학생별 평가 (선택)
  studentEvaluations?: StudentEvaluation[];

  // 작성자
  createdBy: {
    userId: string;
    name: string;
  };

  // 공유 상태
  isShared: boolean; // 학부모에게 공유 여부
  sharedAt?: string; // 공유 시각

  // 조회 상태
  viewedBy?: {
    parentViewedAt?: string; // 학부모가 읽은 시각
    studentViewedAt?: string; // 학생이 읽은 시각
  };

  // 타임스탬프
  createdAt: string;
  updatedAt?: string;
}

/**
 * 교재
 * S-024: 교재 관리 화면 (선생님)
 */
export interface Textbook {
  textbookId: string;
  groupId: string;
  name: string; // 교재명 (예: "수학의 정석 상권")
  publisher?: string; // 출판사
  totalPages?: number; // 전체 페이지 수
  startPage?: number; // 시작 페이지 (중간부터 시작하는 경우)
  currentPage?: number; // 현재 진도 페이지
  progressPercentage?: number; // 진도율 (%)
  isActive: boolean; // 활성 상태
  createdAt: string;
  updatedAt?: string;
}

/**
 * 진도 기록 (한 수업에서 여러 교재 가능, 최대 5개)
 * F-005 명세서: 다중 교재 진도 입력 기능 (v1.1)
 */
export interface ProgressRecord {
  progressId?: string;
  lessonRecordId?: string;
  textbook: {
    textbookId: string;
    name: string; // 표시용
  };
  unit?: string; // 단원/챕터 정보 (예: "2-1 함수")
  pageStart?: number; // 시작 페이지
  pageEnd?: number; // 끝 페이지
  pagesCovered?: number; // 진행 페이지 수 (자동 계산)
  notes?: string; // 진도 메모
  createdAt?: string;
}

/**
 * 학생별 평가 (선택)
 */
export interface StudentEvaluation {
  studentId: string;
  studentName: string;
  understanding?: number; // 이해도 (1~5)
  concentration?: number; // 집중도 (1~5)
  difficulty?: number; // 체감 난이도 (1~5, 1=매우 쉬움, 5=매우 어려움)
  memo?: string; // 학생별 메모
}

/**
 * 그룹 진도 요약
 * S-030: 그룹 진도 대시보드
 */
export interface GroupProgressSummary {
  groupId: string;
  groupName: string;
  subject: string;

  // 교재별 진도
  textbooks: {
    textbookId: string;
    name: string;
    currentPage: number;
    totalPages?: number;
    progressPercentage?: number;
  }[];

  // 최근 수업 요약
  recentLessons: {
    lessonRecordId: string;
    date: string; // YYYY-MM-DD
    title?: string;
    unit?: string;
    homeworkAssigned: boolean;
  }[];

  // 통계
  stats?: {
    totalLessons: number; // 누적 수업 횟수
    averagePagesPerLesson?: number; // 회당 평균 진도 (페이지)
  };
}

/**
 * 학생별 학습 리포트
 * S-033: 학생별 학습 리포트
 */
export interface StudentProgressSummary {
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  subject: string;

  // 누적 진도 범위
  progressRange?: {
    textbookName: string;
    startPage: number;
    currentPage: number;
    totalPages?: number;
    completionRate?: number; // %
  }[];

  // 최근 N회 수업 요약
  recentLessons: {
    lessonRecordId: string;
    date: string;
    unit?: string;
    pagesCovered?: number;
    homework?: string;
    understanding?: number; // 평균 이해도
    concentration?: number; // 평균 집중도
  }[];

  // 통계
  stats?: {
    totalLessons: number;
    averageUnderstanding?: number; // 평균 이해도 (1~5)
    averageConcentration?: number; // 평균 집중도 (1~5)
    homeworkCompletionRate?: number; // 숙제 수행률 (%)
  };

  // 약점 단원 (목업 데이터)
  weakUnits?: {
    unit: string;
    understanding: number;
    notes?: string;
  }[];
}

/**
 * 수업 기록 작성 요청 (S-022)
 */
export interface CreateLessonRecordPayload {
  scheduleId: string;
  groupId: string;

  // 필수 항목
  content: string; // 오늘 배운 내용 (최소 10자, 최대 2000자)

  // 선택 항목
  studentFeedback?: string; // 학생 상태 (최대 500자)
  homework?: string; // 숙제 (최대 1000자)
  homeworkDueDate?: string; // 숙제 제출 기한

  // 진도 (다중 교재 가능, 최대 5개)
  progressRecords?: {
    textbookId: string;
    unit?: string;
    pageStart?: number;
    pageEnd?: number;
    notes?: string;
  }[];

  // 학생별 평가 (선택)
  studentEvaluations?: {
    studentId: string;
    understanding?: number; // 1~5
    concentration?: number; // 1~5
    difficulty?: number; // 1~5
    memo?: string;
  }[];

  // 공유 여부
  isShared?: boolean; // 기본값: true (학부모에게 자동 공유)
}

/**
 * 수업 기록 수정 요청
 */
export interface UpdateLessonRecordPayload {
  content?: string;
  studentFeedback?: string;
  homework?: string;
  homeworkDueDate?: string;
  progressRecords?: {
    textbookId: string;
    unit?: string;
    pageStart?: number;
    pageEnd?: number;
    notes?: string;
  }[];
  studentEvaluations?: {
    studentId: string;
    understanding?: number;
    concentration?: number;
    difficulty?: number;
    memo?: string;
  }[];
}

/**
 * 교재 등록 요청
 */
export interface CreateTextbookPayload {
  groupId: string;
  name: string; // 교재명 (최소 1자, 최대 100자)
  publisher?: string;
  totalPages?: number;
  startPage?: number; // 기본값: 1
}

/**
 * 교재 수정 요청
 */
export interface UpdateTextbookPayload {
  name?: string;
  publisher?: string;
  totalPages?: number;
  startPage?: number;
  isActive?: boolean; // 숨기기/보이기
}

/**
 * 수업 기록 목록 조회 파라미터
 * S-032: 그룹 진도 히스토리
 */
export interface LessonRecordListParams {
  groupId?: string;
  studentId?: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  size?: number;
}

/**
 * 진도 조회 파라미터
 * S-025: 진도 히스토리 화면
 */
export interface ProgressQueryParams {
  groupId: string;
  textbookId?: string; // 특정 교재만 조회
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

/**
 * 진도 리포트 생성 요청 (S-026)
 */
export interface GenerateProgressReportPayload {
  groupId: string;
  period: 'month' | 'quarter' | 'all' | 'custom'; // 기간 타입
  from?: string; // period가 'custom'일 때
  to?: string; // period가 'custom'일 때
}

/**
 * 진도 리포트
 * S-026: 진도 리포트 화면 (선생님)
 */
export interface ProgressReport {
  reportId: string;
  groupId: string;
  groupName: string;
  period: {
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
  };

  // 통계 카드
  stats: {
    totalLessons: number; // 총 수업 횟수
    totalHours?: number; // 총 수업 시간 (시간)
    totalPages?: number; // 총 진도 (페이지)
    averagePagesPerLesson?: number; // 평균 진도 (페이지/회)
    attendanceRate?: number; // 출석률 (%)
  };

  // 주요 학습 내용 (키워드)
  keyTopics?: string[]; // 최대 10개 키워드

  // 교재별 진도
  textbookProgress?: {
    textbookName: string;
    startPage: number;
    endPage: number;
    progressPercentage: number;
  }[];

  // 학생별 요약 (1:1 과외가 아닌 경우)
  studentSummaries?: {
    studentId: string;
    studentName: string;
    averageUnderstanding: number;
    averageConcentration: number;
    homeworkCompletionRate: number;
  }[];

  createdAt: string;
  sharedAt?: string; // 학부모에게 공유한 시각
}

/**
 * UI 표시용: 수업 기록 카드 뷰
 */
export interface LessonRecordCardView {
  lessonRecordId: string;
  date: string; // YYYY-MM-DD
  title?: string;
  unit?: string;
  pageRange?: string; // "53 ~ 67페이지"
  homeworkAssigned: boolean;
  contentPreview: string; // 수업 내용 첫 줄 (최대 50자)
  isViewed?: boolean; // 학부모가 읽었는지
}
