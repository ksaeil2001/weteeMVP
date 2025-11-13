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
  variant: _variant = 'default',
  children,
  onClick,
  className = '',
  padding: _padding = 'medium',
  highlighted: _highlighted = false,
}) => {
  // TODO: Implement card styles based on variant
  // TODO: Add hover/press effects for clickable cards
  // TODO: Apply design tokens (border-radius: 12pt, shadow-2 for elevated)
  // TODO: Add left border (4pt blue) for highlighted cards

  const baseStyles = 'card'; // Placeholder
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${className}`}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {children}
    </div>
  );
};

Card.displayName = 'Card';

export default Card;
