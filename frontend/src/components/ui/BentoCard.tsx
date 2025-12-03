/**
 * BentoCard Component
 * Based on: DESIGN_STYLE_GUIDE.md Section 6.1
 *
 * A card component with large rounded corners (40px) and soft shadows,
 * following the Bento Grid design pattern inspired by Apple's widget style.
 *
 * Features:
 * - Large border radius (rounded-bento / 2.5rem / 40px)
 * - Soft, natural shadows
 * - Interactive hover effects (optional)
 * - Multiple size variants
 * - Glassmorphism support (optional)
 */

import React from 'react';

export interface BentoCardProps {
  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Padding size
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Make card interactive with hover effects
   * @default false
   */
  interactive?: boolean;

  /**
   * Apply glassmorphism effect
   * @default false
   */
  glass?: boolean;

  /**
   * Click handler (makes card clickable)
   */
  onClick?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Background gradient (special styling)
   */
  gradient?: 'purple' | 'blue' | 'green' | 'none';

  /**
   * ARIA role
   */
  role?: string;

  /**
   * Data attribute for testing
   */
  'data-testid'?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  size = 'medium',
  interactive = false,
  glass = false,
  onClick,
  className = '',
  gradient = 'none',
  role,
  'data-testid': dataTestId,
}) => {
  const isClickable = !!onClick || interactive;

  // Base styles: large rounded corners + white background
  const baseStyles = 'rounded-bento transition-all duration-300 ease-smooth';

  // Background styles
  const backgroundStyles = glass
    ? 'bg-white/60 backdrop-blur-lg border border-white/20'
    : 'bg-white';

  // Gradient backgrounds
  const gradientStyles = {
    none: '',
    purple: 'bg-gradient-to-br from-purple-50 to-blue-50',
    blue: 'bg-gradient-to-br from-blue-50 to-primary-50',
    green: 'bg-gradient-to-br from-green-50 to-emerald-50',
  };

  // Size (padding) variants
  const sizeStyles = {
    small: 'p-4',     // 16px
    medium: 'p-6',    // 24px - default
    large: 'p-8',     // 32px
  };

  // Shadow styles
  const shadowStyles = glass ? 'shadow-xl' : 'shadow-bento';

  // Interactive/Clickable styles
  const interactiveStyles = isClickable
    ? `cursor-pointer hover:-translate-y-1 hover:shadow-bento-hover active:translate-y-0 active:shadow-bento-active focus:outline-none focus:ring-4 focus:ring-primary-200`
    : '';

  // Combine all styles
  const combinedClasses = [
    baseStyles,
    gradient === 'none' ? backgroundStyles : gradientStyles[gradient],
    sizeStyles[size],
    shadowStyles,
    interactiveStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={combinedClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={role || (isClickable ? 'button' : undefined)}
      tabIndex={isClickable ? 0 : undefined}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
};

BentoCard.displayName = 'BentoCard';

export default BentoCard;
