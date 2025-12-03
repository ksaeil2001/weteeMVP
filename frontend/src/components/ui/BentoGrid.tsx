/**
 * BentoGrid Component
 * Based on: DESIGN_STYLE_GUIDE.md Section 2.1
 *
 * A responsive grid layout for Bento cards.
 * Inspired by Japanese bento boxes and Apple's widget grid.
 *
 * Features:
 * - Responsive columns (1 on mobile, 2 on tablet, 3 on desktop)
 * - Consistent gaps between cards
 * - Support for different card sizes (span multiple columns/rows)
 */

import React from 'react';

export interface BentoGridProps {
  /**
   * Grid items (BentoCard components)
   */
  children: React.ReactNode;

  /**
   * Number of columns on desktop
   * @default 3
   */
  cols?: 1 | 2 | 3 | 4;

  /**
   * Gap between cards
   * @default 'medium'
   */
  gap?: 'small' | 'medium' | 'large';

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  children,
  cols = 3,
  gap = 'medium',
  className = '',
}) => {
  // Column configuration
  const colsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }[cols];

  // Gap configuration
  const gapClass = {
    small: 'gap-4',     // 16px
    medium: 'gap-6',    // 24px - default
    large: 'gap-8',     // 32px
  }[gap];

  return (
    <div className={`grid grid-cols-1 ${colsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

BentoGrid.displayName = 'BentoGrid';

export default BentoGrid;
