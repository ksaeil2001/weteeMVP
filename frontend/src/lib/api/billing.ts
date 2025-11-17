/**
 * Billing API Client - WeTee MVP
 * Feature: F-006 수업료 정산
 *
 * TODO(F-006): FastAPI /api/v1/billing 엔드포인트와 실제 연동
 * 현재는 목업 데이터를 사용합니다.
 */

import type {
  BillingStatement,
  BillingStatus,
  GroupBillingSummary,
  StudentBillingSummary,
  BillingStatistics,
  BillingDashboardCard,
  MonthlyRevenueChart,
  CreateBillingStatementPayload,
  IssueBillingStatementPayload,
  UpdateBillingStatusPayload,
  CreatePaymentPayload,
  PaymentInfo,
  Receipt,
  BillingListParams,
} from '@/types/billing';

import {
  mockBillingStatements,
  mockGroupBillingSummaries,
  mockBillingStatistics,
  mockMonthlyRevenueChart,
  getMockGroupBillingSummary,
  getMockBillingStatementById,
  getMockBillingStatementByNumber,
  getMockStudentBillingSummary,
  getMockBillingDashboardCards,
  getMockReceipt,
} from '@/mocks/billing';

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 정산 개요 조회 (선생님용 대시보드 - S-027)
 *
 * @param params.month - 조회 월 (YYYY-MM)
 * @returns 그룹별 정산 요약 목록
 */
export async function fetchBillingOverview(params: {
  month: string;
}): Promise<GroupBillingSummary[]> {
  // TODO(F-006): GET /api/v1/billing/overview?month={month}
  await delay(300);

  return mockGroupBillingSummaries.filter((s) => s.month === params.month);
}

/**
 * 선생님용 정산 대시보드 카드 목록 조회 (S-027)
 *
 * @param teacherId - 선생님 ID
 * @param month - 조회 월 (YYYY-MM)
 * @returns 학생별 정산 카드 목록
 */
export async function fetchBillingDashboard(
  teacherId: string,
  month: string
): Promise<BillingDashboardCard[]> {
  // TODO(F-006): GET /api/v1/billing/dashboard?month={month}
  await delay(300);

  return getMockBillingDashboardCards(teacherId, month);
}

/**
 * 그룹별 정산 요약 조회 (S-041: 그룹별 정산 상세)
 *
 * @param groupId - 그룹 ID
 * @param params.month - 조회 월 (YYYY-MM)
 * @returns 그룹별 정산 요약
 */
export async function fetchGroupBillingSummary(
  groupId: string,
  params: { month: string }
): Promise<GroupBillingSummary> {
  // TODO(F-006): GET /api/v1/billing/groups/{groupId}?month={month}
  await delay(300);

  const summary = getMockGroupBillingSummary(groupId, params.month);
  if (!summary) {
    throw new Error('그룹 정산 정보를 찾을 수 없습니다');
  }

  return summary;
}

/**
 * 정산서 ID로 조회 (S-029: 청구서 상세)
 *
 * @param statementId - 정산서 ID
 * @returns 정산서 상세 정보
 */
export async function fetchBillingStatementById(
  statementId: string
): Promise<BillingStatement> {
  // TODO(F-006): GET /api/v1/billing/statements/{statementId}
  await delay(300);

  const statement = getMockBillingStatementById(statementId);
  if (!statement) {
    throw new Error('정산서를 찾을 수 없습니다');
  }

  return statement;
}

/**
 * 정산서 번호로 조회
 *
 * @param statementNumber - 정산서 번호 (예: TUT-2025-001)
 * @returns 정산서 상세 정보
 */
export async function fetchBillingStatementByNumber(
  statementNumber: string
): Promise<BillingStatement> {
  // TODO(F-006): GET /api/v1/billing/statements/by-number/{statementNumber}
  await delay(300);

  const statement = getMockBillingStatementByNumber(statementNumber);
  if (!statement) {
    throw new Error('정산서를 찾을 수 없습니다');
  }

  return statement;
}

