// Step 8: 정산 요약 카드 컴포넌트

import React from 'react';
import type { PaymentSummaryStats } from '@/types/payments';
import PaymentStatusBadge from './PaymentStatusBadge';

interface PaymentSummaryCardProps {
  /** 카드 제목 (예: "이번 달 정산 요약") */
  title: string;
  /** 정산 집계 데이터 */
  summary: PaymentSummaryStats;
}

/**
 * 정산 요약 정보를 카드 형태로 표시하는 컴포넌트
 *
 * 사용 예시:
 * ```tsx
 * <PaymentSummaryCard
 *   title="이번 달 정산 요약"
 *   summary={monthlyStats}
 * />
 * ```
 */
const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({ title, summary }) => {
  // 금액 포맷팅 함수 (원화)
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 카드 제목 */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>

      {/* 집계 항목 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 전체 금액 */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">전체 금액</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.totalAmount)}</p>
        </div>

        {/* 완납 금액 */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">완납 금액</span>
            <PaymentStatusBadge status="paid" />
          </div>
          <p className="text-2xl font-bold text-green-700">{formatAmount(summary.paidAmount)}</p>
        </div>

        {/* 미납 금액 */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">미납 금액</span>
            <PaymentStatusBadge status="pending" />
          </div>
          <p className="text-2xl font-bold text-yellow-700">{formatAmount(summary.pendingAmount)}</p>
        </div>

        {/* 연체 금액 */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">연체 금액</span>
            <PaymentStatusBadge status="overdue" />
          </div>
          <p className="text-2xl font-bold text-red-700">{formatAmount(summary.overdueAmount)}</p>
        </div>

        {/* 취소 금액 */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">취소 금액</span>
            <PaymentStatusBadge status="cancelled" />
          </div>
          <p className="text-2xl font-bold text-gray-700">{formatAmount(summary.cancelledAmount)}</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummaryCard;
