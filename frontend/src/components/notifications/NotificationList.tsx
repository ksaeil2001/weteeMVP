// Step 9: 알림 리스트 컴포넌트

import React from 'react';
import type { NotificationItem } from '@/types/notifications';
import NotificationStatusBadge from './NotificationStatusBadge';

interface NotificationListProps {
  items: NotificationItem[];
}

/**
 * NotificationList
 *
 * NotificationItem[] 을 받아서 알림 리스트를 렌더링하는 컴포넌트
 *
 * @param items - 알림 항목 배열
 */
const NotificationList: React.FC<NotificationListProps> = ({ items }) => {
  /**
   * ISO 날짜 문자열을 사람이 읽기 좋은 형식으로 변환
   * @param isoString - ISO 8601 형식의 날짜 문자열
   * @returns 'YYYY-MM-DD HH:MM' 형식의 날짜 문자열
   */
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  /**
   * 카테고리를 한글 라벨로 변환
   */
  const getCategoryLabel = (
    category: NotificationItem['category']
  ): string => {
    const categoryLabels: Record<string, string> = {
      payment: '정산',
      attendance: '출결',
      schedule: '일정',
      system: '시스템',
    };
    return categoryLabels[category] || category;
  };

  /**
   * 카테고리별 색상 스타일
   */
  const getCategoryStyle = (
    category: NotificationItem['category']
  ): string => {
    const categoryStyles: Record<string, string> = {
      payment: 'bg-green-100 text-green-700',
      attendance: 'bg-yellow-100 text-yellow-700',
      schedule: 'bg-purple-100 text-purple-700',
      system: 'bg-gray-100 text-gray-700',
    };
    return categoryStyles[category] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="divide-y divide-gray-200">
      {items.map((item) => (
        <div
          key={item.notification_id}
          className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-start justify-between"
        >
          {/* 좌측 영역 */}
          <div className="flex-1 space-y-2">
            {/* 날짜/시간 */}
            <div className="text-xs text-gray-500">
              {formatDate(item.created_at)}
            </div>

            {/* 제목 */}
            <h3 className="text-sm font-semibold text-gray-900">
              {item.title}
            </h3>

            {/* 메시지 내용 */}
            <p className="text-sm text-gray-700 line-clamp-2">
              {item.message}
            </p>

            {/* 관련 정보 (리소스) */}
            {item.related_resource && (
              <div className="text-xs text-gray-500">
                {/* TODO: related_resource.type을 기반으로 상세 정보 표시 */}
                관련 리소스: {item.related_resource.type}
              </div>
            )}

            {/* 카테고리 및 상태 배지 */}
            <div className="flex items-center gap-2">
              {/* 카테고리 배지 */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(
                  item.category
                )}`}
              >
                {getCategoryLabel(item.category)}
              </span>

              {/* 상태 배지 */}
              <NotificationStatusBadge status={item.status} />
            </div>
          </div>

          {/* 우측 영역 - 상세 보기 버튼 */}
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
            >
              상세 보기 →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