/**
 * 학생별 정산 요약 조회 (S-043: 학생/학부모용 청구 내역)
 *
 * @param studentId - 학생 ID
 * @param params.month - 조회 월 (YYYY-MM)
 * @returns 학생별 정산 요약
 */
export async function fetchStudentBillingSummary(
  studentId: string,
  params: { month: string }
): Promise<StudentBillingSummary> {
  // TODO(F-006): GET /api/v1/billing/students/{studentId}?month={month}
  await delay(300);

  return getMockStudentBillingSummary(studentId, params.month);
}

/**
 * 정산서 목록 조회
 *
 * @param params - 필터 파라미터
 * @returns 정산서 목록
 */
export async function fetchBillingStatements(
  params: BillingListParams
): Promise<BillingStatement[]> {
  // TODO(F-006): GET /api/v1/billing/statements
  await delay(300);

  let filtered = [...mockBillingStatements];

  if (params.groupId) {
    filtered = filtered.filter((s) => s.groupId === params.groupId);
  }
  if (params.studentId) {
    filtered = filtered.filter((s) => s.studentId === params.studentId);
  }
  if (params.teacherId) {
    filtered = filtered.filter((s) => s.teacherId === params.teacherId);
  }
  if (params.status) {
    filtered = filtered.filter((s) => s.status === params.status);
  }
  if (params.periodFrom) {
    filtered = filtered.filter((s) => s.periodFrom >= params.periodFrom!);
  }
  if (params.periodTo) {
    filtered = filtered.filter((s) => s.periodTo <= params.periodTo!);
  }

  // Simple pagination
  const page = params.page || 1;
  const size = params.size || 20;
  const start = (page - 1) * size;
  const end = start + size;

  return filtered.slice(start, end);
}

/**
 * 그룹별 청구서 미리보기 생성 (S-028: 청구서 생성)
 *
 * 실제 저장하지 않고 미리보기만 생성합니다.
 *
 * @param groupId - 그룹 ID
 * @param params.month - 정산 월 (YYYY-MM)
 * @returns 미리보기 정산서 목록
 */
export async function generateGroupBillingPreview(
  groupId: string,
  params: { month: string }
): Promise<BillingStatement[]> {
  // TODO(F-006): POST /api/v1/billing/groups/{groupId}/preview
  await delay(500);

  // Mock: 해당 그룹의 학생들에 대한 정산서 생성
  const summary = getMockGroupBillingSummary(groupId, params.month);
  if (!summary) {
    return [];
  }

  return mockBillingStatements.filter(
    (s) => s.groupId === groupId && s.periodFrom.startsWith(params.month)
  );
}

/**
 * 청구서 생성 (선생님)
 *
 * @param payload - 청구서 생성 요청
 * @returns 생성된 청구서
 */
