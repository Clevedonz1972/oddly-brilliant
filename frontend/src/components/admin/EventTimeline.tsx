import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Event } from '../../types/governance';
import { Card } from '../common/Card';
import { Loading } from '../common/Loading';
import { ErrorMessage } from '../common/ErrorMessage';

interface EventTimelineProps {
  entityType: string;
  entityId: string;
}

/**
 * EventTimeline - Shows chronological event history for an entity
 * Displays as a vertical timeline with left border accent
 */
export const EventTimeline = ({ entityType, entityId }: EventTimelineProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<Event[]>(
          `/admin/events/${entityType}/${entityId}`
        );
        setEvents(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch events');
        console.error('Event timeline error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [entityType, entityId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  const getActionColor = (action: string): string => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create')) return 'border-[var(--success)]';
    if (lowerAction.includes('update') || lowerAction.includes('edit'))
      return 'border-[var(--primary)]';
    if (lowerAction.includes('delete') || lowerAction.includes('reject'))
      return 'border-[var(--error)]';
    if (lowerAction.includes('approve')) return 'border-[var(--success)]';
    return 'border-[var(--accent)]';
  };

  if (loading) {
    return (
      <Card>
        <Loading />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <ErrorMessage message={error} />
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
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
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">
        Event History
      </h3>

      <div className="space-y-4">
        {events.map((event, index) => {
          const { date, time } = formatDate(event.createdAt);
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className="relative">
              {/* Timeline Line */}
              {!isLast && (
                <div
                  className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-[var(--border)]"
                  aria-hidden="true"
                />
              )}

              {/* Event Item */}
              <div
                className={`relative pl-12 pb-4 border-l-4 ${getActionColor(
                  event.action
                )}`}
              >
                {/* Timeline Dot */}
                <div
                  className={`absolute left-[-10px] top-2 w-4 h-4 rounded-full bg-[var(--bg-surface)] border-4 ${getActionColor(
                    event.action
                  )}`}
                  aria-hidden="true"
                />

                {/* Event Content */}
                <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--border)] hover:border-[var(--primary)] transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[var(--text-primary)] mb-1">
                        {event.action}
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)]">
                        by{' '}
                        <span className="text-[var(--primary)] font-mono">
                          {event.actor.email}
                        </span>
                        {event.actor.role && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded bg-[var(--bg-surface)] border border-[var(--border)]">
                            {event.actor.role}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-[var(--text-primary)]">
                        {time}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{date}</p>
                    </div>
                  </div>

                  {/* Metadata */}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <details className="mt-3 group">
                      <summary className="text-xs text-[var(--primary)] cursor-pointer hover:underline list-none flex items-center gap-2">
                        <svg
                          className="w-4 h-4 transition-transform group-open:rotate-90"
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
                        View Details
                      </summary>
                      <pre className="mt-2 p-3 bg-[var(--bg-surface)] rounded text-xs font-mono text-[var(--text-secondary)] overflow-x-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
