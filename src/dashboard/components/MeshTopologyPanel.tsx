import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

type NodeStatus = 'healthy' | 'degraded' | 'unreachable' | 'unknown' | string;

interface MeshPeer {
  nodeId?: string;
  agentId?: string;
  shardId?: string;
  status?: string;
  [key: string]: unknown;
}

interface MeshNode {
  id: string;
  url: string;
  agentId: string | null;
  shardId: string | null;
  status: NodeStatus;
  peers: MeshPeer[];
  error?: string;
}

interface MeshMeta {
  timestamp: string;
  durationMs: number;
  nodeCount: number;
  reachableCount: number;
  unreachableCount: number;
  healthyCount: number;
  degradedCount: number;
  unknownCount: number;
  fullMesh: boolean;
}

interface MeshTopologyResponse {
  nodes: MeshNode[];
  meta: MeshMeta;
}

interface MeshTopologyPanelProps {
  /** How often to refresh in ms (default: 5000) */
  refreshIntervalMs?: number;
}

/**
 * MeshTopologyPanel
 *
 * Visualizes the current federation mesh topology using /api/mesh/topology
 * as the single source of truth.
 */
export const MeshTopologyPanel: React.FC<MeshTopologyPanelProps> = ({
  refreshIntervalMs = 5000,
}) => {
  const [data, setData] = useState<MeshTopologyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTopology = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/mesh/topology', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const json = (await res.json()) as MeshTopologyResponse;
      setData(json);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('[MeshTopologyPanel] fetch error', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch mesh topology'
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTopology();

    const id = setInterval(() => {
      void fetchTopology();
    }, refreshIntervalMs);

    return () => {
      clearInterval(id);
    };
  }, [fetchTopology, refreshIntervalMs]);

  const overallStatus = useMemo(() => {
    if (!data) {
      return 'unknown';
    }

    const { meta } = data;

    if (meta.fullMesh) return 'secure';
    if (meta.reachableCount === 0) return 'offline';
    if (meta.unreachableCount > 0 || meta.degradedCount > 0) return 'degraded';

    return 'unknown';
  }, [data]);

  const statusBadge = useMemo(() => {
    switch (overallStatus) {
      case 'secure':
        return {
          label: 'SECURE — Full Mesh',
          className:
            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40',
        };
      case 'degraded':
        return {
          label: 'DEGRADED — Partial Mesh',
          className:
            'bg-amber-500/10 text-amber-400 border border-amber-500/40',
        };
      case 'offline':
        return {
          label: 'OFFLINE — No Reachable Nodes',
          className:
            'bg-rose-500/10 text-rose-400 border border-rose-500/40',
        };
      default:
        return {
          label: 'UNKNOWN',
          className:
            'bg-slate-500/10 text-slate-300 border border-slate-500/40',
        };
    }
  }, [overallStatus]);

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
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
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:p-6 shadow-xl shadow-black/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">
            Federation Mesh Topology
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Live view of Node-0&apos;s federation mesh
            (self-healing, provable, and monitored).
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${statusBadge.className}`}
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-current" />
            {statusBadge.label}
          </span>
          <p className="text-[11px] text-slate-500">
            {loading && !data && 'Loading mesh status…'}
            {!loading && lastUpdated && (
              <>
                Last updated:{' '}
                <span className="font-mono text-slate-300">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-800/70 bg-rose-950/40 p-3 text-xs text-rose-200">
          <div className="font-semibold uppercase tracking-wide">
            Topology Fetch Error
          </div>
          <div className="mt-1 font-mono text-[11px]">{error}</div>
        </div>
      )}

      {/* Meta summary */}
      {data && (
        <div className="mt-4 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-3 sm:grid-cols-4">
          <MetaStat
            label="Nodes"
            value={data.meta.nodeCount}
            hint="Total registered nodes"
          />
          <MetaStat
            label="Reachable"
            value={data.meta.reachableCount}
            hint="Responding to health checks"
          />
          <MetaStat
            label="Unreachable"
            value={data.meta.unreachableCount}
            hint="Dead or partitioned"
            variant={data.meta.unreachableCount > 0 ? 'alert' : 'normal'}
          />
          <MetaStat
            label="Healthy"
            value={data.meta.healthyCount}
            hint="Reporting healthy/ok"
          />
          <div className="sm:col-span-4 mt-2 flex justify-between text-[11px] text-slate-500">
            <span>
              Full mesh:{' '}
              <span className="font-mono text-slate-200">
                {data.meta.fullMesh ? 'true' : 'false'}
              </span>
            </span>
            <span>
              Mesh latency:{' '}
              <span className="font-mono text-slate-200">
                {data.meta.durationMs.toFixed(0)} ms
              </span>
              {data.meta.timestamp && (
                <span className="ml-2">
                  @ {formatTime(data.meta.timestamp)}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Node cards */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {loading && !data && (
          <div className="col-span-3 text-center text-xs text-slate-500">
            Fetching mesh nodes…
          </div>
        )}

        {data &&
          data.nodes.map((node) => (
            <NodeCard key={node.id} node={node} />
          ))}
      </div>
    </div>
  );
};

interface MetaStatProps {
  label: string;
  value: number | string;
  hint?: string;
  variant?: 'normal' | 'alert';
}

const MetaStat: React.FC<MetaStatProps> = ({
  label,
  value,
  hint,
  variant = 'normal',
}) => {
  const valueClass =
    variant === 'alert'
      ? 'text-rose-300'
      : 'text-slate-50';

  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className={`mt-0.5 text-sm font-semibold ${valueClass}`}>
        {value}
      </span>
      {hint && (
        <span className="mt-0.5 text-[10px] text-slate-500">
          {hint}
        </span>
      )}
    </div>
  );
};

interface NodeCardProps {
  node: MeshNode;
}

const NodeCard: React.FC<NodeCardProps> = ({ node }) => {
  const statusConfig = useMemo(() => {
    switch (node.status) {
      case 'healthy':
        return {
          label: 'Healthy',
          dotClass: 'bg-emerald-400',
          textClass: 'text-emerald-300',
          chipClass: 'bg-emerald-500/10 border border-emerald-500/40',
        };
      case 'degraded':
        return {
          label: 'Degraded',
          dotClass: 'bg-amber-400',
          textClass: 'text-amber-300',
          chipClass: 'bg-amber-500/10 border border-amber-500/40',
        };
      case 'unreachable':
        return {
          label: 'Unreachable',
          dotClass: 'bg-rose-400',
          textClass: 'text-rose-300',
          chipClass: 'bg-rose-500/10 border border-rose-500/40',
        };
      default:
        return {
          label: node.status || 'Unknown',
          dotClass: 'bg-slate-400',
          textClass: 'text-slate-300',
          chipClass: 'bg-slate-500/10 border border-slate-500/40',
        };
    }
  }, [node.status]);

  const peerLabel = (peer: MeshPeer, index: number) => {
    if (peer.nodeId) return peer.nodeId;
    if (peer.agentId && peer.shardId)
      return `${peer.agentId.slice(0, 6)}… / ${peer.shardId}`;
    if (peer.agentId) return peer.agentId.slice(0, 10) + '…';
    if (peer.shardId) return peer.shardId;
    return `peer-${index + 1}`;
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-200">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Node {node.id}
            </span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-slate-500 truncate">
            {node.url}
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig.chipClass} ${statusConfig.textClass}`}
        >
          <span
            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`}
          />
          {statusConfig.label}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Shard
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-slate-200">
            {node.shardId ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Agent
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-slate-200 truncate">
            {node.agentId ?? '—'}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            Peers ({node.peers.length})
          </span>
        </div>
        {node.peers.length === 0 ? (
          <div className="mt-0.5 text-[11px] text-slate-500">
            No peers reported.
          </div>
        ) : (
          <div className="mt-1 flex flex-wrap gap-1">
            {node.peers.map((peer, idx) => (
              <span
                key={idx}
                className="rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[10px] font-mono text-slate-200"
              >
                {peerLabel(peer, idx)}
              </span>
            ))}
          </div>
        )}
      </div>

      {node.error && (
        <div className="mt-2 rounded-md border border-rose-800/50 bg-rose-950/40 p-1.5 text-[10px] text-rose-200">
          Error: {node.error}
        </div>
      )}
    </div>
  );
};
