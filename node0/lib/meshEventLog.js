// node0/lib/meshEventLog.js

/**
 * Simple in-memory resilience event log.
 * - Ring buffer: keeps only the latest N events (default: 200)
 * - Meant for federation/mesh health + chaos experiments
 */

const MAX_EVENTS = 200;

/**
 * @typedef {Object} MeshEvent
 * @property {string} id           // unique id
 * @property {string} type         // e.g. 'MESH_STATUS_CHANGE', 'NODE_UNREACHABLE', 'NODE_RECOVERED', 'CHAOS_TEST'
 * @property {string} severity     // 'info' | 'warning' | 'critical'
 * @property {string} message      // human-readable summary
 * @property {string} source       // 'mesh_topology', 'test:meta:federation:chaos', etc.
 * @property {string} [nodeId]     // optional node id, e.g. 'node-b'
 * @property {string} [correlationId] // test run id / trace id
 * @property {string} timestamp    // ISO string
 * @property {Object} [meta]       // any extra JSON data (before/after states, counts, etc.)
 */

const events = [];

/**
 * Push a new event into the log.
 * @param {Partial<MeshEvent>} evt
 * @returns {MeshEvent}
 */
function recordEvent(evt) {
  const full = {
    id: evt.id || `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type: evt.type || 'UNKNOWN',
    severity: evt.severity || 'info',
    message: evt.message || '',
    source: evt.source || 'unknown',
    nodeId: evt.nodeId || null,
    correlationId: evt.correlationId || null,
    timestamp: evt.timestamp || new Date().toISOString(),
    meta: evt.meta || {},
  };

  events.push(full);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  return full;
}

/**
 * Get events in reverse chronological order (newest first).
 * @param {number} [limit]
 * @returns {MeshEvent[]}
 */
function getEvents(limit) {
  const list = [...events].reverse();
  if (typeof limit === 'number') {
    return list.slice(0, limit);
  }
  return list;
}

/**
 * Calculate resilience metrics from the event log.
 * @returns {Object}
 */
function getResilienceMetrics() {
  let incidentCount = 0;
  const recoveryTimes = [];
  let lastIncidentAt = null;
  let lastRecoverySeconds = 0;
  
  // Iterate chronologically
  let currentIncidentStart = null;

  for (const evt of events) {
    if (evt.type === 'MESH_DEGRADED') {
      currentIncidentStart = new Date(evt.timestamp).getTime();
      lastIncidentAt = evt.timestamp;
    } else if (evt.type === 'MESH_RECOVERED' && currentIncidentStart !== null) {
      const end = new Date(evt.timestamp).getTime();
      const duration = (end - currentIncidentStart) / 1000; // seconds
      
      recoveryTimes.push(duration);
      lastRecoverySeconds = duration;
      incidentCount++;
      currentIncidentStart = null;
    }
  }

  // Calculate stats
  recoveryTimes.sort((a, b) => a - b);
  const medianRecoverySeconds = recoveryTimes.length > 0 
    ? recoveryTimes[Math.floor(recoveryTimes.length / 2)] 
    : 0;
  const maxRecoverySeconds = recoveryTimes.length > 0 
    ? recoveryTimes[recoveryTimes.length - 1] 
    : 0;

  // Determine window (time between first and last event, or 0)
  const sloWindowSeconds = events.length > 1
    ? (new Date(events[events.length - 1].timestamp).getTime() - new Date(events[0].timestamp).getTime()) / 1000
    : 0;

  return {
    incidentCount,
    medianRecoverySeconds,
    maxRecoverySeconds,
    lastIncidentAt,
    lastRecoverySeconds,
    sloWindowSeconds,
    totalEvents: events.length
  };
}

/**
 * Clear the log (used in tests if needed).
 */
function clearEvents() {
  events.length = 0;
}

module.exports = {
  recordEvent,
  getEvents,
  getResilienceMetrics,
  clearEvents,
};
