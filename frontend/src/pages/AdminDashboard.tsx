import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Loading } from '../components/common/Loading';

interface AdminStats {
  users: number;
  challenges: number;
  contributions: number;
  payments: number;
  totalBounty: string;
  totalPaid: string;
}

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  walletAddress?: string;
  createdAt: string;
  _count: {
    sponsoredChallenges: number;
    contributions: number;
    payments: number;
  };
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);

      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setError(error.response?.data?.error?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'USER' | 'ADMIN' | 'MODERATOR') => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      await fetchAdminData(); // Refresh data
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setError(error.response?.data?.error?.message || 'Failed to update user role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 page-fade-in">
      <h1 className="text-3xl font-bold text-cyan-400 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Total Users</div>
            <div className="text-3xl font-bold text-cyan-400">{stats.users}</div>
          </div>

          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Total Challenges</div>
            <div className="text-3xl font-bold text-cyan-400">{stats.challenges}</div>
          </div>

          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Total Contributions</div>
            <div className="text-3xl font-bold text-cyan-400">{stats.contributions}</div>
          </div>

          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Total Payments</div>
            <div className="text-3xl font-bold text-cyan-400">{stats.payments}</div>
          </div>

          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Total Bounty</div>
            <div className="text-3xl font-bold text-cyan-400">${stats.totalBounty}</div>
          </div>

          <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-1">Total Paid</div>
            <div className="text-3xl font-bold text-green-400">${stats.totalPaid}</div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-cyan-500/30">
          <h2 className="text-xl font-bold text-cyan-400">Users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Challenges
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Contributions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Payments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        user.role === 'ADMIN'
                          ? 'bg-red-500/20 text-red-400'
                          : user.role === 'MODERATOR'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user._count.sponsoredChallenges}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user._count.contributions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {user._count.payments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        updateUserRole(user.id, e.target.value as 'USER' | 'ADMIN' | 'MODERATOR')
                      }
                      className="bg-gray-700 border border-cyan-500/50 text-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-400"
                    >
                      <option value="USER">USER</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
