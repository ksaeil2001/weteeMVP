// Step 8: 정산 상태 배지 공통 컴포넌트

import React from 'react';
import type { PaymentStatus } from '@/types/payments';

interface PaymentStatusBadgeProps {
  /** 정산/결제 상태 */
  status: PaymentStatus;
  /** 커스텀 라벨 (지정하지 않으면 상태에 맞는 기본 한글 라벨 사용) */
  label?: string;
  /** 추가 Tailwind 클래스 */
  className?: string;
}

/**
 * 정산 상태를 색상과 라벨로 표현하는 Badge 컴포넌트
 *
 * 사용 예시:
 * ```tsx
 * <PaymentStatusBadge status="paid" />
 * <PaymentStatusBadge status="pending" label="결제 예정" />
 * ```
 */
const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  // 상태별 기본 라벨 매핑
  const defaultLabels: Record<PaymentStatus, string> = {
    paid: '완납',
    pending: '미납',
    overdue: '연체',
    cancelled: '취소',
  };

  // 상태별 색상 클래스 매핑
  const colorClasses: Record<PaymentStatus, string> = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
  };

  // 기본 스타일
  const baseClassName = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';

  // 최종 라벨 결정 (props.label 우선, 없으면 기본값)
  const displayLabel = label || defaultLabels[status];

  // 최종 className 조합
  const finalClassName = `${baseClassName} ${colorClasses[status]} ${className}`.trim();

  return (
    <span className={finalClassName}>
      {displayLabel}
    </span>
  );
};

export default PaymentStatusBadge;
