/**
 * Billing Mock Data - WeTee MVP
 * Feature: F-006 수업료 정산
 *
 * 목업 데이터 제공:
 * - 청구서/정산서 (BillingStatement)
 * - 그룹별 정산 요약 (GroupBillingSummary)
 * - 학생별 정산 요약 (StudentBillingSummary)
 * - 정산 통계 (BillingStatistics)
 */

import type {
  BillingStatement,
  BillingItem,
  // BillingStatus,
  GroupBillingSummary,
  StudentBillingSummary,
  BillingStatistics,
  PaymentInfo,
  Receipt,
  BillingDashboardCard,
  MonthlyRevenueChart,
} from '@/types/billing';

// ============================================================================
// Mock Billing Items
// ============================================================================

const mockBillingItems: BillingItem[] = [
  {
    id: 'bi-001',
    groupId: 'group-001',
    studentId: 'student-001',
    scheduleId: 'schedule-001',
    attendanceId: 'attendance-001',
    date: '2025-11-03',
    type: 'REGULAR_LESSON',
    description: '11월 3일 (월) 수학 수업 - 출석',
    unitPrice: 50000,
    quantity: 1,
    amount: 50000,
    createdAt: '2025-11-03T17:00:00Z',
  },
  {
    id: 'bi-002',
    groupId: 'group-001',
    studentId: 'student-001',
    scheduleId: 'schedule-002',
    attendanceId: 'attendance-002',
    date: '2025-11-06',
    type: 'REGULAR_LESSON',
    description: '11월 6일 (목) 수학 수업 - 출석',
    unitPrice: 50000,
    quantity: 1,
    amount: 50000,
    createdAt: '2025-11-06T17:00:00Z',
  },
  {
    id: 'bi-003',
    groupId: 'group-001',
    studentId: 'student-001',
    date: '2025-11-10',
    type: 'REGULAR_LESSON',
    description: '11월 10일 (월) 수학 수업 - 결석',
    unitPrice: 50000,
    quantity: 0,
    amount: 0,
    memo: '시험 준비로 결석 (사전 연락)',
    createdAt: '2025-11-10T15:00:00Z',
  },
  {
    id: 'bi-004',
    groupId: 'group-001',
    studentId: 'student-001',
    scheduleId: 'schedule-004',
    attendanceId: 'attendance-004',
    date: '2025-11-13',
    type: 'REGULAR_LESSON',
    description: '11월 13일 (목) 수학 수업 - 출석',
    unitPrice: 50000,
    quantity: 1,
    amount: 50000,
    createdAt: '2025-11-13T17:00:00Z',
  },
  {
    id: 'bi-005',
    groupId: 'group-001',
    studentId: 'student-001',
    scheduleId: 'schedule-005',
    attendanceId: 'attendance-005',
    date: '2025-11-17',
    type: 'MAKEUP_LESSON',
    description: '11월 17일 (일) 수학 보강 수업 - 출석',
    unitPrice: 50000,
    quantity: 1,
    amount: 50000,
    memo: '11월 10일 결석 건 보강',
    createdAt: '2025-11-17T14:00:00Z',
  },
];

// ============================================================================
// Mock Billing Statements
// ============================================================================

