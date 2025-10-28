import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Page transition wrapper component
 * Adds smooth fade and slide transitions when navigating between pages
 */
export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fade-in' | 'fade-out'>('fade-in');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('fade-out');
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'fade-out') {
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fade-in');
      }, 150); // Match CSS transition duration

      return () => clearTimeout(timeout);
    }
  }, [transitionStage, location]);

  return (
    <div
      className={`
        ${transitionStage === 'fade-in' ? 'page-transition-enter' : 'page-transition-exit'}
      `}
      style={{
        animation: transitionStage === 'fade-in'
          ? 'page-transition-enter 0.3s ease-out'
          : 'page-transition-exit 0.15s ease-in',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Animated page wrapper for individual pages
 * Use this to wrap page content for consistent animations
 */
export const AnimatedPage = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={`page-fade-in ${className}`}>
      {children}
    </div>
  );
};
