import { useEffect, type ReactNode } from 'react';
import { useFocusTrap, useKeyboardNavigation } from '../../hooks/useAccessibility';

interface FocusManagerProps {
  children: ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
}

/**
 * Focus Manager component
 * Manages focus trap and keyboard navigation for modal/dialog components
 *
 * Features:
 * - Focus trap (keeps focus within component)
 * - Restore focus on unmount
 * - Auto-focus first element
 * - Keyboard navigation support
 */
export const FocusManager = ({
  children,
  active = true,
  restoreFocus = true,
}: FocusManagerProps) => {
  const setContainerRef = useFocusTrap(active);

  // Track keyboard navigation globally
  useKeyboardNavigation();

  useEffect(() => {
    if (!active) return;

    // Save previous focus
    const previousFocus = document.activeElement as HTMLElement;

    // Restore focus on unmount
    return () => {
      if (restoreFocus && previousFocus && document.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div
      ref={setContainerRef}
      className="focus-manager"
      data-focus-trap={active ? 'active' : 'inactive'}
    >
      {children}
    </div>
  );
};

/**
 * Live region component for screen reader announcements
 * WCAG 4.1.3 Status Messages (Level AA)
 */
interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}

export const LiveRegion = ({
  message,
  politeness = 'polite',
  atomic = true,
}: LiveRegionProps) => {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  );
};

/**
 * Visually hidden component
 * Hides content visually but keeps it accessible to screen readers
 */
interface VisuallyHiddenProps {
  children: ReactNode;
  focusable?: boolean;
}

export const VisuallyHidden = ({ children, focusable = false }: VisuallyHiddenProps) => {
  return (
    <span className={focusable ? 'sr-only focus:not-sr-only' : 'sr-only'}>
      {children}
    </span>
  );
};
