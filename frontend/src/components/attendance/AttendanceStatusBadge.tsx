// Step 7: 출결 상태 배지 공통 컴포넌트

import React from 'react';
import type { AttendanceStatus } from '@/types/attendance';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  label?: string;       // 기본값은 status에 대응하는 한글 라벨
  className?: string;   // 추가 Tailwind 클래스
}

const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  // 상태별 기본 라벨 및 스타일 매핑
  const statusConfig: Record<AttendanceStatus, { label: string; colorClass: string }> = {
    PRESENT: {
      label: '출석',
      colorClass: 'bg-green-100 text-green-700',
    },
    LATE: {
      label: '지각',
      colorClass: 'bg-yellow-100 text-yellow-700',
    },
    ABSENT: {
      label: '결석',
      colorClass: 'bg-red-100 text-red-700',
    },
  };

  const config = statusConfig[status];
  const displayLabel = label || config.label;

  const baseClassName =
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';

  return (
    <span className={`${baseClassName} ${config.colorClass} ${className}`}>
      {displayLabel}
    </span>
  );
};

export default AttendanceStatusBadge;
