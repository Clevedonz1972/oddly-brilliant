import { useEffect, useRef } from 'react';

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

/**
 * Floating particles ambient effect
 * Creates subtle animated particles in the background
 */
export const FloatingParticles = ({
  count = 20,
  className = '',
}: FloatingParticlesProps) => {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-cyan-500"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animation: `float ${particle.duration}s ${particle.delay}s ease-in-out infinite`,
            boxShadow: '0 0 10px rgba(0, 217, 255, 0.5)',
          }}
        />
      ))}

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(20px, -20px);
          }
          50% {
            transform: translate(-15px, 15px);
          }
          75% {
            transform: translate(15px, 10px);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Animated grid background
 * Creates a moving cyberpunk-style grid
 */
interface AnimatedGridProps {
  color?: string;
  opacity?: number;
  speed?: number;
}

export const AnimatedGrid = ({
  color = 'rgba(0, 217, 255, 0.05)',
  opacity = 1,
  speed = 20,
}: AnimatedGridProps) => {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ opacity }}
    >
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(${color} 1px, transparent 1px),
            linear-gradient(90deg, ${color} 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: `grid-move ${speed}s linear infinite`,
        }}
      />

      <style>{`
        @keyframes grid-move {
          0% { background-position: 0 0, 0 0; }
          100% { background-position: 50px 50px, 50px 50px; }
        }
      `}</style>
    </div>
  );
};

/**
 * Scanline overlay effect
 * Classic cyberpunk CRT scanline effect
 */
interface ScanlineOverlayProps {
  speed?: number;
  opacity?: number;
}

export const ScanlineOverlay = ({
  speed = 8,
  opacity = 0.02,
}: ScanlineOverlayProps) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Horizontal scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(0, 217, 255, 0.02) 50%)',
          backgroundSize: '100% 4px',
          opacity,
        }}
      />

      {/* Moving scanline */}
      <div
        className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
        style={{
          opacity: opacity * 2,
          animation: `scanline ${speed}s linear infinite`,
          boxShadow: '0 0 10px rgba(0, 217, 255, 0.5)',
        }}
      />

      <style>{`
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
};

/**
 * Ambient glow spots
 * Subtle glowing orbs that add depth
 */
interface GlowSpotsProps {
  count?: number;
}

export const GlowSpots = ({ count = 3 }: GlowSpotsProps) => {
  const spots = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: ['cyan-500', 'magenta-500', 'purple-700'][i % 3],
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
    size: Math.random() * 400 + 300,
    duration: Math.random() * 10 + 15,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {spots.map((spot) => (
        <div
          key={spot.id}
          className={`absolute rounded-full bg-${spot.color} blur-[100px]`}
          style={{
            width: `${spot.size}px`,
            height: `${spot.size}px`,
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            opacity: 0.1,
            animation: `glow-pulse ${spot.duration}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Canvas-based particle system
 * More performant for large particle counts
 */
interface CanvasParticlesProps {
  particleCount?: number;
  color?: string;
}

export const CanvasParticles = ({
  particleCount = 50,
  color = '#00d9ff',
}: CanvasParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle class - canvas is guaranteed non-null at this point
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw(ctx);
      });

      // Draw connections between nearby particles
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - distance / 100) * 0.2;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [particleCount, color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
