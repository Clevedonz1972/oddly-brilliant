import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  variant?: 'checkmark' | 'confetti';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Success animation component with checkmark and confetti variants
 * Cyberpunk-themed with glowing effects
 */
export const SuccessAnimation = ({
  show,
  onComplete,
  variant = 'checkmark',
  size = 'md',
}: SuccessAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return variant === 'checkmark' ? (
    <CheckmarkAnimation size={size} />
  ) : (
    <ConfettiAnimation />
  );
};

interface CheckmarkAnimationProps {
  size?: 'sm' | 'md' | 'lg';
}

const CheckmarkAnimation = ({ size = 'md' }: CheckmarkAnimationProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const strokeWidthClasses = {
    sm: '3',
    md: '4',
    lg: '5',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-dark/50 backdrop-blur-sm animate-fade-in">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Circle background */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-success animate-[spin_0.6s_ease-in-out] opacity-20"
            style={{
              transformOrigin: 'center',
              animation: 'spin 0.6s ease-in-out forwards',
            }}
          />
        </svg>

        {/* Checkmark */}
        <svg
          className="relative w-full h-full text-success"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidthClasses[size]}
            className="drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]"
            style={{
              strokeDasharray: 283,
              strokeDashoffset: 283,
              animation: 'draw-circle 0.6s ease-out forwards',
            }}
          />
          <path
            d="M30 50 L45 65 L70 35"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidthClasses[size]}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_20px_rgba(0,255,136,0.5)]"
            style={{
              strokeDasharray: 60,
              strokeDashoffset: 60,
              animation: 'draw-check 0.4s 0.6s ease-out forwards',
            }}
          />
        </svg>

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-success/20 blur-xl animate-glow-pulse" />
      </div>

      <style>{`
        @keyframes draw-circle {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes draw-check {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

const ConfettiAnimation = () => {
  const confettiCount = 50;
  const confetti = Array.from({ length: confettiCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1,
    rotation: Math.random() * 360,
    color: ['cyan-500', 'magenta-500', 'success', 'warning'][Math.floor(Math.random() * 4)],
  }));

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className={`absolute top-0 w-2 h-2 bg-${piece.color} rounded-sm`}
          style={{
            left: `${piece.x}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            animation: 'confetti-fall linear forwards',
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Hook for triggering success animations
 */
export const useSuccessAnimation = () => {
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerCheckmark = () => setShowCheckmark(true);
  const triggerConfetti = () => setShowConfetti(true);

  return {
    showCheckmark,
    showConfetti,
    triggerCheckmark,
    triggerConfetti,
    CheckmarkComponent: (
      <SuccessAnimation
        show={showCheckmark}
        variant="checkmark"
        onComplete={() => setShowCheckmark(false)}
      />
    ),
    ConfettiComponent: (
      <SuccessAnimation
        show={showConfetti}
        variant="confetti"
        onComplete={() => setShowConfetti(false)}
      />
    ),
  };
};
