import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';

// Pages
import { HomePage } from './pages/HomePage';
import { SignupPage } from './pages/SignupPage';
import { LoginPage } from './pages/LoginPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { ChallengePage } from './pages/ChallengePage';
import { CreateChallengePage } from './pages/CreateChallengePage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProposalsPage } from './pages/ProposalsPage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { PaymentsPage } from './pages/PaymentsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CompliancePage } from './pages/admin/CompliancePage';
import { EventsPage } from './pages/admin/EventsPage';
import { ChallengesAdmin } from './pages/admin/ChallengesAdmin';
import { SafetyMonitoring } from './pages/admin/SafetyMonitoring';
import { EthicsAuditor } from './pages/admin/EthicsAuditor';
import { EvidencePackages } from './pages/admin/EvidencePackages';

/**
 * Main App component with routing configuration
 */
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/challenges/:id" element={<ChallengePage />} />

          {/* Protected Routes */}
          <Route
            path="/challenges/new"
            element={
              <ProtectedRoute>
                <CreateChallengePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proposals"
            element={
              <ProtectedRoute>
                <ProposalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submissions"
            element={
              <ProtectedRoute>
                <SubmissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes with Separate Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="challenges" element={<ChallengesAdmin />} />
            <Route path="safety" element={<SafetyMonitoring />} />
            <Route path="ethics" element={<EthicsAuditor />} />
            <Route path="evidence" element={<EvidencePackages />} />
          </Route>
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
