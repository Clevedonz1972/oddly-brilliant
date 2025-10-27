import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Event } from '../../types/governance';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ErrorMessage } from '../../components/common/ErrorMessage';

/**
 * EventsPage - Browse all system events with filters and pagination
 */
export const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const eventsPerPage = 50;

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [searchEntityId, setSearchEntityId] = useState<string>('');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');

  const fetchEvents = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params: any = {
        limit: eventsPerPage,
        offset: (page - 1) * eventsPerPage,
      };

      if (entityTypeFilter) params.entityType = entityTypeFilter;
      if (searchEntityId) params.entityId = searchEntityId;
      if (dateRangeStart) params.startDate = dateRangeStart;
      if (dateRangeEnd) params.endDate = dateRangeEnd;

      // BUG FIX: Backend now returns standardized format { success, data }
      const response = await api.get<{ success: boolean; data: Event[] }>('/admin/events/recent', { params });
      setEvents(response.data.data);

      // Calculate total pages (this would ideally come from the API)
      // For now, assuming we got fewer events than requested means we're on the last page
      if (response.data.data.length < eventsPerPage) {
        setTotalPages(page);
      } else {
        setTotalPages(page + 1); // Assume there's at least one more page
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
      console.error('Events fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentPage);
  }, [currentPage]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchEvents(1);
  };

  const handleClearFilters = () => {
    setEntityTypeFilter('');
    setSearchEntityId('');
    setDateRangeStart('');
    setDateRangeEnd('');
    setCurrentPage(1);
    fetchEvents(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const uniqueEntityTypes = [
    'CHALLENGE',
    'CONTRIBUTION',
    'USER',
    'PAYMENT',
    'VETTING',
  ];

  return (
    <div className="space-y-8 page-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gradient-cyber mb-2">
          System Events
        </h1>
        <p className="text-[var(--text-secondary)]">
          Browse and search the complete system audit log
        </p>
      </div>

      {/* Filters */}
      <Card>
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Entity Type Filter */}
          <div>
            <label
              htmlFor="entity-type"
              className="block text-sm font-semibold text-[var(--text-secondary)] mb-2"
            >
              Entity Type
            </label>
            <select
              id="entity-type"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="input min-h-[44px]"
            >
              <option value="">All Types</option>
              {uniqueEntityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Entity ID Search */}
          <div>
            <label
              htmlFor="entity-id"
              className="block text-sm font-semibold text-[var(--text-secondary)] mb-2"
            >
              Entity ID
            </label>
            <input
              id="entity-id"
              type="text"
              value={searchEntityId}
              onChange={(e) => setSearchEntityId(e.target.value)}
              placeholder="Search by ID..."
              className="input min-h-[44px]"
            />
          </div>

          {/* Date Range Start */}
          <div>
            <label
              htmlFor="date-start"
              className="block text-sm font-semibold text-[var(--text-secondary)] mb-2"
            >
              Start Date
            </label>
            <input
              id="date-start"
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="input min-h-[44px]"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label
              htmlFor="date-end"
              className="block text-sm font-semibold text-[var(--text-secondary)] mb-2"
            >
              End Date
            </label>
            <input
              id="date-end"
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="input min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleApplyFilters} disabled={loading}>
            Apply Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleClearFilters}
            disabled={loading}
          >
            Clear
          </Button>
        </div>
      </Card>

      {/* Events Table */}
      <Card>
        {error ? (
          <ErrorMessage message={error} />
        ) : loading ? (
          <Loading />
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4"
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
            <p className="text-[var(--text-secondary)]">No events found</p>
            <p className="text-sm text-[var(--text-muted)] mt-2">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <>
            {/* Mobile-friendly card view */}
            <div className="block lg:hidden space-y-4">
              {events.map((event) => {
                const { date, time } = formatDate(event.createdAt);
                return (
                  <div
                    key={event.id}
                    className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border)]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold text-[var(--text-primary)]">
                        {event.action}
                      </span>
                      <span className="px-2 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {event.entityType}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                      by{' '}
                      <span className="text-[var(--primary)] font-mono">
                        {event.actor.email}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      ID: {event.entityId}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {time} · {date}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Desktop table view */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">
                      Action
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">
                      Entity Type
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">
                      Entity ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">
                      Actor
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const { date, time } = formatDate(event.createdAt);
                    return (
                      <tr
                        key={event.id}
                        className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
                      >
                        <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                          {event.action}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                            {event.entityType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-[var(--text-secondary)]">
                          {event.entityId.substring(0, 12)}...
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-[var(--primary)]">
                          {event.actor.email}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                          {event.actor.role}
                        </td>
                        <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                          <div>{time}</div>
                          <div className="text-xs">{date}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && events.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                aria-label="Previous page"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages || loading}
                aria-label="Next page"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