export const mockBillingStatements: BillingStatement[] = [
  // Statement 1: 이학생 - 11월 정산 (결제 완료)
  {
    id: 'statement-001',
    statementNumber: 'TUT-2025-001',
    groupId: 'group-001',
    groupName: '이학생 - 수학',
    studentId: 'student-001',
    studentName: '이학생',
    teacherId: 'teacher-001',
    teacherName: '김선생님',
    periodFrom: '2025-11-01',
    periodTo: '2025-11-30',
    status: 'PAID',
    items: mockBillingItems.slice(0, 5),
    subtotal: 200000,
    discountTotal: 0,
    adjustmentTotal: 0,
    totalAmount: 200000,
    issuedAt: '2025-11-30T21:00:00Z',
    dueDate: '2025-12-30',
    paidAt: '2025-12-01T10:30:00Z',
    paymentMethod: 'CARD',
    paymentTransactionId: 'txn-001',
    memo: '11월 총 4회 출석, 1회 결석(보강 완료)',
    createdAt: '2025-11-30T20:00:00Z',
    updatedAt: '2025-12-01T10:30:00Z',
  },

  // Statement 2: 박학생 - 11월 정산 (미결제)
  {
    id: 'statement-002',
    statementNumber: 'TUT-2025-002',
    groupId: 'group-002',
    groupName: '박학생 - 영어',
    studentId: 'student-002',
    studentName: '박학생',
    teacherId: 'teacher-001',
    teacherName: '김선생님',
    periodFrom: '2025-11-01',
    periodTo: '2025-11-30',
    status: 'ISSUED',
    items: [
      {
        id: 'bi-101',
        groupId: 'group-002',
        studentId: 'student-002',
        date: '2025-11-01',
        type: 'REGULAR_LESSON',
        description: '11월 1일 (금) 영어 수업 - 출석',
        unitPrice: 60000,
        quantity: 1,
        amount: 60000,
        createdAt: '2025-11-01T19:00:00Z',
      },
      {
        id: 'bi-102',
        groupId: 'group-002',
        studentId: 'student-002',
        date: '2025-11-08',
        type: 'REGULAR_LESSON',
        description: '11월 8일 (금) 영어 수업 - 출석',
        unitPrice: 60000,
        quantity: 1,
        amount: 60000,
        createdAt: '2025-11-08T19:00:00Z',
      },
      {
        id: 'bi-103',
        groupId: 'group-002',
        studentId: 'student-002',
        date: '2025-11-15',
        type: 'REGULAR_LESSON',
        description: '11월 15일 (금) 영어 수업 - 출석',
        unitPrice: 60000,
        quantity: 1,
        amount: 60000,
        createdAt: '2025-11-15T19:00:00Z',
      },
      {
        id: 'bi-104',
        groupId: 'group-002',
        studentId: 'student-002',
        date: '2025-11-22',
        type: 'REGULAR_LESSON',
        description: '11월 22일 (금) 영어 수업 - 출석',
        unitPrice: 60000,
        quantity: 1,
        amount: 60000,
        createdAt: '2025-11-22T19:00:00Z',
      },
      {
        id: 'bi-105',
        groupId: 'group-002',
        studentId: 'student-002',
        date: '2025-11-29',
        type: 'REGULAR_LESSON',
        description: '11월 29일 (금) 영어 수업 - 지각',
        unitPrice: 60000,
        quantity: 1,
        amount: 60000,
        memo: '10분 지각',
        createdAt: '2025-11-29T19:10:00Z',
      },
    ],
    subtotal: 300000,
    discountTotal: 0,
    adjustmentTotal: 0,
    totalAmount: 300000,
    issuedAt: '2025-11-30T21:00:00Z',
    dueDate: '2025-12-30',
    memo: '11월 총 5회 출석 (1회 지각)',
    createdAt: '2025-11-30T20:30:00Z',
  },

  // Statement 3: 최학생 - 11월 정산 (결제 완료, 차액 환불 필요)
  {
    id: 'statement-003',
    statementNumber: 'TUT-2025-003',
    groupId: 'group-003',
    groupName: '최학생 - 과학',
    studentId: 'student-003',
    studentName: '최학생',
    teacherId: 'teacher-001',
    teacherName: '김선생님',
    periodFrom: '2025-11-01',
    periodTo: '2025-11-30',
    status: 'PAID',
    items: [
      {
        id: 'bi-201',
        groupId: 'group-003',
        studentId: 'student-003',
        date: '2025-11-02',
        type: 'REGULAR_LESSON',
        description: '11월 2일 (토) 과학 수업 - 출석',
        unitPrice: 70000,
        quantity: 1,
        amount: 70000,
        createdAt: '2025-11-02T14:00:00Z',
      },
      {
        id: 'bi-202',
        groupId: 'group-003',
        studentId: 'student-003',
        date: '2025-11-09',
        type: 'REGULAR_LESSON',
        description: '11월 9일 (토) 과학 수업 - 출석',
        unitPrice: 70000,
        quantity: 1,
        amount: 70000,
        createdAt: '2025-11-09T14:00:00Z',
      },
      {
        id: 'bi-203',
        groupId: 'group-003',
        studentId: 'student-003',
        date: '2025-11-16',
        type: 'REGULAR_LESSON',
        description: '11월 16일 (토) 과학 수업 - 결석',
        unitPrice: 70000,
        quantity: 0,
        amount: 0,
        memo: '감기로 결석',
        createdAt: '2025-11-16T14:00:00Z',
      },
      {
        id: 'bi-204',
        groupId: 'group-003',
        studentId: 'student-003',
        date: '2025-11-23',
        type: 'REGULAR_LESSON',
        description: '11월 23일 (토) 과학 수업 - 결석',
        unitPrice: 70000,
        quantity: 0,
        amount: 0,
        memo: '가족 행사로 결석',
        createdAt: '2025-11-23T14:00:00Z',
      },
      {
        id: 'bi-205',
        groupId: 'group-003',
        studentId: 'student-003',
        date: '2025-11-30',
        type: 'ADJUSTMENT',
        description: '11월 차액 조정 (2회 결석)',
        unitPrice: -70000,
        quantity: 2,
        amount: -140000,
        adjustmentReason: '2회 결석으로 차액 다음 달 이월',
        createdAt: '2025-11-30T20:00:00Z',
      },
    ],
    subtotal: 140000,
    discountTotal: 0,
    adjustmentTotal: -140000,
    totalAmount: 140000,
    issuedAt: '2025-11-30T21:00:00Z',
    dueDate: '2025-12-30',
    paidAt: '2025-12-02T15:20:00Z',
    paymentMethod: 'BANK_TRANSFER',
    memo: '11월 총 2회 출석, 2회 결석 (차액 12월 이월 예정)',
    teacherMemo: '학부모님과 전화 통화 후 12월 수업료에서 차감하기로 협의',
    createdAt: '2025-11-30T20:45:00Z',
    updatedAt: '2025-12-02T15:20:00Z',
  },

  // Statement 4: 정학생 - 10월 정산 (정산 완료)
  {
    id: 'statement-004',
    statementNumber: 'TUT-2025-004',
    groupId: 'group-004',
    groupName: '정학생 - 수학',
    studentId: 'student-004',
    studentName: '정학생',
    teacherId: 'teacher-001',
    teacherName: '김선생님',
    periodFrom: '2025-10-01',
    periodTo: '2025-10-31',
    status: 'SETTLED',
    items: Array.from({ length: 8 }, (_, i) => ({
      id: `bi-30${i}`,
      groupId: 'group-004',
      studentId: 'student-004',
      date: `2025-10-${String((i + 1) * 3).padStart(2, '0')}`,
      type: 'REGULAR_LESSON' as const,
      description: `10월 ${(i + 1) * 3}일 수학 수업 - 출석`,
      unitPrice: 55000,
      quantity: 1,
      amount: 55000,
      createdAt: `2025-10-${String((i + 1) * 3).padStart(2, '0')}T15:00:00Z`,
    })),
    subtotal: 440000,
    discountTotal: 0,
    adjustmentTotal: 0,
    totalAmount: 440000,
    issuedAt: '2025-10-31T21:00:00Z',
    dueDate: '2025-11-30',
    paidAt: '2025-11-01T09:15:00Z',
    settledAt: '2025-11-01T09:15:00Z',
    paymentMethod: 'TOSS',
    paymentTransactionId: 'txn-004',
    memo: '10월 총 8회 출석',
    createdAt: '2025-10-31T20:00:00Z',
    updatedAt: '2025-11-01T09:15:00Z',
  },
];

