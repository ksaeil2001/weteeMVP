/**
 * Button Component - WeTee MVP
 * Screen Reference: Used across all screens
 * Based on: UX_UI_설계서.md Section 5.1 (공통 UI 컴포넌트)
 *
 * Variants:
 * - primary: Main actions (login, save) - Blue background
 * - secondary: Secondary actions (cancel, back) - Transparent with border
 * - text: Links, auxiliary actions - No background
 * - icon: Icon-only buttons (settings, more) - Icon only
 *
 * Sizes:
 * - small: 40px height
 * - medium: 48px height
 * - large: 56px height (default)
 */

import React from 'react';

export interface ButtonProps {
  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'text' | 'icon';

  /**
   * Button size
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Loading state (shows spinner)
   */
  loading?: boolean;

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * Click handler
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Button type (for forms)
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Icon (for icon variant or icon + text buttons)
   */
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant: _variant = 'primary',
  size: _size = 'large',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
  icon,
}) => {
  // TODO: Implement button styles based on variant and size
  // TODO: Add loading spinner when loading=true
  // TODO: Apply design tokens from design-tokens.css

  const baseStyles = 'button'; // Placeholder

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${className}`}
    >
      {loading ? 'Loading...' : (
        <>
          {icon && <span className="button-icon">{icon}</span>}
          <span className="button-text">{children}</span>
        </>
      )}
    </button>
  );
};

Button.displayName = 'Button';

export default Button;
