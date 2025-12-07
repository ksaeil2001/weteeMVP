/**
 * Billing API Client - WeTee MVP
 * Feature: F-006 수업료 정산
 *
 * 백엔드 F-006 정산 API와 실제 연동되는 클라이언트
 * Related: API_명세서.md 6.6, backend/app/routers/settlements.py
 */

import type {
  BillingStatement,
  // BillingStatus,
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

import { apiRequest } from '@/lib/apiClient';

/**
 * Pagination Info
 */
interface PaginationInfo {
  page?: number;
  size?: number;
  total?: number;
  total_pages?: number;
}

/**
 * 정산 개요 조회 (선생님용 대시보드 - S-027)
 *
 * 선생님이 이번 달 정산 현황을 한눈에 보기 위한 요약 정보 조회
 * 참고: 현재 백엔드에 전체 개요 엔드포인트가 없으므로 향후 추가 필요 (TODO)
 *
 * @param params.month - 조회 월 (YYYY-MM)
 * @returns 그룹별 정산 요약 목록
 */
export async function fetchBillingOverview(_params: {
  month: string;
}): Promise<GroupBillingSummary[]> {
  // TODO(v2): 백엔드에 /api/v1/settlements/overview 엔드포인트 추가
  // 현재는 임시로 빈 배열 반환
  return [];
}

/**
 * 선생님용 정산 대시보드 카드 목록 조회 (S-027)
 *
 * GET /api/v1/settlements/dashboard?year=YYYY&month=MM
 *
 * 각 그룹별 월간 정산 요약을 카드 형태로 조회
 *
 * @param teacherId - 선생님 ID (현재는 사용하지 않음, JWT 토큰으로 자동 인증)
 * @param month - 조회 월 (YYYY-MM)
 * @returns 학생별 정산 카드 목록
 */
export async function fetchBillingDashboard(
  _teacherId: string,
  month: string
): Promise<BillingDashboardCard[]> {
  try {
    // month: "2025-12" → year: 2025, month: 12
    const [year, monthNum] = month.split('-');

    const response = await apiRequest<{
      year: number;
      month: number;
      total_lessons: number;
      total_charged: number;
      total_paid: number;
      total_unpaid: number;
      total_students: number;
      paid_students: number;
      unpaid_students: number;
      students: Array<{
        student_id: string;
        student_name: string;
        group_id: string;
        group_name: string;
        expected_lessons: number;
        actual_lessons: number;
        total_lessons: number;
        amount_charged: number;
        amount_paid: number;
        payment_status: string;
        invoice_id?: string;
        invoice_number?: string;
        invoice_status?: string;
        issued_at?: string;
        has_warning: boolean;
        warning_message?: string;
      }>;
      monthly_comparison: Array<{
        year: number;
        month: number;
        total_lessons: number;
        total_charged: number;
        total_paid: number;
      }>;
    }>(`/settlements/dashboard?year=${parseInt(year)}&month=${parseInt(monthNum)}`);

    // 백엔드 응답 → 프론트엔드 BillingDashboardCard 타입 매핑
    return response.students.map((student) => {
      // 청구서 상태 매핑 (백엔드: DRAFT/SENT/PAID → 프론트엔드: BillingStatus)
      let status: BillingDashboardCard['status'] = 'DRAFT';
      if (student.invoice_status === 'PAID') {
        status = 'PAID';
      } else if (student.invoice_status === 'SENT') {
        status = 'ISSUED';
      } else if (student.invoice_status === 'DRAFT') {
        status = 'DRAFT';
      } else if (student.invoice_status === 'PARTIALLY_PAID') {
        status = 'ISSUED'; // 부분 결제는 발행됨으로 표시
      } else if (student.invoice_status === 'CANCELED') {
        status = 'CANCELED';
      }

      // 연체 판정 로직 (발행일로부터 30일 경과)
      // F-006: 청구서 발송 후 30일 경과 시 OVERDUE 상태로 변경
      if (student.issued_at && status === 'ISSUED') {
        try {
          const issuedDate = new Date(student.issued_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));

          // 30일 경과 && 아직 미결제 상태인 경우
          if (diffDays > 30 && student.amount_paid < student.amount_charged) {
            status = 'OVERDUE';
          }
        } catch (error) {
          console.warn('연체 판정 중 날짜 파싱 오류:', error);
          // 날짜 파싱 실패 시 기본 상태 유지
        }
      }

      return {
        groupId: student.group_id,
        groupName: student.group_name,
        studentId: student.student_id,
        studentName: student.student_name,
        month: month,
        expectedLessons: student.expected_lessons,
        actualLessons: student.actual_lessons,
        amount: student.amount_charged,
        status: status,
        hasWarning: student.has_warning,
        warningMessage: student.warning_message,
        statementId: student.invoice_id,
        issuedAt: student.issued_at,
      };
    });
  } catch (error: any) {
    console.error('정산 대시보드 조회 실패:', error);

    // 에러 타입별 상세 처리
    if (error?.response) {
      // HTTP 에러 응답이 있는 경우
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 401) {
        // 인증 실패 - 로그인 필요
        throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
      } else if (status === 403) {
        // 권한 없음 - 선생님 계정이 아님
        throw new Error('정산 대시보드는 선생님 계정만 접근할 수 있습니다.');
      } else if (status === 404) {
        // 리소스 없음
        throw new Error('정산 정보를 찾을 수 없습니다.');
      } else if (status >= 500) {
        // 서버 오류
        throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        // 기타 HTTP 에러
        const message = detail?.message || '정산 대시보드를 불러올 수 없습니다.';
        throw new Error(message);
      }
    } else if (error?.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우 (네트워크 오류)
      throw new Error('네트워크 연결을 확인해주세요. 인터넷 연결이 불안정합니다.');
    } else {
      // 요청 설정 중 오류 발생
      throw new Error(error?.message || '정산 대시보드를 불러오는 중 오류가 발생했습니다.');
    }
  }
}

