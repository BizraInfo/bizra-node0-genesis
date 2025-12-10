import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * K6 Load Test Suite for API Performance
 * Target: <100ms response time (p95) under load
 *
 * Run with: k6 run api-load-test.js
 */

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const throughput = new Counter('requests');

// Test configuration
export const options = {
  scenarios: {
    // Baseline load test
    baseline: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
      gracefulStop: '30s',
      tags: { scenario: 'baseline' },
    },

    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '30s', target: 200 }, // Spike
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '30s',
      tags: { scenario: 'spike' },
      startTime: '3m',
    },

    // Stress test
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 100 },
        { duration: '2m', target: 150 },
        { duration: '2m', target: 0 },
      ],
      gracefulStop: '30s',
      tags: { scenario: 'stress' },
      startTime: '7m',
    },

    // Soak test (sustained load)
    soak: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
      gracefulStop: '30s',
      tags: { scenario: 'soak' },
      startTime: '17m',
    },
  },

  // Performance thresholds
  thresholds: {
    // Response time requirements
    'http_req_duration': [
      'p(50) < 30',    // 50th percentile < 30ms
      'p(95) < 100',   // 95th percentile < 100ms (TARGET)
      'p(99) < 200',   // 99th percentile < 200ms
    ],

    // Error rate requirements
    'http_req_failed': ['rate < 0.01'], // Error rate < 1%
    'errors': ['rate < 0.01'],

    // Throughput requirements
    'http_reqs': ['rate > 100'], // > 100 requests/sec

    // Request duration breakdown
    'http_req_waiting': ['p(95) < 80'], // Server processing time
    'http_req_connecting': ['p(95) < 5'], // Connection time
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-api-key';

// Test data
const testUsers = [];
for (let i = 0; i < 100; i++) {
  testUsers.push({
    id: `user-${i}`,
    email: `user${i}@example.com`,
    name: `Test User ${i}`,
  });
}

// Setup function (runs once)
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);

  // Health check
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    'API is healthy': (r) => r.status === 200,
  });

  return { startTime: Date.now() };
}

// Main test function (runs for each VU iteration)
export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };

  // Test 1: List users (GET with pagination)
  testListUsers(headers);
  sleep(0.5);

  // Test 2: Get single user (GET by ID)
  testGetUser(headers);
  sleep(0.5);

  // Test 3: Create user (POST)
  testCreateUser(headers);
  sleep(0.5);

  // Test 4: Update user (PUT)
  testUpdateUser(headers);
  sleep(0.5);

  // Test 5: Search users (GET with query)
  testSearchUsers(headers);
  sleep(0.5);

  // Test 6: Complex query with joins
  testComplexQuery(headers);
  sleep(1);
}

// Test functions

function testListUsers(headers) {
  const url = `${BASE_URL}/api/users?limit=20&sortField=id&sortOrder=desc`;
  const startTime = Date.now();

  const response = http.get(url, { headers });
  const duration = Date.now() - startTime;

  responseTime.add(duration);
  throughput.add(1);

  const success = check(response, {
    'List users - status 200': (r) => r.status === 200,
    'List users - has data': (r) => r.json('data') !== undefined,
    'List users - has pagination': (r) => r.json('pagination') !== undefined,
    'List users - response time < 100ms': () => duration < 100,
  });

  if (!success) {
    errorRate.add(1);
  }
}

function testGetUser(headers) {
  const userId = testUsers[Math.floor(Math.random() * testUsers.length)].id;
  const url = `${BASE_URL}/api/users/${userId}`;
  const startTime = Date.now();

  const response = http.get(url, { headers });
  const duration = Date.now() - startTime;

  responseTime.add(duration);
  throughput.add(1);

  const success = check(response, {
    'Get user - status 200': (r) => r.status === 200,
    'Get user - has data': (r) => r.json('data') !== undefined,
    'Get user - response time < 50ms': () => duration < 50,
  });

  if (!success) {
    errorRate.add(1);
  }
}

