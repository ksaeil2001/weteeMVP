/**
 * Toast Component - WeTee MVP
 *
 * Design System: Bento Grid v2.0
 * Toast 알림을 표시하는 컴포넌트
 *
 * Features:
 * - 4가지 variant (success, error, warning, info)
 * - 자동 사라짐 (기본 5초)
 * - 수동 닫기 가능
 * - 애니메이션 효과
 * - 다크 모드 지원
 */

'use client';

import { useEffect, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  onClose?: () => void;
}

export default function Toast({
  id,
  message,
  variant = 'info',
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.();
    }, 300); // Match animation duration
  };

  // Variant styles
  const variantStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  // Icon
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        transition-all duration-300 ease-smooth
        ${variantStyles[variant]}
        ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
        ${isLeaving ? 'scale-95' : 'scale-100'}
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold text-lg">
        {icons[variant]}
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
        aria-label="닫기"
      >
        <span className="text-base leading-none">×</span>
      </button>
    </div>
  );
}
