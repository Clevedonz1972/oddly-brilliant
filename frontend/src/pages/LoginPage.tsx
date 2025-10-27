import { Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';

/**
 * Login page
 */
export const LoginPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 page-fade-in">
      <div className="max-w-md w-full">
        <div className="bg-[var(--bg-surface)] border-2 border-[var(--border)] rounded-lg shadow-[0_0_30px_var(--primary-glow)] p-8">
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-bold text-gradient-cyber mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Welcome Back
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Login to continue your oddly-brilliant journey
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-[var(--primary)] hover:text-[var(--secondary)] hover:shadow-[0_0_8px_var(--primary-glow)] transition-all"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
