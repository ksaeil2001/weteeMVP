/**
 * PageHeader Component - WeTee MVP
 * Step 6: 기능 페이지 상단 공통 헤더 컴포넌트
 *
 * 역할:
 * - 각 기능 페이지(그룹 관리, 수업 일정, 수업 기록 등)의 상단 헤더
 * - 제목, 설명, 우측 액션 버튼 영역 제공
 *
 * Props:
 * - title: 페이지 제목 (필수)
 * - subtitle: 페이지 설명 (선택)
 * - actions: 우측 상단 버튼 영역 (선택, React.ReactNode)
 *
 * 사용 예시:
 * <PageHeader
 *   title="그룹 관리"
 *   subtitle="현재 운영 중인 과외 그룹을 한눈에 보고 관리합니다."
 *   actions={<button>+ 새 그룹 만들기</button>}
 * />
 */

import React from 'react';

interface PageHeaderProps {
  /** 페이지 제목 */
  title: string;
  /** 페이지 설명 (선택) */
  subtitle?: string;
  /** 우측 상단 액션 버튼 영역 (선택) */
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      {/* 좌측: 제목 + 설명 */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
      </div>

      {/* 우측: 액션 버튼 영역 */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

PageHeader.displayName = 'PageHeader';

export default PageHeader;