/**
 * 그룹별 정산 요약 조회 (S-041: 그룹별 정산 상세)
 *
 * GET /api/v1/settlements/groups/{group_id}/summary?year=YYYY&month=MM
 *
 * 특정 그룹의 월별 정산 요약 (학생별 실제 수업 횟수, 청구 금액 등)
 *
 * @param groupId - 그룹 ID
 * @param params.month - 조회 월 (YYYY-MM)
 * @returns 그룹별 정산 요약
 */
export async function fetchGroupBillingSummary(
  _groupId: string,
  params: { month: string }
): Promise<GroupBillingSummary> {
  const [year, month] = params.month.split('-');

  return apiRequest<GroupBillingSummary>(
    `/settlements/groups/${_groupId}/summary?year=${year}&month=${month}`
  );
}

/**
 * 정산서 ID로 조회 (S-029: 청구서 상세)
 *
 * GET /api/v1/invoices/{invoice_id}
 *
 * @param statementId - 정산서 ID
 * @returns 정산서 상세 정보
 */
export async function fetchBillingStatementById(
  statementId: string
): Promise<BillingStatement> {
  return apiRequest<BillingStatement>(`/invoices/${statementId}`);
}

/**
 * 정산서 번호로 조회
 *
 * 참고: 현재 백엔드에 이 엔드포인트가 없으므로 향후 추가 필요
 *
 * @param statementNumber - 정산서 번호 (예: TUT-2025-001)
 * @returns 정산서 상세 정보
 */
export async function fetchBillingStatementByNumber(
  _statementNumber: string
): Promise<BillingStatement> {
  // TODO(v2): 백엔드에 /api/v1/invoices/by-number/{statementNumber} 엔드포인트 추가
  throw new Error('Not implemented');
}

/**
 * 학생별 정산 요약 조회 (S-043: 학생/학부모용 청구 내역)
 *
 * 참고: 현재 백엔드에 이 엔드포인트가 없으므로 향후 추가 필요
 *
 * @param studentId - 학생 ID
 * @param params.month - 조회 월 (YYYY-MM)
 * @returns 학생별 정산 요약
 */
export async function fetchStudentBillingSummary(
  _studentId: string,
  _params: { month: string }
): Promise<StudentBillingSummary> {
  // TODO(v2): 백엔드에 /api/v1/settlements/students/{studentId} 엔드포인트 추가
  throw new Error('Not implemented');
}

