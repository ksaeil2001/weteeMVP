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
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'ghost' | 'danger';

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
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
  icon,
}) => {
  // Base styles: rounded corners, font weight, transition
  const baseStyles = 'rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';

  // Size styles (height based on UX_UI design system)
  const sizeStyles = {
    small: 'h-10 px-4 text-sm',      // 40px height
    medium: 'h-12 px-5 text-base',   // 48px height
    large: 'h-14 px-6 text-base',    // 56px height
  };

  // Variant styles (colors based on design system)
  const variantStyles = {
    primary: disabled || loading
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-500 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: disabled || loading
      ? 'bg-transparent border border-gray-300 text-gray-400 cursor-not-allowed'
      : 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50 active:bg-blue-100',
    outline: disabled || loading
      ? 'bg-transparent border border-gray-300 text-gray-400 cursor-not-allowed'
      : 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50 active:bg-blue-100',
    text: disabled || loading
      ? 'bg-transparent text-gray-400 cursor-not-allowed'
      : 'bg-transparent text-blue-500 hover:bg-blue-50 active:bg-blue-100',
    ghost: disabled || loading
      ? 'bg-transparent text-gray-400 cursor-not-allowed'
      : 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    danger: disabled || loading
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  };

  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedStyles}
    >
      {loading ? (
        <>
          {/* Loading spinner (SVG) */}
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex items-center">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

Button.displayName = 'Button';

export default Button;
