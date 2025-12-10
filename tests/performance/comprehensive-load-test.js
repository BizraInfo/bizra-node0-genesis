// ====================================================================
// BIZRA NODE0 - Comprehensive Performance Load Test
// احسان Standard: World-Class Performance Engineering
// Tool: k6 (Grafana Labs)
// ====================================================================

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ====================================================================
// Custom Metrics
// ====================================================================
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const metricsEndpointDuration = new Trend('metrics_endpoint_duration');
const requestCounter = new Counter('total_requests');

// ====================================================================
// Performance SLAs (احسان Standard)
// ====================================================================
export const options = {
  stages: [
    // Warm-up phase
    { duration: '30s', target: 10 },   // Ramp to 10 VUs

    // Load testing phases
    { duration: '1m', target: 50 },    // Ramp to 50 VUs
    { duration: '2m', target: 100 },   // Ramp to 100 VUs
    { duration: '3m', target: 200 },   // Peak load: 200 VUs

    // Stress testing phase
    { duration: '1m', target: 300 },   // Stress: 300 VUs

    // Cool-down phase
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],

  thresholds: {
    // احسان Standard SLAs
    'http_req_duration': [
      'p(95)<200',     // 95% of requests < 200ms
      'p(99)<500',     // 99% of requests < 500ms
    ],
    'http_req_failed': ['rate<0.01'],  // Error rate < 1%
    'errors': ['rate<0.01'],           // Custom error rate < 1%
    'health_check_duration': ['p(95)<100'],  // Health check < 100ms p95
    'metrics_endpoint_duration': ['p(95)<150'], // Metrics < 150ms p95
  },

  // احسان Standard: Data collection
  summaryTrendStats: ['min', 'avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// ====================================================================
// Test Configuration
// ====================================================================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const METRICS_URL = __ENV.METRICS_URL || 'http://localhost:9464';

// ====================================================================
// Test Scenarios
// ====================================================================

export default function () {
  // Scenario 1: Health Check (High Frequency)
  group('Health Check Endpoint', function () {
    const res = http.get(`${BASE_URL}/health`);

    const checkResult = check(res, {
      'health check status 200': (r) => r.status === 200,
      'health check has status field': (r) => JSON.parse(r.body).status === 'healthy',
      'health check has version': (r) => JSON.parse(r.body).version !== undefined,
      'health check has rustEnabled': (r) => JSON.parse(r.body).rustEnabled === true,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });

    healthCheckDuration.add(res.timings.duration);
    errorRate.add(!checkResult);
    requestCounter.add(1);
  });

  sleep(0.1); // Realistic user pacing

  // Scenario 2: Root API Endpoint
  group('Root API Endpoint', function () {
    const res = http.get(`${BASE_URL}/`);

    check(res, {
      'root status 200': (r) => r.status === 200,
      'root has chainId': (r) => JSON.parse(r.body).chainId === 'bizra-testnet-001',
      'root has endpoints': (r) => JSON.parse(r.body).endpoints !== undefined,
      'root response time < 200ms': (r) => r.timings.duration < 200,
    });

    requestCounter.add(1);
  });

  sleep(0.2);

  // Scenario 3: Readiness Probe
  group('Readiness Probe', function () {
    const res = http.get(`${BASE_URL}/ready`);

    check(res, {
      'readiness status 200': (r) => r.status === 200,
      'readiness response time < 50ms': (r) => r.timings.duration < 50,
    });

    requestCounter.add(1);
  });

  sleep(0.3);

  // Scenario 4: Metrics Endpoint (Lower Frequency)
  if (__ITER % 5 === 0) {  // Only every 5th iteration
    group('Prometheus Metrics', function () {
      const res = http.get(`${METRICS_URL}/metrics`);

      check(res, {
        'metrics status 200': (r) => r.status === 200,
        'metrics has content': (r) => r.body.length > 0,
        'metrics response time < 150ms': (r) => r.timings.duration < 150,
      });

      metricsEndpointDuration.add(res.timings.duration);
      requestCounter.add(1);
    });
  }
}

// ====================================================================
// Setup & Teardown (احسان Standard: Clean State)
// ====================================================================

export function setup() {
  console.log('🚀 BIZRA Performance Test Starting...');
  console.log(`📊 Target: ${BASE_URL}`);
  console.log(`📈 Metrics: ${METRICS_URL}`);

  // Verify endpoints are responsive before test
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('❌ Health check failed - target not ready');
  }

  console.log('✅ Target validated - test proceeding');
  return { startTime: new Date().toISOString() };
}

export function teardown(data) {
  console.log('🏁 Performance Test Complete');
  console.log(`⏱️  Started: ${data.startTime}`);
  console.log(`⏱️  Ended: ${new Date().toISOString()}`);
}

// ====================================================================
// Custom Summary (احسان Standard: Elite Reporting)
// ====================================================================

export function handleSummary(data) {
  const passed = Object.keys(data.metrics)
    .filter(name => name.includes('check'))
    .every(name => data.metrics[name].values.passes === data.metrics[name].values.value);

  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
    'performance-results.json': JSON.stringify(data, null, 2),
    'performance-summary.html': htmlReport(data),
  };
}

