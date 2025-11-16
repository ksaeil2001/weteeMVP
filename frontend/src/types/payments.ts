// Step 8: 정산 관리 타입 기본 정의
// TODO: 현재는 mock 데이터 및 UI 레벨에서만 사용, 추후 API 타입으로 확장 예정

/**
 * 정산/결제 상태
 * - paid: 결제 완료 (완납)
 * - pending: 결제 대기 (미납)
 * - overdue: 연체
 * - cancelled: 취소
 */
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

/**
 * 정산 요약 통계
 * 특정 기간(예: 이번 달)의 정산 집계 정보
 */
export interface PaymentSummaryStats {
  /** 전체 청구 금액 합계 (원 단위) */
  totalAmount: number;
  /** 결제 완료 금액 합계 (원 단위) */
  paidAmount: number;
  /** 미결제(대기) 금액 합계 (원 단위) */
  pendingAmount: number;
  /** 연체 금액 합계 (원 단위) */
  overdueAmount: number;
  /** 취소 금액 합계 (원 단위) */
  cancelledAmount: number;
}

/**
 * 결제/청구 내역 항목
 */
export interface PaymentHistoryItem {
  /** 결제/청구 고유 ID */
  id: string;
  /** 결제/청구 날짜 (YYYY-MM-DD) */
  date: string;
  /** 학생 이름 */
  studentName: string;
  /** 그룹(과외반) 이름 */
  groupName: string;
  /** 금액 (원 단위) */
  amount: number;
  /** 결제 상태 */
  status: PaymentStatus;
  /** 결제 방법 (예: '계좌이체', '카드', '현금') */
  method: string;
  /** 선택 메모 */
  memo?: string;
}

// TODO: 추후 확장 가능 타입들
// - PaymentFilterOptions (학생/그룹/기간별 필터링)
// - PaymentListResponse (pagination 지원)
// - MonthlyPaymentSummary (월별 요약)
// - InvoiceDetail (청구서 상세)
