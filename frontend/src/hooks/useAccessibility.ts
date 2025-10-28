import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to detect user's reduced motion preference
 * Respects prefers-reduced-motion media query (WCAG 2.3.3)
 */
export const useReducedMotion = (): boolean => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reducedMotion;
};

/**
 * Hook to detect user's high contrast preference
 * Respects prefers-contrast media query and forced-colors
 */
export const useHighContrast = (): { highContrast: boolean; forcedColors: boolean } => {
  const [highContrast, setHighContrast] = useState(false);
  const [forcedColors, setForcedColors] = useState(false);

  useEffect(() => {
    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(contrastQuery.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    contrastQuery.addEventListener('change', handleContrastChange);

    // Check for forced colors (Windows High Contrast mode)
    const forcedColorsQuery = window.matchMedia('(forced-colors: active)');
    setForcedColors(forcedColorsQuery.matches);

    const handleForcedColorsChange = (e: MediaQueryListEvent) => {
      setForcedColors(e.matches);
    };

    forcedColorsQuery.addEventListener('change', handleForcedColorsChange);

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange);
      forcedColorsQuery.removeEventListener('change', handleForcedColorsChange);
    };
  }, []);

  return { highContrast, forcedColors };
};

/**
 * Hook to detect user's color scheme preference
 * Respects prefers-color-scheme media query
 */
export const useColorScheme = (): 'light' | 'dark' => {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

    setColorScheme(mediaQuery.matches ? 'light' : 'dark');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'light' : 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
};

/**
 * Focus management hook for managing focus within a component
 * Useful for modals, menus, and other focus traps
 */
export const useFocusTrap = (active: boolean = false) => {
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef) return;

    const focusableElements = containerRef.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab - going backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab - going forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    containerRef.addEventListener('keydown', handleKeyDown as EventListener);

    // Auto-focus first element when trap activates
    firstElement?.focus();

    return () => {
      containerRef.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [active, containerRef]);

  return setContainerRef;
};

/**
 * Hook to manage skip links for keyboard navigation
 * Creates skip-to-content links for better accessibility
 */
export const useSkipLink = (targetId: string) => {
  const skipToContent = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [targetId]);

  return skipToContent;
};

/**
 * Announces messages to screen readers using ARIA live regions
 */
export const useAriaAnnounce = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = message;

    document.body.appendChild(liveRegion);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }, []);

  return announce;
};

/**
 * Hook to track and restore focus after an interaction
 * Useful for modals that need to return focus to the trigger
 */
export const useFocusReturn = () => {
  const [previousFocus, setPreviousFocus] = useState<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    setPreviousFocus(document.activeElement as HTMLElement);
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocus && document.contains(previousFocus)) {
      previousFocus.focus();
    }
  }, [previousFocus]);

  return { saveFocus, restoreFocus };
};

/**
 * Hook to detect keyboard navigation
 * Adds class to body when user is using keyboard
 */
export const useKeyboardNavigation = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-nav');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
};
