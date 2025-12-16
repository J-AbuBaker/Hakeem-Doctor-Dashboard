import React, { useEffect, useRef, useCallback } from 'react';

export interface UseKeyboardNavigationOptions {
  /**
   * Total number of items to navigate
   */
  itemCount: number;
  /**
   * Callback when an item is selected (Enter/Space)
   */
  onSelect?: (index: number) => void;
  /**
   * Callback when navigation changes (arrow keys)
   */
  onNavigate?: (index: number) => void;
  /**
   * Whether navigation is enabled
   */
  enabled?: boolean;
  /**
   * Initial focused index
   */
  initialIndex?: number;
  /**
   * Whether to loop navigation (wrap around)
   */
  loop?: boolean;
  /**
   * Orientation: 'vertical' (up/down) or 'horizontal' (left/right)
   */
  orientation?: 'vertical' | 'horizontal';
}

export const useKeyboardNavigation = ({
  itemCount,
  onSelect,
  onNavigate,
  enabled = true,
  initialIndex = -1,
  loop = false,
  orientation = 'vertical',
}: UseKeyboardNavigationOptions) => {
  const [focusedIndex, setFocusedIndex] = React.useState<number>(initialIndex);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  const setItemRef = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(index, element);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  const focusItem = useCallback((index: number) => {
    const element = itemRefs.current.get(index);
    if (element) {
      element.focus();
      onNavigate?.(index);
    }
  }, [onNavigate]);

  const navigate = useCallback((direction: 'next' | 'prev') => {
    if (!enabled || itemCount === 0) return;

    setFocusedIndex((prev) => {
      let next: number;

      if (prev === -1) {
        next = direction === 'next' ? 0 : itemCount - 1;
      } else {
        if (direction === 'next') {
          next = prev + 1;
          if (next >= itemCount) {
            next = loop ? 0 : itemCount - 1;
          }
        } else {
          next = prev - 1;
          if (next < 0) {
            next = loop ? itemCount - 1 : 0;
          }
        }
      }

      focusItem(next);
      return next;
    });
  }, [enabled, itemCount, loop, focusItem]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const isVertical = orientation === 'vertical';
    const isNextKey = isVertical
      ? e.key === 'ArrowDown'
      : e.key === 'ArrowRight';
    const isPrevKey = isVertical
      ? e.key === 'ArrowUp'
      : e.key === 'ArrowLeft';

    if (isNextKey) {
      e.preventDefault();
      navigate('next');
    } else if (isPrevKey) {
      e.preventDefault();
      navigate('prev');
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (focusedIndex >= 0 && focusedIndex < itemCount) {
        e.preventDefault();
        onSelect?.(focusedIndex);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (itemCount > 0) {
        focusItem(0);
        setFocusedIndex(0);
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      if (itemCount > 0) {
        focusItem(itemCount - 1);
        setFocusedIndex(itemCount - 1);
      }
    }
  }, [enabled, orientation, navigate, focusedIndex, itemCount, onSelect, focusItem]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);

  return {
    focusedIndex,
    setFocusedIndex,
    setItemRef,
    focusItem,
  };
};
