import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../common/Button';
import { ContributionType } from '../../types';
import { getContributionTypeInfo } from '../../utils/format';
import type { ApiError } from '../../types';

const contributionSchema = z.object({
  content: z.string()
    .min(20, 'Please provide at least 20 characters')
    .max(5000, 'Contribution must be less than 5000 characters'),
  type: z.nativeEnum(ContributionType),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface ContributionFormProps {
  challengeId: string;
  onSubmit: (data: ContributionFormData) => Promise<void>;
  onSuccess?: () => void;
}

/**
 * Contribution form component for submitting contributions to a challenge
 * Includes token value display, character counter, and comprehensive validation
 */
export const ContributionForm = ({ onSubmit, onSuccess }: ContributionFormProps) => {
  const [apiError, setApiError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      type: ContributionType.IDEA,
      content: '',
    },
  });

  const selectedType = watch('type');
  const contentValue = watch('content');
  const typeInfo = getContributionTypeInfo(selectedType);
  const charCount = contentValue?.length || 0;
  const maxChars = 5000;

  const handleFormSubmit = async (data: ContributionFormData) => {
    try {
      setLoading(true);
      setApiError('');
      setSuccessMessage('');
      await onSubmit(data);
      setSuccessMessage('Contribution submitted successfully!');
      reset();
      onSuccess?.();
    } catch (error) {
      const apiErr = error as ApiError;
      setApiError(apiErr.message || 'Failed to submit contribution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {apiError && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          <p className="font-medium">Error</p>
          <p className="text-sm">{apiError}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded" role="status">
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      <div>
        <label htmlFor="contribution-type" className="block text-sm font-medium text-gray-700 mb-2">
          Contribution Type
        </label>
        <select
          id="contribution-type"
          {...register('type')}
          className="input w-full min-h-[44px]"
          disabled={loading}
          aria-describedby={errors.type ? 'type-error' : 'type-description'}
        >
          {Object.values(ContributionType).map((type) => {
            const info = getContributionTypeInfo(type);
            return (
              <option key={type} value={type}>
                {info.label} ({info.tokens} tokens)
              </option>
            );
          })}
        </select>
        <p id="type-description" className="mt-1 text-sm text-gray-600">
          {typeInfo.description}
        </p>
        {errors.type && (
          <p id="type-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.type.message}
          </p>
        )}
      </div>

      {/* Token Value Display */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Token Value</p>
            <p className="text-xs text-gray-600">Reward for this contribution type</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">
              {typeInfo.tokens}
            </p>
            <p className="text-xs text-gray-600">tokens</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="contribution-content" className="block text-sm font-medium text-gray-700">
            Your Contribution
          </label>
          <span
            className={`text-sm ${
              charCount > maxChars
                ? 'text-red-600 font-semibold'
                : charCount > maxChars * 0.9
                ? 'text-yellow-600'
                : 'text-gray-500'
            }`}
            aria-live="polite"
          >
            {charCount.toLocaleString()} / {maxChars.toLocaleString()}
          </span>
        </div>
        <textarea
          id="contribution-content"
          {...register('content')}
          rows={8}
          className="input resize-none w-full"
          placeholder="Describe your contribution in detail...&#10;&#10;For code contributions, include relevant code snippets.&#10;For design contributions, describe your design approach.&#10;For ideas, explain your concept and rationale."
          disabled={loading}
          aria-describedby={errors.content ? 'content-error' : 'content-hint'}
        />
        <p id="content-hint" className="mt-1 text-sm text-gray-600">
          Minimum 20 characters. Be specific and provide enough detail for reviewers.
        </p>
        {errors.content && (
          <p id="content-error" className="mt-1 text-sm text-red-600" role="alert">
            {errors.content.message}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => {
            reset();
            setApiError('');
            setSuccessMessage('');
          }}
          disabled={loading}
          className="btn btn-secondary min-h-[44px]"
        >
          Clear Form
        </button>
        <Button type="submit" loading={loading} className="w-full sm:flex-1 min-h-[44px]">
          Submit Contribution
        </Button>
      </div>
    </form>
  );
};
