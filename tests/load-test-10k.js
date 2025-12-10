/**
 * BIZRA Inference Server - Load Test for 10K Users
 * احسان: Performance validation under production load
 *
 * Run: k6 run --vus 100 --duration 5m tests/load-test-10k.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const ihsanPassRate = new Rate('ihsan_pass');
const latency = new Trend('latency_ms');
const throughput = new Trend('throughput_tokens_per_sec');
const totalTokens = new Counter('total_tokens_generated');

// Test configuration
export const options = {
  stages: [
    // Ramp up: 0 -> 1000 users over 2 minutes
    { duration: '2m', target: 1000 },

    // Sustain: 1000 users for 3 minutes
    { duration: '3m', target: 1000 },

    // Spike test: 1000 -> 5000 users for 1 minute
    { duration: '1m', target: 5000 },
    { duration: '2m', target: 5000 },

    // Scale to 10K: 5000 -> 10000 users over 2 minutes
    { duration: '2m', target: 10000 },
    { duration: '3m', target: 10000 },

    // Ramp down: 10000 -> 0 over 1 minute
    { duration: '1m', target: 0 }
  ],

  thresholds: {
    // احsان targets
    'http_req_duration': ['p(95)<1000'], // p95 < 1s
    'errors': ['rate<0.01'],             // Error rate < 1%
    'ihsan_pass': ['rate>0.80'],         // 80%+ احسان pass rate
    'latency_ms': ['p(95)<1000'],        // p95 latency < 1s
    'throughput_tokens_per_sec': ['avg>30'], // Avg throughput >= 30 tokens/sec
  },

  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// Load balancer / ingress URL
const BASE_URL = __ENV.INFERENCE_URL || 'http://localhost:8000';

// Test prompts (variety)
const prompts = [
  'What is احسان in BIZRA?',
  'Explain the Proof of Impact mechanism.',
  'How does BIZRA serve 10K users?',
  'What makes BIZRA different from other blockchain projects?',
  'Describe the BIZRA token economy.',
];

export default function () {
  // Random prompt selection
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  // Random user ID (simulating different users)
  const userId = `user-${Math.floor(Math.random() * 10000)}`;

  const payload = JSON.stringify({
    model: 'bizra-inference',
    prompt: prompt,
    max_tokens: 100,
    temperature: 0.7,
    top_p: 0.9,
    user_id: userId
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': `req-${Date.now()}-${Math.random()}`,
    },
    timeout: '30s', // 30s timeout
  };

  const start = Date.now();
  const response = http.post(`${BASE_URL}/v1/completions`, payload, params);
  const duration = Date.now() - start;

  // Record latency
  latency.add(duration);

  // Check response
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'has completion': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.choices && body.choices.length > 0;
      } catch (e) {
        return false;
      }
    },
    'has usage metrics': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.usage && 'latency_ms' in body.usage;
      } catch (e) {
        return false;
      }
    },
  });

  if (success && response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      const usage = body.usage;

      // Record throughput
      if (usage.throughput_tokens_per_sec) {
        throughput.add(usage.throughput_tokens_per_sec);
      }

      // Record tokens generated
      if (usage.completion_tokens) {
        totalTokens.add(usage.completion_tokens);
      }

      // احسان validation
      if (usage.ihsan_pass !== undefined) {
        ihsanPassRate.add(usage.ihsan_pass);
      }

      errorRate.add(0);
    } catch (e) {
      console.error('Failed to parse response:', e);
      errorRate.add(1);
    }
  } else {
    errorRate.add(1);
    console.error(`Request failed: ${response.status} - ${response.body}`);
  }

  // Random think time (0.5-2s between requests)
  sleep(Math.random() * 1.5 + 0.5);
}

// Custom summary
export function handleSummary(data) {
  console.log('');
  console.log('='.repeat(70));
  console.log('BIZRA Inference Server - Load Test Results (10K Users)');
  console.log('='.repeat(70));
  console.log('');

  const metrics = data.metrics;

  // Request stats
  console.log('📊 Request Statistics:');
  console.log(`  Total Requests: ${metrics.http_reqs.values.count}`);
  console.log(`  Requests/sec:   ${metrics.http_reqs.values.rate.toFixed(2)}`);
  console.log(`  Error Rate:     ${(metrics.errors.values.rate * 100).toFixed(2)}%`);
  console.log('');

  // Latency stats
  console.log('⏱️  Latency (احسان target: p95 < 1000ms):');
  console.log(`  Average: ${metrics.latency_ms.values.avg.toFixed(2)}ms`);
  console.log(`  p50:     ${metrics.latency_ms.values.med.toFixed(2)}ms`);
  console.log(`  p95:     ${metrics.latency_ms.values['p(95)'].toFixed(2)}ms`);
  console.log(`  p99:     ${metrics.latency_ms.values['p(99)'].toFixed(2)}ms`);
  console.log(`  Max:     ${metrics.latency_ms.values.max.toFixed(2)}ms`);
  console.log('');

  // Throughput stats
  console.log('⚡ Throughput (احسان target: avg >= 30 tokens/sec):');
  console.log(`  Average: ${metrics.throughput_tokens_per_sec.values.avg.toFixed(2)} tokens/sec`);
  console.log(`  p50:     ${metrics.throughput_tokens_per_sec.values.med.toFixed(2)} tokens/sec`);
  console.log(`  p95:     ${metrics.throughput_tokens_per_sec.values['p(95)'].toFixed(2)} tokens/sec`);
  console.log('');

  // احسان validation
  const ihsanPass = metrics.ihsan_pass.values.rate * 100;
  console.log('✨ احسان Validation:');
  console.log(`  Pass Rate:      ${ihsanPass.toFixed(2)}%`);
  console.log(`  Total Tokens:   ${metrics.total_tokens_generated.values.count}`);
  console.log('');

  // Final verdict
  const p95Latency = metrics.latency_ms.values['p(95)'];
  const avgThroughput = metrics.throughput_tokens_per_sec.values.avg;
  const errorPct = metrics.errors.values.rate * 100;

  const latencyPass = p95Latency < 1000;
  const throughputPass = avgThroughput >= 30;
  const errorPass = errorPct < 1;
  const ihsanPassThreshold = ihsanPass >= 80;

  const allPass = latencyPass && throughputPass && errorPass && ihsanPassThreshold;

  console.log('='.repeat(70));
  if (allPass) {
    console.log('✅ احسان PASS - Ready for 10K users!');
  } else {
    console.log('❌ احسان FAIL - Performance targets not met:');
    if (!latencyPass) console.log(`   ❌ p95 latency: ${p95Latency.toFixed(2)}ms >= 1000ms`);
    if (!throughputPass) console.log(`   ❌ Throughput: ${avgThroughput.toFixed(2)} < 30 tokens/sec`);
    if (!errorPass) console.log(`   ❌ Error rate: ${errorPct.toFixed(2)}% >= 1%`);
    if (!ihsanPassThreshold) console.log(`   ❌ احسان pass rate: ${ihsanPass.toFixed(2)}% < 80%`);
  }
  console.log('='.repeat(70));
  console.log('');

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  // Use k6's built-in textSummary if available
  return JSON.stringify(data.metrics, null, 2);
}