// ============================================================================
// Mock Group Billing Summaries
// ============================================================================

export const mockGroupBillingSummaries: GroupBillingSummary[] = [
  {
    groupId: 'group-001',
    groupName: '이학생 - 수학',
    month: '2025-11',
    pricePerLesson: 50000,
    paymentMethod: 'POSTPAY',
    billingCycle: 'MONTHLY',
    expectedLessonsPerMonth: 8,
    totalAmount: 200000,
    paidAmount: 200000,
    unpaidAmount: 0,
    studentSummaries: [
      {
        studentId: 'student-001',
        studentName: '이학생',
        expectedLessons: 8,
        actualLessons: 4,
        amount: 200000,
        status: 'PAID',
        statementId: 'statement-001',
      },
    ],
    totalStudents: 1,
    totalLessons: 4,
  },
  {
    groupId: 'group-002',
    groupName: '박학생 - 영어',
    month: '2025-11',
    pricePerLesson: 60000,
    paymentMethod: 'POSTPAY',
    billingCycle: 'MONTHLY',
    expectedLessonsPerMonth: 8,
    totalAmount: 300000,
    paidAmount: 0,
    unpaidAmount: 300000,
    studentSummaries: [
      {
        studentId: 'student-002',
        studentName: '박학생',
        expectedLessons: 8,
        actualLessons: 5,
        amount: 300000,
        status: 'ISSUED',
        statementId: 'statement-002',
      },
    ],
    totalStudents: 1,
    totalLessons: 5,
  },
  {
    groupId: 'group-003',
    groupName: '최학생 - 과학',
    month: '2025-11',
    pricePerLesson: 70000,
    paymentMethod: 'PREPAY',
    billingCycle: 'MONTHLY',
    expectedLessonsPerMonth: 4,
    totalAmount: 140000,
    paidAmount: 140000,
    unpaidAmount: 0,
    studentSummaries: [
      {
        studentId: 'student-003',
        studentName: '최학생',
        expectedLessons: 4,
        actualLessons: 2,
        amount: 140000,
        status: 'PAID',
        statementId: 'statement-003',
      },
    ],
    totalStudents: 1,
    totalLessons: 2,
  },
];

