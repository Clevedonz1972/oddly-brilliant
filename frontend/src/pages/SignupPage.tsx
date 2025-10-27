import { Link } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';

/**
 * Signup page
 */
export const SignupPage = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[var(--bg-primary)] py-12 px-4 sm:px-6 lg:px-8 page-fade-in">
      <div className="max-w-md w-full">
        <div className="bg-[var(--bg-surface)] border-2 border-[var(--border)] rounded-lg shadow-[0_0_30px_var(--primary-glow)] p-8">
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-bold text-gradient-cyber mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Join oddly-brilliant
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">
              Start contributing and earning rewards today
            </p>
          </div>

          <SignupForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-[var(--primary)] hover:text-[var(--secondary)] hover:shadow-[0_0_8px_var(--primary-glow)] transition-all"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
