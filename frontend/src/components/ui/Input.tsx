/**
 * Input Component - WeTee MVP
 * Screen Reference: Used in S-003, S-004, S-022, S-028, and more
 * Based on: UX_UI_설계서.md Section 5.1 (공통 UI 컴포넌트)
 *
 * Types:
 * - text: Regular text input
 * - email: Email input with validation
 * - password: Password input with show/hide toggle
 * - number: Numeric input
 * - textarea: Multi-line text input (for lesson records, notes)
 *
 * Features:
 * - Validation states (error, success)
 * - Character counter (for textarea)
 * - Placeholder text
 * - Label support
 * - Password visibility toggle
 * - Real-time email validation
 */

import React, { useState } from 'react';

export interface InputProps {
  /**
   * Input type
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';

  /**
   * Input value (controlled)
   */
  value: string;

  /**
   * Change handler
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Label text
   */
  label?: string;

  /**
   * Error message (shows red border and message)
   */
  error?: string;

  /**
   * Success state (shows green border and checkmark)
   */
  success?: boolean;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Required field
   */
  required?: boolean;

  /**
   * Maximum length
   */
  maxLength?: number;

  /**
   * Show character counter (for textarea)
   */
  showCounter?: boolean;

  /**
   * Textarea: number of rows
   */
  rows?: number;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Helper text (shown below input)
   */
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  success = false,
  disabled = false,
  required = false,
  maxLength,
  showCounter = false,
  rows = 3,
  className = '',
  helperText,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const isTextarea = type === 'textarea';
  const isPassword = type === 'password';
  const isEmail = type === 'email';

  // Email validation regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;

    // Check max length
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    // Real-time email validation
    if (isEmail && newValue) {
      if (!validateEmail(newValue)) {
        setEmailError('올바른 이메일 형식을 입력해주세요');
      } else {
        setEmailError('');
      }
    }

    onChange(newValue);
  };

  // Base input styles with design tokens
  const baseInputStyles = 'w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2';

  // Border and state styles
  let borderStyles = 'border-gray-300 focus:border-blue-500 focus:ring-blue-200';

  if (error || emailError) {
    borderStyles = 'border-red-500 focus:border-red-500 focus:ring-red-200';
  } else if (success) {
    borderStyles = 'border-green-500 focus:border-green-500 focus:ring-green-200';
  }

  if (disabled) {
    borderStyles = 'border-gray-200 bg-gray-50 cursor-not-allowed';
  }

  const inputStyles = `${baseInputStyles} ${borderStyles}`;

  // Determine actual input type (for password toggle)
  const actualType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper (for password toggle icon positioning) */}
      <div className="relative">
        {isTextarea ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            className={inputStyles}
          />
        ) : (
          <input
            type={actualType}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={inputStyles}
          />
        )}

        {/* Password toggle button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              // Eye slash icon (hide password)
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              // Eye icon (show password)
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}

        {/* Success checkmark icon */}
        {success && !error && !emailError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Error message */}
      {(error || emailError) && (
        <p className="mt-2 text-sm text-red-500">
          {error || emailError}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && !emailError && (
        <p className="mt-2 text-sm text-gray-600">
          {helperText}
        </p>
      )}

      {/* Character counter */}
      {showCounter && maxLength && (
        <p className="mt-2 text-sm text-gray-500 text-right">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
};

Input.displayName = 'Input';

export default Input;
