// node0/routes/mesh_topology.js
// Aggregates per-node /api/p2p/status into a single mesh view.

const axios = require('axios');

// Declare your known federation nodes here (or pull from config).
// These should match what you use in prove_federation + chaos tests.
const NODES = [
  {
    id: 'A',
    url: process.env.NODE_A_URL || 'http://node-a:8083',
  },
  {
    id: 'B',
    url: process.env.NODE_B_URL || 'http://node-b:8081',
  },
  {
    id: 'C',
    url: process.env.NODE_C_URL || 'http://node-c:8082',
  },
];

async function getMeshTopology(req, res) {
  try {
    const startedAt = Date.now();

    // Use allSettled so one dead node doesn't kill the whole response.
    const results = await Promise.allSettled(
      NODES.map(async (node) => {
        const { data } = await axios.get(`${node.url}/api/p2p/status`, {
          timeout: 2000,
        });
        return { node, status: data };
      })
    );

    const nodes = [];
    let healthyCount = 0;
    let degradedCount = 0;
    let unreachableCount = 0;
    let unknownCount = 0;

    for (const r of results) {
      if (r.status === 'fulfilled') {
        const { node, status } = r.value;

        const nodeStatus = status.status || 'unknown';
        if (nodeStatus === 'healthy' || nodeStatus === 'ok') healthyCount += 1;
        else if (nodeStatus === 'degraded') degradedCount += 1;
        else unknownCount += 1;

        nodes.push({
          id: node.id,
          url: node.url,
          agentId: status.agentId || null,
          shardId: status.shardId || null,
          status: nodeStatus,
          peers: Array.isArray(status.peers) ? status.peers : [],
        });
      } else {
        // Node unreachable
        const idx = results.indexOf(r);
        const node = NODES[idx];
        unreachableCount += 1;

        nodes.push({
          id: node.id,
          url: node.url,
          agentId: null,
          shardId: null,
          status: 'unreachable',
          peers: [],
          error: r.reason ? String(r.reason.message || r.reason) : 'unreachable',
        });
      }
    }

    const nodeCount = nodes.length;
    const reachableCount = nodeCount - unreachableCount;

    // Full mesh = all reachable, all healthy, and each sees N-1 peers
    const fullMesh =
      nodeCount > 0 &&
      unreachableCount === 0 &&
      healthyCount === nodeCount &&
      nodes.every((n) => n.peers.length === nodeCount - 1);

    const response = {
      nodes,
      meta: {
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        nodeCount,
        reachableCount,
        unreachableCount,
        healthyCount,
        degradedCount,
        unknownCount,
        fullMesh,
      },
    };

    res.json(response);
  } catch (err) {
    // This should only happen on real code/infra bugs, not mesh issues
    console.error('[mesh_topology] FATAL aggregation error:', err);
    res.status(500).json({
      error: 'Failed to aggregate mesh topology',
      message: err.message || String(err),
    });
  }
}

module.exports = {
  getMeshTopology,
};