function textSummary(data, options) {
  const { indent = '', enableColors = false } = options;
  const metrics = data.metrics;

  let summary = '\n';
  summary += `${indent}====================================================================\n`;
  summary += `${indent}BIZRA NODE0 - Performance Test Results\n`;
  summary += `${indent}احسان Standard: World-Class Performance Validation\n`;
  summary += `${indent}====================================================================\n\n`;

  summary += `${indent}📊 REQUEST STATISTICS\n`;
  summary += `${indent}  Total Requests: ${metrics.total_requests?.values.count || 0}\n`;
  summary += `${indent}  Failed Requests: ${metrics.http_req_failed?.values.passes || 0} (${(metrics.http_req_failed?.values.rate * 100 || 0).toFixed(2)}%)\n\n`;

  summary += `${indent}⚡ LATENCY METRICS (احسان SLA: p95 < 200ms)\n`;
  summary += `${indent}  P50 (Median): ${metrics.http_req_duration?.values.med.toFixed(2)}ms\n`;
  summary += `${indent}  P90:          ${metrics.http_req_duration?.values['p(90)'].toFixed(2)}ms\n`;
  summary += `${indent}  P95:          ${metrics.http_req_duration?.values['p(95)'].toFixed(2)}ms `;
  summary += metrics.http_req_duration?.values['p(95)'] < 200 ? '✅\n' : '❌\n';
  summary += `${indent}  P99:          ${metrics.http_req_duration?.values['p(99)'].toFixed(2)}ms\n`;
  summary += `${indent}  Max:          ${metrics.http_req_duration?.values.max.toFixed(2)}ms\n\n`;

  summary += `${indent}🎯 ENDPOINT-SPECIFIC PERFORMANCE\n`;
  summary += `${indent}  Health Check P95: ${metrics.health_check_duration?.values['p(95)'].toFixed(2)}ms `;
  summary += metrics.health_check_duration?.values['p(95)'] < 100 ? '✅\n' : '❌\n';
  summary += `${indent}  Metrics P95:      ${metrics.metrics_endpoint_duration?.values['p(95)'].toFixed(2)}ms `;
  summary += metrics.metrics_endpoint_duration?.values['p(95)'] < 150 ? '✅\n\n' : '❌\n\n';

  const overallPass =
    (metrics.http_req_failed?.values.rate || 0) < 0.01 &&
    (metrics.http_req_duration?.values['p(95)'] || Infinity) < 200 &&
    (metrics.health_check_duration?.values['p(95)'] || Infinity) < 100;

  summary += `${indent}====================================================================\n`;
  summary += `${indent}${overallPass ? '✅ PERFORMANCE TEST PASSED' : '❌ PERFORMANCE TEST FAILED'}\n`;
  summary += `${indent}احسان Validation: ${overallPass ? 'Excellence Achieved' : 'Improvements Needed'}\n`;
  summary += `${indent}====================================================================\n`;

  return summary;
}

function htmlReport(data) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>BIZRA Performance Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    .metric { margin: 20px 0; padding: 15px; background: #ecf0f1; border-radius: 4px; }
    .pass { color: #27ae60; font-weight: bold; }
    .fail { color: #e74c3c; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 BIZRA NODE0 Performance Test Results</h1>
    <p><strong>احسان Standard:</strong> World-Class Performance Validation</p>
    <div class="metric">
      <h3>Request Statistics</h3>
      <p>Total Requests: ${data.metrics.total_requests?.values.count || 0}</p>
      <p>Error Rate: ${((data.metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%</p>
    </div>
    <div class="metric">
      <h3>Latency (احسان SLA: p95 < 200ms)</h3>
      <p>P95: ${data.metrics.http_req_duration?.values['p(95)'].toFixed(2)}ms
        <span class="${data.metrics.http_req_duration?.values['p(95)'] < 200 ? 'pass' : 'fail'}">
          ${data.metrics.http_req_duration?.values['p(95)'] < 200 ? '✅ PASS' : '❌ FAIL'}
        </span>
      </p>
      <p>P99: ${data.metrics.http_req_duration?.values['p(99)'].toFixed(2)}ms</p>
    </div>
  </div>
</body>
</html>`;
}