// ============================================================================
// Mock Statistics
// ============================================================================

export const mockBillingStatistics: BillingStatistics = {
  teacherId: 'teacher-001',
  period: {
    from: '2025-06-01',
    to: '2025-11-30',
  },
  totalRevenue: 3200000,
  totalPaid: 2800000,
  totalUnpaid: 300000,
  totalOverdue: 100000,
  totalLessons: 65,
  totalStudents: 5,
  averageRevenuePerStudent: 640000,
  monthlyTrends: [
    { month: '2025-06', revenue: 450000, lessons: 10, students: 3 },
    { month: '2025-07', revenue: 500000, lessons: 11, students: 4 },
    { month: '2025-08', revenue: 480000, lessons: 10, students: 4 },
    { month: '2025-09', revenue: 550000, lessons: 12, students: 5 },
    { month: '2025-10', revenue: 580000, lessons: 12, students: 5 },
    { month: '2025-11', revenue: 640000, lessons: 11, students: 5 },
  ],
  groupBreakdown: [
    { groupId: 'group-001', groupName: '이학생 - 수학', revenue: 800000, lessons: 16, students: 1 },
    { groupId: 'group-002', groupName: '박학생 - 영어', revenue: 1200000, lessons: 20, students: 1 },
    { groupId: 'group-003', groupName: '최학생 - 과학', revenue: 560000, lessons: 8, students: 1 },
    { groupId: 'group-004', groupName: '정학생 - 수학', revenue: 440000, lessons: 8, students: 1 },
    { groupId: 'group-005', groupName: '강학생 - 물리', revenue: 200000, lessons: 4, students: 1 },
  ],
  topStudents: [
    { studentId: 'student-002', studentName: '박학생', revenue: 1200000, lessons: 20 },
    { studentId: 'student-001', studentName: '이학생', revenue: 800000, lessons: 16 },
    { studentId: 'student-003', studentName: '최학생', revenue: 560000, lessons: 8 },
    { studentId: 'student-004', studentName: '정학생', revenue: 440000, lessons: 8 },
    { studentId: 'student-005', studentName: '강학생', revenue: 200000, lessons: 4 },
  ],
};