function testCreateUser(headers) {
  const url = `${BASE_URL}/api/users`;
  const payload = JSON.stringify({
    email: `test${Date.now()}@example.com`,
    name: `Load Test User`,
    password: 'TestPassword123!',
  });
  const startTime = Date.now();

  const response = http.post(url, payload, { headers });
  const duration = Date.now() - startTime;

  responseTime.add(duration);
  throughput.add(1);

  const success = check(response, {
    'Create user - status 201': (r) => r.status === 201,
    'Create user - has id': (r) => r.json('data.id') !== undefined,
    'Create user - response time < 100ms': () => duration < 100,
  });

  if (!success) {
    errorRate.add(1);
  }
}

function testUpdateUser(headers) {
  const userId = testUsers[Math.floor(Math.random() * testUsers.length)].id;
  const url = `${BASE_URL}/api/users/${userId}`;
  const payload = JSON.stringify({
    name: `Updated User ${Date.now()}`,
  });
  const startTime = Date.now();

  const response = http.put(url, payload, { headers });
  const duration = Date.now() - startTime;

  responseTime.add(duration);
  throughput.add(1);

  const success = check(response, {
    'Update user - status 200': (r) => r.status === 200,
    'Update user - response time < 100ms': () => duration < 100,
  });

  if (!success) {
    errorRate.add(1);
  }
}

function testSearchUsers(headers) {
  const searchTerm = ['test', 'user', 'example'][Math.floor(Math.random() * 3)];
  const url = `${BASE_URL}/api/users/search?q=${searchTerm}&limit=20`;
  const startTime = Date.now();

  const response = http.get(url, { headers });
  const duration = Date.now() - startTime;

  responseTime.add(duration);
  throughput.add(1);

  const success = check(response, {
    'Search users - status 200': (r) => r.status === 200,
    'Search users - has results': (r) => r.json('data') !== undefined,
    'Search users - response time < 150ms': () => duration < 150,
  });

  if (!success) {
    errorRate.add(1);
  }
}

function testComplexQuery(headers) {
  const url = `${BASE_URL}/api/analytics/user-activity?period=7d&groupBy=day`;
  const startTime = Date.now();

  const response = http.get(url, { headers });
  const duration = Date.now() - startTime;

  responseTime.add(duration);
  throughput.add(1);

  const success = check(response, {
    'Complex query - status 200': (r) => r.status === 200,
    'Complex query - has data': (r) => r.json('data') !== undefined,
    'Complex query - response time < 200ms': () => duration < 200,
  });

  if (!success) {
    errorRate.add(1);
  }
}

// Teardown function (runs once at end)
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration}s`);
}

// Handle test summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data),
  };
}

// Helper function for text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n' + indent + '==========================================\n';
  summary += indent + 'Performance Test Summary\n';
  summary += indent + '==========================================\n\n';

  // Response times
  summary += indent + 'Response Times:\n';
  summary += indent + `  p50: ${data.metrics.http_req_duration.values.p50.toFixed(2)}ms\n`;
  summary += indent + `  p95: ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms\n`;
  summary += indent + `  p99: ${data.metrics.http_req_duration.values.p99.toFixed(2)}ms\n\n`;

  // Throughput
  summary += indent + 'Throughput:\n';
  summary += indent + `  Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `  Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;

  // Error rate
  summary += indent + 'Error Rate:\n';
  summary += indent + `  Failed: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n\n`;

  return summary;
}

// Helper function for HTML report
function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { margin: 10px 0; }
    .pass { color: green; }
    .fail { color: red; }
  </style>
</head>
<body>
  <h1>Performance Test Report</h1>
  <div class="metrics">
    <div class="metric">
      <h3>Response Times</h3>
      <p>p50: ${data.metrics.http_req_duration.values.p50.toFixed(2)}ms</p>
      <p>p95: ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms</p>
      <p>p99: ${data.metrics.http_req_duration.values.p99.toFixed(2)}ms</p>
    </div>
    <div class="metric">
      <h3>Throughput</h3>
      <p>Total Requests: ${data.metrics.http_reqs.values.count}</p>
      <p>Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}</p>
    </div>
  </div>
</body>
</html>
  `;
}
