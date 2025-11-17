/**
 * Billing Types - WeTee MVP
 * Feature: F-006 수업료 정산
 *
 * Based on:
 * - F-006_수업료_정산.md
 * - API_명세서.md (6.6 F-006)
 * - 데이터베이스_설계서.md (billing_* 테이블)
 * - UX_UI_설계서.md (S-027~S-033)
 */

/**
 * 정산 상태 (청구서/정산서 상태)
 */
export type BillingStatus =
  | 'DRAFT'      // 미발행 (작성 중)
  | 'ISSUED'     // 발행됨 (학부모에게 전송됨)
  | 'PAID'       // 입금 확인됨
  | 'SETTLED'    // 정산 완료
  | 'OVERDUE'    // 연체 (발행 후 30일 경과)
  | 'CANCELED';  // 취소됨

/**
 * 정산 항목 타입
 */
export type BillingItemType =
  | 'REGULAR_LESSON'  // 정규 수업
  | 'MAKEUP_LESSON'   // 보강 수업
  | 'EXAM'            // 시험 일정
  | 'ADJUSTMENT'      // 조정/할인
  | 'CREDIT'          // 크레딧/이월
  | 'OTHER';          // 기타

/**
 * 결제 방식
 */
export type PaymentMethod =
  | 'PREPAY'    // 선불
  | 'POSTPAY';  // 후불

/**
 * 정산 주기
 */
export type BillingCycle =
  | 'MONTHLY'      // 매월 말
  | 'EVERY_4'      // 4회마다
  | 'EVERY_8'      // 8회마다
  | 'EVERY_12';    // 12회마다

/**
 * 결제 수단
 */
export type PaymentType =
  | 'CARD'           // 신용카드
  | 'BANK_TRANSFER'  // 계좌이체
  | 'KAKAO_PAY'      // 카카오페이
  | 'NAVER_PAY'      // 네이버페이
  | 'TOSS'           // 토스
  | 'CASH';          // 현금

/**
 * 정산 항목 (청구서 내 개별 수업/항목)
 */
export interface BillingItem {
  id: string;
  groupId: string;
  studentId: string;
  scheduleId?: string;       // 연결된 일정 ID (F-003)
  lessonRecordId?: string;   // 연결된 수업 기록 ID (F-005)
  attendanceId?: string;     // 연결된 출결 ID (F-004)

  date: string;              // YYYY-MM-DD
  type: BillingItemType;
  description: string;       // 예: "11월 3일 (금) 수학 수업"

  unitPrice: number;         // 단가 (원)
  quantity: number;          // 수량 (보통 1)
  amount: number;            // 금액 = unitPrice * quantity

  adjustmentReason?: string; // 조정 사유 (할인/이월 등)
  memo?: string;

  createdAt: string;
  updatedAt?: string;
}

/**
 * 청구서/정산서 (Statement)
 *
 * 청구서 번호 형식: TUT-YYYY-NNN (예: TUT-2025-001)
 * - TUT: 플랫폼 접두사
 * - YYYY: 연도
 * - NNN: 순번 (연도별로 1부터 시작, 3자리 고정)
 */
export interface BillingStatement {
  id: string;                 // UUID
  statementNumber: string;    // 청구서 번호 (예: TUT-2025-001)

  groupId: string;
  groupName?: string;
  studentId: string;
  studentName?: string;
  teacherId: string;
  teacherName?: string;

  // 정산 기간
  periodFrom: string;         // YYYY-MM-DD
  periodTo: string;           // YYYY-MM-DD

  // 상태
  status: BillingStatus;

  // 항목들
  items: BillingItem[];

  // 금액
  subtotal: number;           // 소계 (항목 합계)
  discountTotal: number;      // 할인 합계 (음수)
  adjustmentTotal: number;    // 조정 합계 (이월 등)
  totalAmount: number;        // 최종 청구 금액

  // 날짜 정보
  issuedAt?: string;          // 발행일 (ISO8601)
  dueDate?: string;           // 지불 기한 (발행일 + 30일)
  paidAt?: string;            // 결제일
  settledAt?: string;         // 정산 완료일

  // 결제 정보
  paymentMethod?: PaymentType;
  paymentTransactionId?: string;

  // 메모
  memo?: string;
  teacherMemo?: string;       // 선생님 전용 메모 (학부모에게 비공개)

  createdAt: string;
  updatedAt?: string;
}

/**
 * 그룹별 정산 요약 (월별)
 */
export interface GroupBillingSummary {
  groupId: string;
  groupName: string;
  month: string;              // YYYY-MM

  // 수업료 설정
  pricePerLesson: number;     // 회당 수업료
  paymentMethod: PaymentMethod;
  billingCycle: BillingCycle;
  expectedLessonsPerMonth: number; // 월 예상 수업 횟수

  // 월별 합계
  totalAmount: number;        // 총 청구 금액
  paidAmount: number;         // 결제 완료 금액
  unpaidAmount: number;       // 미결제 금액

  // 학생별 요약
  studentSummaries: {
    studentId: string;
    studentName: string;
    expectedLessons: number;  // 약정 횟수
    actualLessons: number;    // 실제 수업 횟수
    amount: number;           // 청구 금액
    status: BillingStatus;
    statementId?: string;
  }[];

