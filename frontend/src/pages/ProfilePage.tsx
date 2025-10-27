import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Input } from '../components/common/Input';
import { Loading } from '../components/common/Loading';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { useAuthStore } from '../stores/authStore';
import { usersService } from '../services/users.service';
import type { ApiError } from '../types';

interface ProfileFormData {
  displayName: string;
  thinkingStyle: string;
  interests: string;
}

/**
 * User profile page for managing account settings and viewing stats
 */
export const ProfilePage = () => {
  const location = useLocation();
  const { user, setAuth } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: user?.profile?.displayName || '',
    thinkingStyle: user?.profile?.thinkingStyle || '',
    interests: user?.profile?.interests || '',
  });

  // Fetch fresh user profile data on mount or location change
  useEffect(() => {
    fetchProfile();
  }, [location.pathname]);

  const fetchProfile = async () => {
    try {
      console.log('🔍 ProfilePage: Loading user profile...');
      setInitialLoading(true);
      setError('');

      // Fetch current user profile using the users service
      const userData = await usersService.getCurrentUser();
      console.log('✅ ProfilePage: User data loaded:', userData);

      // Update auth store with fresh data
      if (userData && user) {
        setAuth(userData, useAuthStore.getState().token || '');
      }

      // Update form data
      setFormData({
        displayName: userData.profile?.displayName || '',
        thinkingStyle: userData.profile?.thinkingStyle || '',
        interests: userData.profile?.interests || '',
      });
    } catch (err) {
      console.error('❌ ProfilePage: Error loading profile:', err);
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to load profile');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.displayName.length > 50) {
      setError('Display name must be less than 50 characters');
      return;
    }
    if (formData.thinkingStyle.length > 500) {
      setError('Thinking style must be less than 500 characters');
      return;
    }
    if (formData.interests.length > 500) {
      setError('Interests must be less than 500 characters');
      return;
    }

    try {
      console.log('📝 ProfilePage: Updating profile...', formData);
      setLoading(true);
      setError('');
      setSuccess('');

      // Update profile using the users service
      const updatedUser = await usersService.updateProfile({
        displayName: formData.displayName || undefined,
        thinkingStyle: formData.thinkingStyle || undefined,
        interests: formData.interests || undefined,
      });

      console.log('✅ ProfilePage: Profile updated successfully:', updatedUser);

      // Update auth store with new user data
      if (user) {
        setAuth(updatedUser, useAuthStore.getState().token || '');
      }

      setSuccess('Profile updated successfully!');
      setEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('❌ ProfilePage: Error updating profile:', err);
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    // Reset form to current user data
    setFormData({
      displayName: user?.profile?.displayName || '',
      thinkingStyle: user?.profile?.thinkingStyle || '',
      interests: user?.profile?.interests || '',
    });
  };

  if (initialLoading) {
    return <Loading message="Loading profile..." />;
  }

  if (error && !editing) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ErrorMessage message={error} onRetry={fetchProfile} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--bg-primary] py-8 page-fade-in">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-gradient-cyber mb-2">
            Your Profile
          </h1>
          <p className="text-lg text-[--text-secondary]">
            Manage your account settings and view your stats
          </p>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[--bg-surface] border-l-4 border-l-[--primary] rounded-lg p-6 shadow-[0_0_20px_var(--primary-glow)] text-center">
            <p className="text-sm text-[--text-muted] mb-1">Member Since</p>
            <p className="text-2xl font-bold text-[--text-primary]">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>

          <div className="bg-[--bg-surface] border-l-4 border-l-[--secondary] rounded-lg p-6 shadow-[0_0_20px_var(--secondary-glow)] text-center">
            <p className="text-sm text-[--text-muted] mb-1">Contributions</p>
            <p className="text-2xl font-bold text-[--secondary]">
              {user?.stats?.totalContributions || 0}
            </p>
          </div>

          <div className="bg-[--bg-surface] border-l-4 border-l-[--accent] rounded-lg p-6 shadow-[0_0_20px_var(--accent-glow)] text-center">
            <p className="text-sm text-[--text-muted] mb-1">Tokens Earned</p>
            <p className="text-2xl font-bold text-[--accent]">
              {user?.stats?.tokensEarned || 0}
            </p>
          </div>

          <div className="bg-[--bg-surface] border-l-4 border-l-[--success] rounded-lg p-6 shadow-[0_0_20px_rgba(0,255,136,0.3)] text-center">
            <p className="text-sm text-[--text-muted] mb-1">Challenges Created</p>
            <p className="text-2xl font-bold text-[--success]">
              {user?.stats?.challengesCreated || 0}
            </p>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-[--bg-surface] border border-[--border] rounded-lg p-6 shadow-[0_0_20px_rgba(0,217,255,0.1)] mb-6">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-[--primary] mb-6">
            Account Information
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-[--text-muted]">Email</p>
              <p className="text-lg font-semibold text-[--text-primary]">{user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-[--text-muted]">User ID</p>
              <p className="text-sm font-mono text-[--text-secondary]">{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-[--bg-surface] border border-[--border] rounded-lg p-6 shadow-[0_0_20px_rgba(0,217,255,0.1)]">
          <div className="flex justify-between items-center mb-6">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-[--primary]">
              Tell us about yourself
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-transparent border-2 border-[--text-muted] text-[--text-secondary] rounded-lg font-semibold hover:bg-[--text-muted] hover:text-[--bg-primary] transition-all"
              >
                Edit Profile
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Input
                label="Display Name"
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                disabled={!editing}
                placeholder="How should we call you?"
                maxLength={50}
              />
              <p className={`mt-1 text-sm ${formData.displayName.length > 45 ? 'text-[--warning]' : 'text-[--text-muted]'}`}>
                {formData.displayName.length}/50 characters
              </p>
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-display)' }} className="block text-sm font-medium text-[--text-secondary] uppercase tracking-wide mb-2">
                Thinking Style
              </label>
              <textarea
                value={formData.thinkingStyle}
                onChange={(e) =>
                  setFormData({ ...formData, thinkingStyle: e.target.value })
                }
                disabled={!editing}
                rows={4}
                maxLength={500}
                className="input resize-none w-full"
                placeholder="How do you approach problems? Visual thinker? Need structure? Etc."
              />
              <p className={`mt-1 text-sm ${formData.thinkingStyle.length > 450 ? 'text-[--warning]' : 'text-[--text-muted]'}`}>
                {formData.thinkingStyle.length}/500 characters
              </p>
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-display)' }} className="block text-sm font-medium text-[--text-secondary] uppercase tracking-wide mb-2">
                Interests
              </label>
              <textarea
                value={formData.interests}
                onChange={(e) =>
                  setFormData({ ...formData, interests: e.target.value })
                }
                disabled={!editing}
                rows={4}
                maxLength={500}
                className="input resize-none w-full"
                placeholder="What topics excite you? What problems do you want to solve?"
              />
              <p className={`mt-1 text-sm ${formData.interests.length > 450 ? 'text-[--warning]' : 'text-[--text-muted]'}`}>
                {formData.interests.length}/500 characters
              </p>
            </div>
          </div>

          {editing && (
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[--primary] text-[--bg-primary] rounded-lg font-semibold hover:shadow-[0_0_30px_var(--primary-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-3 bg-transparent border-2 border-[--text-muted] text-[--text-secondary] rounded-lg font-semibold hover:bg-[--text-muted] hover:text-[--bg-primary] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
};