/**
 * 정산서 목록 조회
 *
 * 참고: 현재 백엔드에 이 엔드포인트가 없으므로 향후 추가 필요
 *
 * @param params - 필터 파라미터
 * @returns 정산서 목록
 */
export async function fetchBillingStatements(
  _params: BillingListParams
): Promise<BillingStatement[]> {
  // TODO(v2): 백엔드에 /api/v1/invoices 엔드포인트 추가
  throw new Error('Not implemented');
}

/**
 * 그룹별 청구서 미리보기 생성 (S-028: 청구서 생성)
 *
 * 참고: 현재 백엔드에 미리보기 엔드포인트가 없음
 * 대신 실제 청구서를 생성하고 필요시 취소할 수 있음
 *
 * @param groupId - 그룹 ID
 * @param params.month - 정산 월 (YYYY-MM)
 * @returns 미리보기 정산서 목록
 */
export async function generateGroupBillingPreview(
  _groupId: string,
  _params: { month: string }
): Promise<BillingStatement[]> {
  // TODO(v2): 백엔드에 미리보기 생성 엔드포인트 추가
  return [];
}

/**
 * 청구서 생성 (선생님)
 *
 * POST /api/v1/settlements/groups/{group_id}/invoices
 *
 * 특정 그룹의 특정 학생에 대한 월별 청구서 생성
 * 이미 청구서가 있으면 기존 것을 CANCELED 처리 후 새로 생성
 *
 * @param payload - 청구서 생성 요청
 * @returns 생성된 청구서
 */
export async function createBillingStatement(
  payload: CreateBillingStatementPayload
): Promise<BillingStatement> {
  return apiRequest<BillingStatement>(
    `/settlements/groups/${payload.groupId}/invoices`,
    {
      method: 'POST',
      body: JSON.stringify({
        year: payload.periodFrom.split('-')[0],
        month: parseInt(payload.periodFrom.split('-')[1]),
        student_id: payload.studentId,
        billing_type: 'POSTPAID', // TODO: 실제 값으로 설정
      }),
    }
  );
}

/**
 * 청구서 발송 (선생님)
 *
 * POST /api/v1/invoices/{invoice_id}/send
 *
 * 청구서 상태를 DRAFT → SENT로 변경하고 학부모/학생에게 알림 발송
 *
 * @param payload - 발송 요청
 * @returns 발송된 청구서
 */
export async function issueBillingStatement(
  payload: IssueBillingStatementPayload
): Promise<BillingStatement> {
  return apiRequest<BillingStatement>(
    `/invoices/${payload.statementId}/send`,
    {
      method: 'POST',
    }
  );
}

/**
 * 청구서 상태 업데이트 (선생님)
 *
 * 참고: 현재 백엔드에 이 엔드포인트가 없음
 * 청구서 발송(send)과 취소(cancel)만 지원
 *
 * @param payload - 상태 업데이트 요청
 * @returns 업데이트된 청구서
 */
export async function updateBillingStatus(
  _payload: UpdateBillingStatusPayload
): Promise<BillingStatement> {
  // TODO(v2): 백엔드에 PATCH /api/v1/invoices/{invoice_id}/status 엔드포인트 추가
  throw new Error('Not implemented');
}

/**
 * 결제 요청 (학부모)
 *
 * 참고: 현재 백엔드에 결제 엔드포인트가 아직 PG사 연동 대기 중
 *
 * @param payload - 결제 요청
 * @returns 결제 정보
 */
export async function createPayment(
  _payload: CreatePaymentPayload
): Promise<PaymentInfo> {
  // TODO(v2): 토스페이먼츠 연동 후 POST /api/v1/payments 구현
  throw new Error('Not implemented - PG integration pending');
}

/**
 * 영수증 조회 (S-032: 영수증 상세)
 *
 * 참고: 현재 백엔드에 이 엔드포인트가 없음
 *
 * @param statementId - 정산서 ID
 * @returns 영수증 정보
 */
export async function fetchReceipt(_statementId: string): Promise<Receipt> {
  // TODO(v2): 백엔드에 /api/v1/invoices/{invoice_id}/receipt 엔드포인트 추가
  throw new Error('Not implemented');
}