  // 통계
  totalStudents: number;
  totalLessons: number;       // 실제 진행된 수업 수
}

/**
 * 학생별 정산 요약 (월별)
 */
export interface StudentBillingSummary {
  studentId: string;
  studentName: string;
  month: string;              // YYYY-MM

  // 정산서 목록 (한 학생이 여러 그룹에 속할 수 있음)
  statements: BillingStatement[];

  // 합계
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
}

/**
 * 정산 통계 (선생님용, S-033)
 */
export interface BillingStatistics {
  teacherId: string;
  period: {
    from: string;             // YYYY-MM-DD
    to: string;               // YYYY-MM-DD
  };

  // 전체 수입
  totalRevenue: number;       // 총 청구 금액
  totalPaid: number;          // 결제 완료 금액
  totalUnpaid: number;        // 미결제 금액
  totalOverdue: number;       // 연체 금액

  // 수업 통계
  totalLessons: number;       // 총 수업 횟수
  totalStudents: number;      // 전체 학생 수
  averageRevenuePerStudent: number;

  // 월별 추이 (최근 6개월)
  monthlyTrends: {
    month: string;            // YYYY-MM
    revenue: number;
    lessons: number;
    students: number;
  }[];

  // 그룹별 수입
  groupBreakdown: {
    groupId: string;
    groupName: string;
    revenue: number;
    lessons: number;
    students: number;
  }[];

  // 학생별 수입 (상위 10명)
  topStudents: {
    studentId: string;
    studentName: string;
    revenue: number;
    lessons: number;
  }[];
}

/**
 * 청구서 생성 요청 (S-028, 선생님)
 */
export interface CreateBillingStatementPayload {
  groupId: string;
  studentId: string;
  periodFrom: string;         // YYYY-MM-DD
  periodTo: string;           // YYYY-MM-DD

  // 자동 포함할 일정 ID들 (선택 시 override)
  scheduleIds?: string[];

  // 수동 추가 항목
  additionalItems?: {
    type: BillingItemType;
    description: string;
    unitPrice: number;
    quantity: number;
    date: string;
  }[];

  memo?: string;
  teacherMemo?: string;
}

/**
 * 청구서 발송 요청
 */
export interface IssueBillingStatementPayload {
  statementId: string;
  sendNotification?: boolean; // 알림 발송 여부 (기본: true)
}

/**
 * 청구서 상태 업데이트 요청
 */
export interface UpdateBillingStatusPayload {
  statementId: string;
  status: BillingStatus;
  memo?: string;
}

/**
 * 결제 요청 (S-030, 학부모)
 */
export interface CreatePaymentPayload {
  statementId: string;
  paymentType: PaymentType;

  // 카드 결제인 경우 (토스페이먼츠 등 PG 연동)
  paymentKey?: string;
  orderId?: string;
  amount: number;
}

/**
 * 결제 정보
 */
export interface PaymentInfo {
  paymentId: string;
  statementId: string;
  statementNumber: string;

  amount: number;
  paymentType: PaymentType;

  // PG 정보
  paymentKey?: string;
  orderId?: string;
  transactionId?: string;

  // 카드 정보 (마스킹)
  cardNumber?: string;        // 예: "**** **** **** 1234"
  cardCompany?: string;

  // 상태
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

  paidAt?: string;
  createdAt: string;
}

/**
 * 영수증 정보 (S-032)
 */
export interface Receipt {
  receiptId: string;
  statementId: string;
  statementNumber: string;
  paymentId: string;

  // 발행인
  issuer: {
    teacherId: string;
    teacherName: string;
    phone?: string;
    email?: string;
  };

  // 수신인
  receiver: {
    parentId: string;
    parentName: string;
    studentName: string;
  };

  // 결제 정보
  paymentInfo: PaymentInfo;

  // 수업 내역
  items: BillingItem[];

  // 금액
  subtotal: number;
  discountTotal: number;
  totalAmount: number;

  issuedAt: string;           // 영수증 발행일

  // PDF 다운로드 URL (임시)
  pdfUrl?: string;
}

/**
 * 정산 필터 파라미터 (목록 조회)
 */
export interface BillingListParams {
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  status?: BillingStatus;
  periodFrom?: string;        // YYYY-MM-DD
  periodTo?: string;          // YYYY-MM-DD
  page?: number;
  size?: number;
}

/**
 * 정산 대시보드 카드 (UI용, S-027)
 */
export interface BillingDashboardCard {
  groupId: string;
  groupName: string;
  studentId: string;
  studentName: string;

  month: string;              // YYYY-MM

  expectedLessons: number;
  actualLessons: number;
  amount: number;
  status: BillingStatus;

  hasWarning: boolean;        // 약정과 실제 횟수 차이 있음
  warningMessage?: string;

  statementId?: string;
  issuedAt?: string;
}

/**
 * 월별 수입 차트 데이터 (S-033)
 */
export interface MonthlyRevenueChart {
  months: string[];           // ['2025-07', '2025-08', '2025-09', ...]
  revenues: number[];         // [1200000, 1500000, 1750000, ...]
  lessons: number[];          // [24, 30, 35, ...]
}
