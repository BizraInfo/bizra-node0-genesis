// node0/routes/mesh_events.js

const express = require('express');
const router = express.Router();
const { getEvents, recordEvent, getResilienceMetrics } = require('../lib/meshEventLog');

/**
 * POST /api/mesh/events
 * 
 * Records a new resilience/mesh event.
 * Body: { type, severity, message, source, details? }
 */
router.post('/mesh/events', (req, res) => {
  try {
    const { type, severity, message, source, details } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ error: 'MISSING_FIELDS', message: 'type and message are required' });
    }

    const event = recordEvent({
      type,
      severity: severity || 'info',
      message,
      source: source || 'api',
      details
    });

    res.status(201).json({ event });
  } catch (err) {
    console.error('[mesh_events] failed to record event:', err);
    res.status(500).json({ error: 'FAILED_TO_RECORD_EVENT' });
  }
});

/**
 * GET /api/mesh/resilience/summary
 * 
 * Returns calculated SLO/MTTR metrics from the event log.
 */
router.get('/mesh/resilience/summary', (req, res) => {
  try {
    const metrics = getResilienceMetrics();
    res.status(200).json(metrics);
  } catch (err) {
    console.error('[mesh_events] failed to get metrics:', err);
    res.status(500).json({ error: 'FAILED_TO_GET_METRICS' });
  }
});

/**
 * GET /api/mesh/events
 *
 * Returns the latest resilience/mesh events.
 * Query:
 *   - limit: number (optional)
 */
router.get('/mesh/events', async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const events = getEvents(
      Number.isFinite(limit) && limit > 0 ? limit : undefined
    );

    res.status(200).json({
      events,
      meta: {
        count: events.length,
        // last event timestamp if any
        lastTimestamp:
          events.length > 0 ? events[0].timestamp : null,
      },
    });
  } catch (err) {
    console.error('[mesh_events] failed:', err);
    res.status(500).json({
      error: 'FAILED_TO_FETCH_MESH_EVENTS',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

module.exports = router;
