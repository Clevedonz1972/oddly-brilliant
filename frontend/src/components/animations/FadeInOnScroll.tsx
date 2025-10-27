import { ReactNode } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export type FadeInDirection = 'up' | 'down' | 'left' | 'right' | 'none';

interface FadeInOnScrollProps {
  children: ReactNode;
  direction?: FadeInDirection;
  delay?: number;
  threshold?: number;
  className?: string;
}

/**
 * Wrapper component that fades in content when it scrolls into view
 * Supports multiple animation directions
 */
export const FadeInOnScroll = ({
  children,
  direction = 'up',
  delay = 0,
  threshold = 0.1,
  className = '',
}: FadeInOnScrollProps) => {
  const { ref, isVisible } = useScrollAnimation({ threshold, delay, triggerOnce: true });

  // Direction-specific transform values
  const transforms = {
    up: 'translateY(30px)',
    down: 'translateY(-30px)',
    left: 'translateX(30px)',
    right: 'translateX(-30px)',
    none: 'none',
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0)' : transforms[direction],
      }}
    >
      {children}
    </div>
  );
};

/**
 * Staggered fade-in for lists
 * Children animate in sequence
 */
interface StaggeredFadeInProps {
  children: ReactNode[];
  staggerDelay?: number;
  direction?: FadeInDirection;
  className?: string;
}

export const StaggeredFadeIn = ({
  children,
  staggerDelay = 100,
  direction = 'up',
  className = '',
}: StaggeredFadeInProps) => {
  return (
    <>
      {children.map((child, index) => (
        <FadeInOnScroll
          key={index}
          direction={direction}
          delay={index * staggerDelay}
          className={className}
        >
          {child}
        </FadeInOnScroll>
      ))}
    </>
  );
};
