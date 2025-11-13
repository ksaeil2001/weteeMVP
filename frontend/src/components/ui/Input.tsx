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
 */

import React from 'react';

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
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  success: _success = false,
  disabled = false,
  required = false,
  maxLength,
  showCounter = false,
  rows = 3,
  className = '',
}) => {
  // TODO: Implement input styles based on state (error, success, disabled)
  // TODO: Add password show/hide toggle for password type
  // TODO: Add email validation for email type
  // TODO: Add character counter for textarea when showCounter=true
  // TODO: Apply design tokens (height: 48pt for regular, border colors)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      return; // Don't update if over max length
    }
    onChange(newValue);
  };

  const baseStyles = 'input'; // Placeholder
  const isTextarea = type === 'textarea';

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}

      {isTextarea ? (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          className={baseStyles}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={baseStyles}
        />
      )}

      {error && <p className="input-error text-error">{error}</p>}

      {showCounter && maxLength && (
        <p className="input-counter text-secondary">
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
};

Input.displayName = 'Input';

export default Input;
