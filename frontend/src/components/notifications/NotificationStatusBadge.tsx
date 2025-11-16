// Step 9: 알림 상태 배지 공통 컴포넌트

import React from 'react';
import type { NotificationStatus } from '@/types/notifications';

interface NotificationStatusBadgeProps {
  status: NotificationStatus;
  label?: string;   // 기본값은 status에 대응하는 한글 라벨
  className?: string; // 추가 Tailwind 클래스
}

/**
 * NotificationStatusBadge
 *
 * 알림 상태(읽지 않음/읽음)를 색상과 라벨로 표현하는 공통 Badge 컴포넌트
 *
 * @param status - 알림 상태 ('unread' | 'read')
 * @param label - 커스텀 라벨 (기본값: status에 따른 한글 라벨)
 * @param className - 추가 Tailwind 클래스
 */
const NotificationStatusBadge: React.FC<NotificationStatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const baseClassName =
    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';

  // 상태별 스타일 및 기본 라벨 매핑
  const statusConfig: Record<
    NotificationStatus,
    { style: string; defaultLabel: string }
  > = {
    unread: {
      style: 'bg-blue-100 text-blue-700',
      defaultLabel: '읽지 않음',
    },
    read: {
      style: 'bg-gray-100 text-gray-700',
      defaultLabel: '읽음',
    },
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <span className={`${baseClassName} ${config.style} ${className}`}>
      {displayLabel}
    </span>
  );
};

export default NotificationStatusBadge;
