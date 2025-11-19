/**
 * Card Component - WeTee MVP
 * Screen Reference: Used across S-012, S-022, S-027, S-041, and more
 * Based on: UX_UI_설계서.md Section 5.1 (공통 UI 컴포넌트)
 *
 * Variants:
 * - default: Regular card with subtle border
 * - elevated: Card with shadow (shadow-2)
 * - outlined: Card with visible border
 *
 * Usage:
 * - Lesson cards in calendar view (S-012)
 * - Notification cards (S-041)
 * - Summary cards in payment/settlement screens (S-027, S-028)
 */

import React from 'react';

export interface CardProps {
  /**
   * Card variant
   */
  variant?: 'default' | 'elevated' | 'outlined';

  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Click handler (makes card clickable/tappable)
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Padding size (uses spacing tokens)
   */
  padding?: 'none' | 'small' | 'medium' | 'large';

  /**
   * Highlighted state (e.g., for unread notifications)
   */
  highlighted?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  onClick,
  className = '',
  padding = 'medium',
  highlighted = false,
}) => {
  const isClickable = !!onClick;

  // Base styles: background, rounded corners
  const baseStyles = 'bg-white rounded-xl transition-all duration-200';

  // Variant styles (shadow and border)
  const variantStyles = {
    default: 'border border-gray-200',
    elevated: 'shadow-md', // Level 2: 0 2px 8px rgba(0,0,0,0.15)
    outlined: 'border-2 border-gray-300',
  };

  // Padding styles (using design system spacing tokens)
  const paddingStyles = {
    none: 'p-0',
    small: 'p-2',      // 8pt (S)
    medium: 'p-4',     // 16pt (L) - default
    large: 'p-6',      // 24pt (XL)
  };

  // Hover/clickable styles
  const clickableStyles = isClickable
    ? 'cursor-pointer hover:bg-gray-50 hover:shadow-lg active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
    : '';

  // Highlighted state (blue left border for unread notifications)
  const highlightedStyles = highlighted
    ? 'border-l-4 border-l-blue-500'
    : '';

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${clickableStyles} ${highlightedStyles} ${className}`;

  return (
    <div
      onClick={onClick}
      className={combinedStyles}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';

export default Card;
