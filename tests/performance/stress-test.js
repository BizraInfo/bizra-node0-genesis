/**
 * @test k6 Stress Testing Script
 * @description Stress test to find system breaking points
 * @run k6 run tests/performance/stress-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Warm up
    { duration: '2m', target: 200 },   // Stress level
    { duration: '2m', target: 500 },   // High stress
    { duration: '2m', target: 1000 },  // Breaking point
    { duration: '1m', target: 0 },     // Recovery
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'],  // 99% under 2s
    errors: ['rate<0.10'],               // Less than 10% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const start = Date.now();

  // Concurrent requests
  const requests = [
    {
      method: 'GET',
      url: `${BASE_URL}/api/health`,
    },
    {
      method: 'GET',
      url: `${BASE_URL}/api/users?page=1&limit=100`,
    },
  ];

  const responses = http.batch(requests);

  responses.forEach((res) => {
    check(res, {
      'status is 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  responseTime.add(Date.now() - start);

  sleep(0.1); // Minimal sleep for maximum stress
}
