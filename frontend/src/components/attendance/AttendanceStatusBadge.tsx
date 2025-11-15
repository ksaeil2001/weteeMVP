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
    present: {
      label: '출석',
      colorClass: 'bg-green-100 text-green-700',
    },
    late: {
      label: '지각',
      colorClass: 'bg-yellow-100 text-yellow-700',
    },
    absent: {
      label: '결석',
      colorClass: 'bg-red-100 text-red-700',
    },
    makeup: {
      label: '보강',
      colorClass: 'bg-purple-100 text-purple-700',
    },
    excused: {
      label: '공결',
      colorClass: 'bg-gray-100 text-gray-700',
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
