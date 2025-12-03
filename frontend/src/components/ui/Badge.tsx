/**
 * Badge Component - WeTee MVP v2.0
 * Based on: DESIGN_STYLE_GUIDE.md Section 6.4
 *
 * Small status indicators with rounded shapes.
 * Used for attendance status, payment status, notification badges, etc.
 *
 * Features:
 * - Multiple color variants (success, warning, error, info, default)
 * - Multiple sizes
 * - Optional icon support
 * - Fully rounded (pill shape)
 */

import React from 'react';

export interface BadgeProps {
  /**
   * Badge content
   */
  children: React.ReactNode;

  /**
   * Color variant
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';

  /**
   * Size
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Optional icon
   */
  icon?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Data attribute for testing
   */
  'data-testid'?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'medium',
  icon,
  className = '',
  'data-testid': dataTestId,
}) => {
  // Base styles: fully rounded, inline-flex
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full';

  // Size variants
  const sizeStyles = {
    small: 'px-2 py-0.5 text-xs',     // 12px text
    medium: 'px-3 py-1 text-sm',      // 14px text - default
    large: 'px-4 py-1.5 text-base',   // 16px text
  };

  // Color variants (based on DESIGN_STYLE_GUIDE.md)
  const variantStyles = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',   // 출석
    warning: 'bg-amber-100 text-amber-700',   // 지각
    error: 'bg-red-100 text-red-700',         // 결석
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',  // AI/Premium
  };

  const combinedClasses = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={combinedClasses} data-testid={dataTestId}>
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
