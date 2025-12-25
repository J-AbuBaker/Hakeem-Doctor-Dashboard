import { useRef, useCallback, useEffect } from 'react';

export interface UseFocusManagementOptions {
  /**
   * Whether focus management is enabled
   */
  enabled?: boolean;
  /**
   * Whether to restore focus after an action
   */
  restoreFocus?: boolean;
  /**
   * Element to restore focus to (if restoreFocus is true)
   */
  restoreTarget?: HTMLElement | null;
}

/**
 * Hook for managing focus and screen reader announcements
 */
export const useFocusManagement = ({
  enabled = true,
  restoreFocus = false,
  restoreTarget,
}: UseFocusManagementOptions = {}) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const announcementRef = useRef<HTMLDivElement | null>(null);

  // Create live region for screen reader announcements
  useEffect(() => {
    if (!enabled) return;

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    announcementRef.current = liveRegion;

    return () => {
      document.body.removeChild(liveRegion);
    };
  }, [enabled]);

  /**
   * Announce a message to screen readers
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!enabled || !announcementRef.current) return;

    const liveRegion = announcementRef.current;
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;

    // Clear after a short delay to allow re-announcement of the same message
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }, [enabled]);

  /**
   * Save the currently focused element
   */
  const saveFocus = useCallback(() => {
    if (!enabled) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, [enabled]);

  /**
   * Restore focus to the previously focused element or a target element
   */
  const restoreFocusToPrevious = useCallback(() => {
    if (!enabled || !restoreFocus) return;

    const target = restoreTarget || previousFocusRef.current;
    if (target && typeof target.focus === 'function') {
      target.focus();
    }
  }, [enabled, restoreFocus, restoreTarget]);

  /**
   * Move focus to a specific element
   */
  const moveFocus = useCallback((element: HTMLElement | null) => {
    if (!enabled || !element) return;
    element.focus();
  }, [enabled]);

  /**
   * Trap focus within a container element
   */
  const trapFocus = useCallback((container: HTMLElement | null) => {
    if (!enabled || !container) return () => { };

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }, [enabled]);

  return {
    announce,
    saveFocus,
    restoreFocusToPrevious,
    moveFocus,
    trapFocus,
  };
};