export async function createBillingStatement(
  payload: CreateBillingStatementPayload
): Promise<BillingStatement> {
  // TODO(F-006): POST /api/v1/billing/statements
  await delay(500);

  // Mock: 첫 번째 목업 정산서 반환
  const newStatement: BillingStatement = {
    ...mockBillingStatements[0],
    id: `statement-${Date.now()}`,
    statementNumber: `TUT-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    groupId: payload.groupId,
    studentId: payload.studentId,
    periodFrom: payload.periodFrom,
    periodTo: payload.periodTo,
    status: 'DRAFT',
    memo: payload.memo,
    teacherMemo: payload.teacherMemo,
    createdAt: new Date().toISOString(),
  };

  return newStatement;
}

/**
 * 청구서 발송 (선생님)
 *
 * @param payload - 발송 요청
 * @returns 발송된 청구서
 */
export async function issueBillingStatement(
  payload: IssueBillingStatementPayload
): Promise<BillingStatement> {
  // TODO(F-006): POST /api/v1/billing/statements/{statementId}/issue
  await delay(500);

  const statement = getMockBillingStatementById(payload.statementId);
  if (!statement) {
    throw new Error('정산서를 찾을 수 없습니다');
  }

  return {
    ...statement,
    status: 'ISSUED',
    issuedAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 청구서 상태 업데이트 (선생님)
 *
 * @param payload - 상태 업데이트 요청
 * @returns 업데이트된 청구서
 */
export async function updateBillingStatus(
  payload: UpdateBillingStatusPayload
): Promise<BillingStatement> {
  // TODO(F-006): PATCH /api/v1/billing/statements/{statementId}/status
  await delay(300);

  const statement = getMockBillingStatementById(payload.statementId);
  if (!statement) {
    throw new Error('정산서를 찾을 수 없습니다');
  }

  return {
    ...statement,
    status: payload.status,
    memo: payload.memo || statement.memo,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 결제 요청 (학부모)
 *
 * @param payload - 결제 요청
 * @returns 결제 정보
 */
export async function createPayment(
  payload: CreatePaymentPayload
): Promise<PaymentInfo> {
  // TODO(F-006): POST /api/v1/billing/payments
  // 실제로는 토스페이먼츠 등 PG사 연동 필요
  await delay(1000);

  const paymentInfo: PaymentInfo = {
    paymentId: `payment-${Date.now()}`,
    statementId: payload.statementId,
    statementNumber: 'TUT-2025-001', // Mock
    amount: payload.amount,
    paymentType: payload.paymentType,
    paymentKey: payload.paymentKey,
    orderId: payload.orderId,
    transactionId: `txn-${Date.now()}`,
    status: 'COMPLETED',
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return paymentInfo;
}

/**
 * 영수증 조회 (S-032: 영수증 상세)
 *
 * @param statementId - 정산서 ID
 * @returns 영수증 정보
 */
export async function fetchReceipt(statementId: string): Promise<Receipt> {
  // TODO(F-006): GET /api/v1/billing/receipts/{statementId}
  await delay(300);

  const receipt = getMockReceipt(statementId);
  if (!receipt) {
    throw new Error('영수증을 찾을 수 없습니다');
  }

  return receipt;
}

/**
 * 정산 통계 조회 (S-033: 정산 통계)
 *
 * @param params.from - 시작일 (YYYY-MM-DD)
 * @param params.to - 종료일 (YYYY-MM-DD)
 * @returns 정산 통계
 */
export async function fetchBillingStatistics(params: {
  from: string;
  to: string;
}): Promise<BillingStatistics> {
  // TODO(F-006): GET /api/v1/billing/statistics?from={from}&to={to}
  await delay(500);

  return mockBillingStatistics;
}

/**
 * 월별 수입 차트 데이터 조회 (S-033)
 *
 * @param teacherId - 선생님 ID
 * @param params.months - 조회할 월 개수 (기본: 6개월)
 * @returns 월별 수입 차트 데이터
 */
export async function fetchMonthlyRevenueChart(
  teacherId: string,
  params?: { months?: number }
): Promise<MonthlyRevenueChart> {
  // TODO(F-006): GET /api/v1/billing/charts/monthly-revenue
  await delay(300);

  return mockMonthlyRevenueChart;
}

/**
 * 영수증 PDF 다운로드 URL 생성
 *
 * @param statementId - 정산서 ID
 * @returns PDF 다운로드 URL
 */
export function getReceiptPdfUrl(statementId: string): string {
  // TODO(F-006): /api/v1/billing/receipts/{statementId}/pdf
  return `/api/v1/billing/receipts/${statementId}/pdf`;
}

/**
 * 청구서 삭제 (선생님, DRAFT 상태만 가능)
 *
 * @param statementId - 정산서 ID
 */
export async function deleteBillingStatement(
  statementId: string
): Promise<void> {
  // TODO(F-006): DELETE /api/v1/billing/statements/{statementId}
  await delay(300);

  const statement = getMockBillingStatementById(statementId);
  if (!statement) {
    throw new Error('정산서를 찾을 수 없습니다');
  }

  if (statement.status !== 'DRAFT') {
    throw new Error('발행된 정산서는 삭제할 수 없습니다');
  }

  // Mock: 실제로는 아무것도 하지 않음
}
