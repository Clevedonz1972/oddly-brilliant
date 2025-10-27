import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/common/Input';
import { challengesService } from '../services/challenges.service';
import type { ApiError } from '../types';

interface CreateChallengeFormData {
  title: string;
  description: string;
  bountyAmount: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  bountyAmount?: string;
}

/**
 * Create Challenge page for sponsors to post new challenges
 */
export const CreateChallengePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreateChallengeFormData>({
    title: '',
    description: '',
    bountyAmount: '',
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    // Bounty amount validation
    const bountyNum = parseFloat(formData.bountyAmount);
    if (!formData.bountyAmount) {
      newErrors.bountyAmount = 'Bounty amount is required';
    } else if (isNaN(bountyNum)) {
      newErrors.bountyAmount = 'Bounty amount must be a valid number';
    } else if (bountyNum < 1) {
      newErrors.bountyAmount = 'Bounty must be at least $1';
    } else if (bountyNum > 1000000) {
      newErrors.bountyAmount = 'Bounty must be less than $1,000,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError('');
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const challenge = await challengesService.createChallenge({
        title: formData.title.trim(),
        description: formData.description.trim(),
        bountyAmount: parseFloat(formData.bountyAmount),
      });

      // Navigate to the newly created challenge
      navigate(`/challenges/${challenge.id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Failed to create challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/challenges');
  };

  return (
    <div className="min-h-screen bg-[--bg-primary] py-8 page-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-8">
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-gradient-cyber mb-2">
            Create New Challenge
          </h1>
          <p className="text-lg text-[--text-secondary]">
            Define a problem that needs solving
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg px-4 py-3 text-red-400 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-[--bg-surface] border border-[--border] rounded-lg p-6 shadow-[0_0_20px_rgba(0,217,255,0.1)]">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Title Field */}
                <div>
                  <Input
                    label="Challenge Title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="What challenge needs solving?"
                    maxLength={200}
                    error={errors.title}
                    required
                  />
                  <p className={`mt-1 text-sm ${formData.title.length > 180 ? 'text-[--warning]' : 'text-[--text-muted]'}`}>
                    {formData.title.length}/200 characters
                  </p>
                </div>

                {/* Description Field */}
                <div>
                  <label style={{ fontFamily: 'var(--font-display)' }} className="block text-sm font-medium text-[--text-secondary] uppercase tracking-wide mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={10}
                    maxLength={5000}
                    className={`input resize-none w-full ${
                      errors.description ? 'border-red-500' : ''
                    }`}
                    placeholder="Describe the challenge in detail... What problem needs solving? What are the requirements? What would success look like?"
                    required
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-400">{errors.description}</p>
                  )}
                  <p className={`mt-1 text-sm ${formData.description.length > 4500 ? 'text-[--warning]' : 'text-[--text-muted]'}`}>
                    {formData.description.length}/5000 characters
                  </p>
                </div>

                {/* Bounty Amount Field */}
                <div>
                  <label style={{ fontFamily: 'var(--font-display)' }} className="block text-sm font-medium text-[--text-secondary] uppercase tracking-wide mb-2">
                    Bounty Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[--text-muted] sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={formData.bountyAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, bountyAmount: e.target.value })
                      }
                      className={`input pl-7 w-full ${
                        errors.bountyAmount ? 'border-red-500' : ''
                      }`}
                      placeholder="1000"
                      min="1"
                      max="1000000"
                      step="0.01"
                      required
                    />
                  </div>
                  {errors.bountyAmount && (
                    <p className="mt-1 text-sm text-red-400">{errors.bountyAmount}</p>
                  )}
                  <p className="mt-1 text-sm text-[--text-muted]">
                    How much are you willing to pay for solutions?
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[--primary] text-[--bg-primary] rounded-lg font-semibold hover:shadow-[0_0_30px_var(--primary-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Challenge'}
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
            </form>
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-[--bg-surface] border-2 border-[--primary] rounded-lg p-6 shadow-[0_0_30px_var(--primary-glow)] mb-4">
                <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-[--primary] mb-4 text-lg font-bold">
                  Preview
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-bold text-[--text-primary] break-words">
                      {formData.title || 'Challenge Title'}
                    </h4>
                  </div>

                  <div>
                    <p className="text-sm text-[--text-secondary] whitespace-pre-wrap break-words line-clamp-6">
                      {formData.description || 'Challenge description will appear here...'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[--border]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[--text-muted]">Bounty</span>
                      <span className="text-2xl font-bold text-[--success]">
                        ${formData.bountyAmount || '0'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[--success]/20 text-[--success] border border-[--success]">
                      OPEN
                    </span>
                  </div>
                </div>
              </div>

              {/* Helper Tips */}
              <div className="bg-[--bg-surface] border border-[--accent] rounded-lg p-6 shadow-[0_0_20px_var(--accent-glow)]">
                <h4 style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-semibold text-[--accent] mb-2 uppercase tracking-wide">
                  Tips for a great challenge
                </h4>
                <ul className="text-sm text-[--text-secondary] space-y-1">
                  <li>• Be specific about what you need</li>
                  <li>• Include success criteria</li>
                  <li>• Set a fair bounty amount</li>
                  <li>• Provide context and examples</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
