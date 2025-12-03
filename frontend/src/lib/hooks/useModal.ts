/**
 * useModal Hook - WeTee MVP
 *
 * 모달 상태를 관리하는 훅
 *
 * Usage:
 * ```tsx
 * const modal = useModal();
 *
 * // Open modal
 * modal.open();
 *
 * // Close modal
 * modal.close();
 *
 * // Toggle modal
 * modal.toggle();
 *
 * // Use in component
 * <Modal isOpen={modal.isOpen} onClose={modal.close}>
 *   Content
 * </Modal>
 * ```
 */

'use client';

import { useState, useCallback } from 'react';

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useModal(initialState = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
