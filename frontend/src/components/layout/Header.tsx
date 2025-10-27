import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

/**
 * Header component with navigation and authentication controls
 * Cyberpunk-themed with dark styling and glowing effects
 */
export const Header = () => {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    clearAuth();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navigation = isAuthenticated
    ? [
        { name: 'Challenges', href: '/challenges' },
        { name: 'Dashboard', href: '/dashboard' },
      ]
    : [
        { name: 'Challenges', href: '/challenges' },
      ];

  return (
    <header className="bg-[var(--bg-surface)] shadow-sm border-b border-[var(--border)] border-cyber backdrop-blur-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              to="/"
              className="flex items-center text-2xl font-bold text-gradient-cyber min-h-[44px] transition-all hover:scale-105"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              oddly-brilliant
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href ||
                              (item.href === '/challenges' && location.pathname.startsWith('/challenges'));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-[var(--text-secondary)] hover:text-[var(--primary)] px-3 py-2 text-sm font-medium transition-all min-h-[44px] min-w-[44px] flex items-center justify-center hover:shadow-[0_0_8px_var(--primary-glow)] ${isActive ? 'nav-active' : ''}`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {item.name}
                </Link>
              );
            })}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/challenges/new"
                  className="btn-primary text-sm py-2"
                >
                  Create Challenge
                </Link>
                <Link
                  to="/profile"
                  className={`text-[var(--text-secondary)] hover:text-[var(--primary)] px-3 py-2 text-sm font-medium transition-all min-h-[44px] min-w-[44px] flex items-center justify-center hover:shadow-[0_0_8px_var(--primary-glow)] ${location.pathname === '/profile' ? 'nav-active' : ''}`}
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] px-3 py-2 text-sm font-medium transition-all min-h-[44px] min-w-[44px] flex items-center justify-center hover:shadow-[0_0_8px_var(--primary-glow)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] px-3 py-2 text-sm font-medium transition-all min-h-[44px] min-w-[44px] flex items-center justify-center hover:shadow-[0_0_8px_var(--primary-glow)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary text-sm py-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--primary)] min-h-[44px] min-w-[44px] transition-all hover:shadow-[0_0_8px_var(--primary-glow)]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Close main menu" : "Open main menu"}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 bg-[var(--bg-elevated)] rounded-b-lg border border-[var(--border)] border-t-0 shadow-lg shadow-[var(--primary-glow)]" id="mobile-menu">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-surface)] rounded-md min-h-[44px] flex items-center transition-all"
                  style={{ fontFamily: 'var(--font-display)' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/challenges/new"
                    className="block px-3 py-2 text-base font-medium text-[var(--primary)] hover:bg-[var(--bg-surface)] rounded-md min-h-[44px] flex items-center transition-all border border-[var(--primary)] hover:shadow-[0_0_15px_var(--primary-glow)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Create Challenge
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-surface)] rounded-md min-h-[44px] flex items-center transition-all"
                    style={{ fontFamily: 'var(--font-display)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <div className="px-3 py-2 text-sm text-[var(--text-muted)] min-h-[44px] flex items-center" style={{ fontFamily: 'var(--font-mono)' }}>
                    {user?.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-surface)] rounded-md min-h-[44px] flex items-center transition-all"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--bg-surface)] rounded-md min-h-[44px] flex items-center transition-all"
                    style={{ fontFamily: 'var(--font-display)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-2 text-base font-medium text-[var(--primary)] hover:bg-[var(--bg-surface)] rounded-md min-h-[44px] flex items-center transition-all border border-[var(--primary)] hover:shadow-[0_0_15px_var(--primary-glow)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
