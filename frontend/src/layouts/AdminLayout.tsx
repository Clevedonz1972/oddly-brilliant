import type { ReactNode } from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface AdminLayoutProps {
  children?: ReactNode;
}

/**
 * Admin layout with sidebar navigation and role-based access control
 * Redirects non-admin users to homepage
 */
export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, isAuthenticated } = useAuthStore();

  // Protect admin routes - redirect if not authenticated or not admin
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has admin role (adjust based on your User type structure)
  // Assuming role might be in user object or user.profile
  const isAdmin = user.email.includes('admin') || (user as any).role === 'ADMIN';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[var(--bg-surface)] border-r border-[var(--border)] fixed h-full overflow-y-auto">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-2xl font-bold text-gradient-cyber">
            Admin Panel
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {user.email}
          </p>
        </div>

        <nav className="p-4 space-y-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]'
              }`
            }
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/compliance"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]'
              }`
            }
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Compliance
          </NavLink>

          <NavLink
            to="/admin/events"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]'
              }`
            }
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Events
          </NavLink>

          <NavLink
            to="/admin/challenges"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]'
              }`
            }
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Challenges
          </NavLink>

          <div className="pt-4 mt-4 border-t border-[var(--border)]">
            <p className="px-4 pb-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              AI Services
            </p>
          </div>

          <NavLink
            to="/admin/safety"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]'
              }`
            }
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Safety Monitor
          </NavLink>

          <NavLink
            to="/admin/ethics"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]'
              }`
            }
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
            Ethics Auditor
          </NavLink>

          <NavLink
            to="/admin/evidence"
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--primary)] border-l-4 border-[var(--primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]'
              }`
            }
          >
            <svg
              className="w-5 h-5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Evidence Packages
          </NavLink>

          <div className="pt-4 mt-4 border-t border-[var(--border)]">
            <NavLink
              to="/dashboard"
              className="block px-4 py-3 rounded-lg transition-all min-h-[44px] flex items-center text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--primary)]"
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to App
            </NavLink>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};
