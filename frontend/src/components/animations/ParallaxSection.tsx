import type { ReactNode } from 'react';
import { useParallax } from '../../hooks/useScrollAnimation';

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

/**
 * Parallax section component
 * Creates depth effect by moving slower/faster than scroll
 */
export const ParallaxSection = ({
  children,
  speed = 0.5,
  className = '',
}: ParallaxSectionProps) => {
  const { ref, offset } = useParallax(speed);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        transform: `translateY(${offset}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
};

/**
 * Parallax background layer
 * For creating multi-layer parallax effects
 */
interface ParallaxLayerProps {
  children: ReactNode;
  speed: number;
  zIndex?: number;
  className?: string;
}

export const ParallaxLayer = ({
  children,
  speed,
  zIndex = 0,
  className = '',
}: ParallaxLayerProps) => {
  const { ref, offset } = useParallax(speed);

  return (
    <div
      ref={ref}
      className={`absolute inset-0 ${className}`}
      style={{
        transform: `translateY(${offset}px)`,
        zIndex,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
};
