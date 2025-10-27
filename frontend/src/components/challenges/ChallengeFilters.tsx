import { ChallengeStatus } from '../../types';

interface ChallengeFiltersProps {
  selectedStatus: ChallengeStatus | 'ALL';
  onStatusChange: (status: ChallengeStatus | 'ALL') => void;
}

/**
 * Challenge filters component for filtering by status
 */
export const ChallengeFilters = ({
  selectedStatus,
  onStatusChange,
}: ChallengeFiltersProps) => {
  const statuses: Array<ChallengeStatus | 'ALL'> = [
    'ALL',
    ChallengeStatus.OPEN,
    ChallengeStatus.IN_PROGRESS,
    ChallengeStatus.COMPLETED,
    ChallengeStatus.CLOSED,
  ];

  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Filter by Status
      </label>
      <div className="flex flex-wrap gap-3">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
};