/**
 * 정산 통계 조회 (S-033: 정산 통계)
 *
 * 참고: 현재 백엔드에 이 엔드포인트가 없음
 *
 * @param params.from - 시작일 (YYYY-MM-DD)
 * @param params.to - 종료일 (YYYY-MM-DD)
 * @returns 정산 통계
 */
export async function fetchBillingStatistics(_params: {
  from: string;
  to: string;
}): Promise<BillingStatistics> {
  // TODO(v2): 백엔드에 통계 엔드포인트 추가
  throw new Error('Not implemented');
}

/**
 * 월별 수입 차트 데이터 조회 (S-033)
 *
 * 참고: 현재 백엔드에 이 엔드포인트가 없음
 *
 * @param teacherId - 선생님 ID
 * @param params.months - 조회할 월 개수 (기본: 6개월)
 * @returns 월별 수입 차트 데이터
 */
export async function fetchMonthlyRevenueChart(
  _teacherId: string,
  _params?: { months?: number }
): Promise<MonthlyRevenueChart> {
  // TODO(v2): 백엔드에 차트 엔드포인트 추가
  throw new Error('Not implemented');
}

/**
 * 영수증 PDF 다운로드 URL 생성
 *
 * 참고: 현재 백엔드에 이 엔드포인트가 없음
 *
 * @param statementId - 정산서 ID
 * @returns PDF 다운로드 URL
 */
export function getReceiptPdfUrl(statementId: string): string {
  // TODO(v2): 백엔드에 PDF 생성 엔드포인트 추가
  return `/api/v1/invoices/${statementId}/receipt/pdf`;
}

/**
 * 청구서 취소 (선생님)
 *
 * POST /api/v1/invoices/{invoice_id}/cancel
 *
 * 청구서 상태를 CANCELED로 변경
 * DRAFT 또는 SENT 상태에서만 취소 가능
 *
 * @param statementId - 정산서 ID
 * @param reason - 취소 사유 (선택)
 */
export async function deleteBillingStatement(
  statementId: string,
  reason?: string
): Promise<void> {
  const url = new URL(`http://localhost/invoices/${statementId}/cancel`);
  if (reason) {
    url.searchParams.set('reason', reason);
  }

  await apiRequest<void>(`/invoices/${statementId}/cancel?${reason ? `reason=${reason}` : ''}`, {
    method: 'POST',
  });
}

/**
 * 수동 결제 확인 (현금 등 - 선생님)
 *
 * POST /api/v1/invoices/{invoice_id}/payments
 *
 * 현금 수령 등 수동 결제 확인
 *
 * @param invoiceId - 청구서 ID
 * @param method - 결제 수단 (CASH 등)
 * @param amount - 결제 금액
 * @param memo - 결제 메모 (선택)
 */
export async function confirmManualPayment(
  invoiceId: string,
  method: string,
  amount: number,
  memo?: string
): Promise<PaymentInfo> {
  return apiRequest<PaymentInfo>(
    `/invoices/${invoiceId}/payments`,
    {
      method: 'POST',
      body: JSON.stringify({
        method,
        amount,
        memo,
      }),
    }
  );
}

/**
 * 그룹별 청구서 목록 조회
 *
 * GET /api/v1/settlements/groups/{group_id}/invoices?year=YYYY&month=MM&status=PAID&page=1&size=20
 *
 * 특정 그룹의 청구서 목록 조회 (필터링, 페이징)
 *
 * @param groupId - 그룹 ID
 * @param year - 필터: 연도 (선택)
 * @param month - 필터: 월 (선택)
 * @param status - 필터: 상태 (선택)
 * @param page - 페이지 번호
 * @param size - 페이지 크기
 */
export async function fetchGroupInvoices(
  _groupId: string,
  year?: number,
  month?: number,
  status?: string,
  page: number = 1,
  size: number = 20
): Promise<{ items: BillingStatement[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams();
  if (year) params.set('year', year.toString());
  if (month) params.set('month', month.toString());
  if (status) params.set('status', status);
  params.set('page', page.toString());
  params.set('size', size.toString());

  return apiRequest<{ items: BillingStatement[]; pagination: PaginationInfo }>(
    `/settlements/groups/${_groupId}/invoices?${params.toString()}`
  );
}