export const mockMonthlyRevenueChart: MonthlyRevenueChart = {
  months: ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11'],
  revenues: [450000, 500000, 480000, 550000, 580000, 640000],
  lessons: [10, 11, 10, 12, 12, 11],
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 그룹별 월별 정산 요약 조회
 */
export function getMockGroupBillingSummary(
  groupId: string,
  month: string
): GroupBillingSummary | undefined {
  return mockGroupBillingSummaries.find(
    (s) => s.groupId === groupId && s.month === month
  );
}

/**
 * 정산서 ID로 조회
 */
export function getMockBillingStatementById(
  statementId: string
): BillingStatement | undefined {
  return mockBillingStatements.find((s) => s.id === statementId);
}

/**
 * 정산서 번호로 조회
 */
export function getMockBillingStatementByNumber(
  statementNumber: string
): BillingStatement | undefined {
  return mockBillingStatements.find((s) => s.statementNumber === statementNumber);
}

/**
 * 학생별 월별 정산 요약 조회
 */
export function getMockStudentBillingSummary(
  studentId: string,
  month: string
): StudentBillingSummary {
  const statements = mockBillingStatements.filter(
    (s) => s.studentId === studentId && s.periodFrom.startsWith(month)
  );

  const totalAmount = statements.reduce((sum, s) => sum + s.totalAmount, 0);
  const paidAmount = statements
    .filter((s) => s.status === 'PAID' || s.status === 'SETTLED')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  return {
    studentId,
    studentName: statements[0]?.studentName || '학생',
    month,
    statements,
    totalAmount,
    paidAmount,
    unpaidAmount: totalAmount - paidAmount,
  };
}

/**
 * 선생님별 정산 대시보드 카드 목록 조회
 */
export function getMockBillingDashboardCards(
  teacherId: string,
  month: string
): BillingDashboardCard[] {
  return mockGroupBillingSummaries
    .filter((g) => g.month === month)
    .flatMap((g) =>
      g.studentSummaries.map((s) => ({
        groupId: g.groupId,
        groupName: g.groupName,
        studentId: s.studentId,
        studentName: s.studentName,
        month: g.month,
        expectedLessons: s.expectedLessons,
        actualLessons: s.actualLessons,
        amount: s.amount,
        status: s.status,
        hasWarning: Math.abs(s.expectedLessons - s.actualLessons) >= 3,
        warningMessage:
          Math.abs(s.expectedLessons - s.actualLessons) >= 3
            ? `약정 ${s.expectedLessons}회, 실제 ${s.actualLessons}회`
            : undefined,
        statementId: s.statementId,
        issuedAt: mockBillingStatements.find((st) => st.id === s.statementId)?.issuedAt,
      }))
    );
}

/**
 * Mock 영수증 조회
 */
export function getMockReceipt(statementId: string): Receipt | undefined {
  const statement = getMockBillingStatementById(statementId);
  if (!statement || !statement.paidAt) return undefined;

  const paymentInfo: PaymentInfo = {
    paymentId: `payment-${statementId}`,
    statementId: statement.id,
    statementNumber: statement.statementNumber,
    amount: statement.totalAmount,
    paymentType: statement.paymentMethod || 'CARD',
    transactionId: statement.paymentTransactionId,
    cardNumber: '**** **** **** 1234',
    cardCompany: '신한카드',
    status: 'COMPLETED',
    paidAt: statement.paidAt,
    createdAt: statement.paidAt,
  };

  return {
    receiptId: `receipt-${statementId}`,
    statementId: statement.id,
    statementNumber: statement.statementNumber,
    paymentId: paymentInfo.paymentId,
    issuer: {
      teacherId: statement.teacherId,
      teacherName: statement.teacherName || '선생님',
      phone: '010-1234-5678',
      email: 'teacher@example.com',
    },
    receiver: {
      parentId: 'parent-001',
      parentName: '학부모님',
      studentName: statement.studentName || '학생',
    },
    paymentInfo,
    items: statement.items,
    subtotal: statement.subtotal,
    discountTotal: statement.discountTotal,
    totalAmount: statement.totalAmount,
    issuedAt: statement.paidAt,
    pdfUrl: `/api/v1/billing/receipts/${statement.id}/pdf`,
  };
}
