import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

/**
 * Home page with hero section and feature cards
 * Cyberpunk-themed with gradient text and glowing effects
 */
export const HomePage = () => {
  const features = [
    {
      title: 'Fair Attribution',
      description:
        'Get credit for your contributions with blockchain-verified ownership. Your ideas are yours, forever.',
      icon: '🏆',
      color: 'cyan', // Cyan glow
    },
    {
      title: 'Perpetual Royalties',
      description:
        'Earn ongoing rewards as your ideas grow and evolve. Benefit from the success you help create.',
      icon: '💰',
      color: 'magenta', // Magenta glow
    },
    {
      title: 'Be Yourself',
      description:
        'Contribute your unique perspective without conforming to corporate culture. Authenticity is valued here.',
      icon: '✨',
      color: 'purple', // Purple glow
    },
  ];

  return (
    <div className="bg-[var(--bg-primary)] page-fade-in">
      {/* Hero Section */}
      <div className="relative bg-[var(--bg-surface)] bg-grid scanline-overlay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-gradient-cyber glitch-text glow-pulse"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              oddly-brilliant
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
              A platform where authenticity meets innovation. Contribute your unique ideas,
              earn fair rewards, and keep ownership of what you create.
            </p>
            <Link to="/signup">
              <Button
                variant="primary"
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 shadow-[0_0_30px_var(--primary-glow)] btn-ripple"
              >
                Join the Crew
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative cyber elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--secondary)] to-transparent opacity-50"></div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Why oddly-brilliant?
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            We believe in rewarding creativity and protecting contributors.
            Here's what makes us different.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`card card-holographic card-lift text-center transition-all duration-300 ${
                feature.color === 'cyan' ? 'card-cyan' :
                feature.color === 'magenta' ? 'card-magenta' :
                'card-purple'
              }`}
            >
              <div className="text-5xl sm:text-6xl mb-4">{feature.icon}</div>
              <h3
                className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] mb-3 leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {feature.title}
              </h3>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[var(--bg-surface)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            className="bg-[var(--bg-elevated)] rounded-2xl p-8 sm:p-12 text-center border-2 border-[var(--primary)] shadow-[0_0_40px_var(--primary-glow)]"
            style={{
              background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)',
            }}
          >
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight text-gradient-cyber"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to make a difference?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
              Join our community of creators and innovators. Start contributing to challenges
              and earn rewards for your unique perspective.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/challenges">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto shadow-[0_0_20px_var(--accent-glow)]"
                >
                  Explore Challenges
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  variant="secondary"
                  className="w-full sm:w-auto shadow-[0_0_20px_var(--secondary-glow)]"
                >
                  Sign Up Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats/Social Proof Section (Optional Enhancement) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div
              className="text-4xl md:text-5xl font-bold text-gradient-cyber mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              100%
            </div>
            <p className="text-[var(--text-secondary)] text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Ownership Retained
            </p>
          </div>
          <div className="text-center">
            <div
              className="text-4xl md:text-5xl font-bold text-gradient-pink mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Forever
            </div>
            <p className="text-[var(--text-secondary)] text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Royalty Duration
            </p>
          </div>
          <div className="text-center">
            <div
              className="text-4xl md:text-5xl font-bold text-[var(--success)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Fair
            </div>
            <p className="text-[var(--text-secondary)] text-sm uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Attribution Always
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
