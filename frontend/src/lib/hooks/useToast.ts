/**
 * useToast Hook - WeTee MVP
 *
 * Toast 알림을 표시하는 훅
 *
 * Usage:
 * ```tsx
 * const toast = useToast();
 *
 * toast.success('저장되었습니다');
 * toast.error('오류가 발생했습니다');
 * toast.warning('주의하세요');
 * toast.info('알림입니다');
 * ```
 */

'use client';

import { useToastContext } from '@/components/providers/ToastProvider';
import { ToastVariant } from '@/components/ui/Toast';

export function useToast() {
  const { showToast } = useToastContext();

  return {
    /**
     * Success toast (green)
     */
    success: (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },

    /**
     * Error toast (red)
     */
    error: (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },

    /**
     * Warning toast (amber)
     */
    warning: (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },

    /**
     * Info toast (blue)
     */
    info: (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },

    /**
     * Custom toast with variant
     */
    show: (message: string, variant: ToastVariant = 'info', duration?: number) => {
      showToast(message, variant, duration);
    },
  };
}
