/**
 * Skeleton UI Component - WeTee MVP
 *
 * Based on: UX_UI_설계서.md Section 5.1 (로딩 인디케이터)
 *
 * 사용 사례:
 * - 콘텐츠 로딩 (1~3초)
 * - 카드/리스트 로딩 상태
 * - 스켈레톤 화면 구성
 *
 * Design System:
 * - 배경: Gray 100 (#F5F5F5)
 * - 애니메이션: pulse (명암 변화)
 * - 둥근 모서리: 4pt (작은 요소), 8pt (중간), 12pt (카드)
 */

import React from 'react';

interface SkeletonProps {
  /**
   * 스켈레톤 타입
   * - text: 텍스트 줄 (기본 높이 16px)
   * - title: 제목 (높이 24px)
   * - avatar: 원형 아바타
   * - button: 버튼 (높이 44px)
   * - card: 카드 (높이 자동, 패딩 포함)
   * - custom: 커스텀 (className으로 직접 지정)
   */
  variant?: 'text' | 'title' | 'avatar' | 'button' | 'card' | 'custom';

  /**
   * 너비 (기본: 100%)
   */
  width?: string | number;

  /**
   * 높이 (variant에 따라 기본값 다름)
   */
  height?: string | number;

  /**
   * 둥근 모서리 크기 (variant에 따라 기본값 다름)
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';

  /**
   * 추가 클래스명
   */
  className?: string;

  /**
   * 애니메이션 사용 여부 (기본: true)
   */
  animate?: boolean;
}

/**
 * Skeleton 컴포넌트
 */
export function Skeleton({
  variant = 'text',
  width = '100%',
  height,
  rounded,
  className = '',
  animate = true,
}: SkeletonProps) {
  // variant에 따른 기본 스타일
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          height: height || '16px',
          rounded: rounded || 'sm',
        };
      case 'title':
        return {
          height: height || '24px',
          rounded: rounded || 'sm',
        };
      case 'avatar':
        return {
          height: height || '48px',
          rounded: rounded || 'full',
        };
      case 'button':
        return {
          height: height || '44px',
          rounded: rounded || 'lg',
        };
      case 'card':
        return {
          height: height || '120px',
          rounded: rounded || 'lg',
        };
      case 'custom':
        return {
          height: height || 'auto',
          rounded: rounded || 'md',
        };
      default:
        return {
          height: height || '16px',
          rounded: rounded || 'sm',
        };
    }
  };

  const variantStyles = getVariantStyles();

  // 둥근 모서리 클래스
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }[variantStyles.rounded];

  // 애니메이션 클래스
  const animateClass = animate ? 'animate-pulse' : '';

  // 스타일 객체
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof variantStyles.height === 'number' ? `${variantStyles.height}px` : variantStyles.height,
  };

  return (
    <div
      className={`bg-gray-200 ${roundedClass} ${animateClass} ${className}`}
      style={style}
      role="status"
      aria-label="로딩 중"
    >
      <span className="sr-only">로딩 중...</span>
    </div>
  );
}

/**
 * 그룹 카드 스켈레톤 (재사용 컴포넌트)
 */
export function GroupCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3">
      {/* 그룹 이름 */}
      <Skeleton variant="title" width="60%" />

      {/* 과목 뱃지 */}
      <div className="flex gap-2">
        <Skeleton variant="button" width="80px" height="28px" />
        <Skeleton variant="button" width="60px" height="28px" />
      </div>

      {/* 그룹 정보 */}
      <div className="space-y-2">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" />
      </div>

      {/* 카드 하단 */}
      <div className="pt-4 border-t border-gray-200">
        <Skeleton variant="text" width="100px" />
      </div>
    </div>
  );
}

/**
 * 일정 카드 스켈레톤 (재사용 컴포넌트)
 */
export function ScheduleCardSkeleton() {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      {/* 시간 & 과목 */}
      <div className="flex items-center gap-3">
        <Skeleton variant="text" width="120px" />
        <Skeleton variant="button" width="80px" height="24px" />
        <Skeleton variant="button" width="50px" height="24px" />
      </div>

      {/* 학생 정보 */}
      <Skeleton variant="text" width="60%" />
    </div>
  );
}

/**
 * 리스트 아이템 스켈레톤 (재사용 컴포넌트)
 */
export function ListItemSkeleton() {
  return (
    <div className="p-3 border border-gray-200 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="text" width="120px" />
          <Skeleton variant="text" width="80px" />
        </div>
        <Skeleton variant="text" width="60px" />
      </div>
    </div>
  );
}

export default Skeleton;
