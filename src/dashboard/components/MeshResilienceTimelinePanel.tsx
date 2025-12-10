import React, { useEffect, useState, useCallback } from 'react';

type MeshEventSeverity = 'info' | 'warning' | 'critical' | string;

interface MeshEvent {
  id: string;
  type: string;
  severity: MeshEventSeverity;
  message: string;
  source: string;
  nodeId?: string | null;
  correlationId?: string | null;
  timestamp: string;
  meta?: Record<string, unknown>;
}

interface MeshEventsResponse {
  events: MeshEvent[];
  meta: {
    count: number;
    lastTimestamp: string | null;
  };
}

interface MeshResilienceTimelinePanelProps {
  /** Max events to fetch (default: 50) */
  limit?: number;
  /** Refresh interval in ms (default: 5000) */
  refreshIntervalMs?: number;
}

export const MeshResilienceTimelinePanel: React.FC<
  MeshResilienceTimelinePanelProps
> = ({ limit = 50, refreshIntervalMs = 5000 }) => {
  const [events, setEvents] = useState<MeshEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (limit) params.set('limit', String(limit));

      const res = await fetch(`/api/mesh/events?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const json = (await res.json()) as MeshEventsResponse;
      setEvents(json.events ?? []);
      setLoading(false);
    } catch (err) {
      console.error('[MeshResilienceTimelinePanel] fetch error', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch mesh events'
      );
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchEvents();

    const id = setInterval(() => {
      void fetchEvents();
    }, refreshIntervalMs);

    return () => {
      clearInterval(id);
    };
  }, [fetchEvents, refreshIntervalMs]);

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6 shadow-xl shadow-black/40">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">
            Mesh Resilience Timeline
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Chronological log of mesh degradation, recovery, and chaos tests.
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          Auto-refreshing every{' '}
          <span className="font-mono text-slate-300">
            {refreshIntervalMs / 1000}s
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-800/70 bg-rose-950/40 p-3 text-xs text-rose-200">
          <div className="font-semibold uppercase tracking-wide">
            Resilience Log Error
          </div>
          <div className="mt-1 font-mono text-[11px]">{error}</div>
        </div>
      )}

      {loading && !events.length && (
        <div className="mt-4 text-xs text-slate-500">
          Loading resilience events…
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <div className="mt-4 text-xs text-slate-500">
          No resilience events recorded yet.
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-4 max-h-80 overflow-y-auto pr-1">
          <ol className="space-y-2">
            {events.map((evt) => (
              <li
                key={evt.id}
                className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs"
              >
                <SeverityDot severity={evt.severity} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400">
                      {formatTime(evt.timestamp)}
                    </span>
                    <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-slate-200">
                      {evt.type}
                    </span>
                    {evt.nodeId && (
                      <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        Node: {evt.nodeId}
                      </span>
                    )}
                    {evt.correlationId && (
                      <span className="rounded-full border border-slate-800 bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                        Run: {shorten(evt.correlationId)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-slate-50">{evt.message}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                    <span>Source: {evt.source}</span>
                    {evt.meta && Object.keys(evt.meta).length > 0 && (
                      <span className="rounded border border-slate-800 bg-slate-950/80 px-1.5 py-0.5 font-mono">
                        meta: {JSON.stringify(evt.meta)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

interface SeverityDotProps {
  severity: MeshEventSeverity;
}

const SeverityDot: React.FC<SeverityDotProps> = ({ severity }) => {
  let dotClass = 'bg-slate-500';
  switch (severity) {
    case 'info':
      dotClass = 'bg-sky-400';
      break;
    case 'warning':
      dotClass = 'bg-amber-400';
      break;
    case 'critical':
      dotClass = 'bg-rose-500';
      break;
  }
  return (
    <div className="mt-1">
      <span className={`block h-2.5 w-2.5 rounded-full ${dotClass}`} />
    </div>
  );
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function shorten(id: string) {
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
