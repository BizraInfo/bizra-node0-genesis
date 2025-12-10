# Rate Limiting Guide

## Overview

The API implements a sophisticated multi-tier rate limiting system using the **Token Bucket algorithm** with distributed state management via Redis for horizontal scalability.

## Rate Limit Tiers

### Global Rate Limits

| Tier           | Requests/Minute | Requests/Hour | Burst Capacity |
| -------------- | --------------- | ------------- | -------------- |
| **Free**       | 60              | 1,000         | 100            |
| **Pro**        | 600             | 10,000        | 1,000          |
| **Enterprise** | 6,000           | 100,000       | 10,000         |

### Endpoint-Specific Limits

#### Authentication Endpoints

| Endpoint                    | Rate Limit  | Window     | Reason                            |
| --------------------------- | ----------- | ---------- | --------------------------------- |
| `POST /auth/login`          | 5 requests  | 15 minutes | Brute force protection            |
| `POST /auth/register`       | 3 requests  | 1 hour     | Account creation abuse prevention |
| `POST /auth/refresh`        | 20 requests | 1 hour     | Token refresh abuse prevention    |
| `POST /auth/password-reset` | 3 requests  | 1 hour     | Email flooding prevention         |

#### Resource Endpoints

| Endpoint Category        | Free Tier | Pro Tier  | Enterprise Tier |
| ------------------------ | --------- | --------- | --------------- |
| `GET /users`             | 30/min    | 300/min   | 3,000/min       |
| `POST /users`            | 10/min    | 100/min   | 1,000/min       |
| `GET /projects`          | 60/min    | 600/min   | 6,000/min       |
| `POST /analytics/events` | 100/min   | 1,000/min | 10,000/min      |

#### Webhook Endpoints

| Endpoint                 | Rate Limit | Notes                                  |
| ------------------------ | ---------- | -------------------------------------- |
| `POST /webhooks`         | 10/hour    | Webhook creation                       |
| Webhook delivery retries | 3 attempts | Exponential backoff: 1min, 5min, 15min |

## Rate Limit Headers

Every API response includes rate limit information:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 985
X-RateLimit-Reset: 1642262400
X-RateLimit-Reset-After: 3475
X-RateLimit-Bucket: user:usr_1a2b3c4d5e
X-RateLimit-Policy: 1000/hour
Retry-After: 3475
```

### Header Descriptions

| Header                    | Type    | Description                                |
| ------------------------- | ------- | ------------------------------------------ |
| `X-RateLimit-Limit`       | Integer | Maximum requests allowed in current window |
| `X-RateLimit-Remaining`   | Integer | Requests remaining in current window       |
| `X-RateLimit-Reset`       | Integer | UTC epoch timestamp when limit resets      |
| `X-RateLimit-Reset-After` | Integer | Seconds until rate limit resets            |
| `X-RateLimit-Bucket`      | String  | Identifier for rate limit bucket (user/IP) |
| `X-RateLimit-Policy`      | String  | Human-readable rate limit policy           |
| `Retry-After`             | Integer | Seconds to wait before retrying (429 only) |

## Rate Limit Enforcement

### Token Bucket Algorithm

```
Initial bucket: 1000 tokens
Refill rate: 16.67 tokens/second (1000/minute)
Max burst: 1000 tokens

Request flow:
1. Check available tokens in bucket
2. If tokens >= 1, consume 1 token and allow request
3. If tokens < 1, reject with 429 Too Many Requests
4. Bucket refills continuously at refill rate
```

### Example: Token Bucket State

```json
{
  "userId": "usr_1a2b3c4d5e",
  "bucket": {
    "tokens": 985,
    "capacity": 1000,
    "refillRate": 16.67,
    "lastRefill": 1642262400
  },
  "window": {
    "start": 1642260000,
    "end": 1642263600,
    "duration": 3600
  }
}
```

## Rate Limit Response

### 429 Too Many Requests

```json
{
  "error": "RateLimitExceeded",
  "message": "Rate limit exceeded. Please try again in 58 minutes",
  "statusCode": 429,
  "details": {
    "limit": 1000,
    "remaining": 0,
    "resetAt": "2025-01-17T12:00:00Z",
    "resetAfter": 3475,
    "policy": "1000 requests per hour"
  },
  "requestId": "req_abc123xyz",
  "timestamp": "2025-01-17T11:02:05Z"
}
```

**HTTP Headers:**

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1642262400
Retry-After: 3475
Content-Type: application/json
```

## Rate Limiting Strategies

### 1. User-Based Rate Limiting

Rate limits applied per authenticated user ID:

```javascript
// Rate limit key: user:{userId}
const rateLimitKey = `ratelimit:user:${userId}`;
```

**Use cases:**

- Standard API usage
- Authenticated endpoints
- User-specific quotas

### 2. IP-Based Rate Limiting

Rate limits applied per client IP address:

```javascript
// Rate limit key: ip:{ipAddress}
const rateLimitKey = `ratelimit:ip:${clientIp}`;
```

**Use cases:**

- Public endpoints (login, register)
- Unauthenticated requests
- DDoS protection

### 3. Endpoint-Based Rate Limiting

Different limits per endpoint pattern:

```javascript
// Rate limit key: user:{userId}:endpoint:{endpoint}
const rateLimitKey = `ratelimit:user:${userId}:endpoint:/auth/login`;
```

**Use cases:**

- Critical endpoints (authentication)
- Resource-intensive operations
- Webhook deliveries

### 4. Organization-Based Rate Limiting

Shared limits across organization members:

```javascript
// Rate limit key: org:{orgId}
const rateLimitKey = `ratelimit:org:${organizationId}`;
```

**Use cases:**

- Enterprise tier customers
- Team quotas
- Shared resource pools

## Handling Rate Limits

### Client-Side Best Practices

**1. Implement Exponential Backoff**

```javascript
async function apiRequest(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After")) || 60;
      const backoffTime = Math.min(retryAfter * 1000, 2 ** attempt * 1000);

      console.log(`Rate limited. Retrying in ${backoffTime / 1000}s...`);
      await sleep(backoffTime);
      continue;
    }

    return response;
  }

  throw new Error("Max retries exceeded");
}
```

**2. Monitor Rate Limit Headers**

```javascript
function checkRateLimit(response) {
  const remaining = parseInt(response.headers.get("X-RateLimit-Remaining"));
  const limit = parseInt(response.headers.get("X-RateLimit-Limit"));

  if (remaining < limit * 0.1) {
    console.warn(
      `Rate limit warning: ${remaining}/${limit} requests remaining`,
    );
  }

  return {
    limit,
    remaining,
    resetAt: new Date(
      parseInt(response.headers.get("X-RateLimit-Reset")) * 1000,
    ),
  };
}
```

**3. Implement Request Queuing**

```javascript
class RateLimitedQueue {
  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.queue = [];
    this.requestTimes = [];
  }

  async enqueue(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.queue.length === 0) return;

    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      (time) => now - time < this.windowMs,
    );

    if (this.requestTimes.length < this.maxRequests) {
      const { requestFn, resolve, reject } = this.queue.shift();
      this.requestTimes.push(now);

      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      setTimeout(() => this.processQueue(), 0);
    } else {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      setTimeout(() => this.processQueue(), waitTime);
    }
  }
}

// Usage
const apiQueue = new RateLimitedQueue(60, 60000);
const users = await apiQueue.enqueue(() => fetch("/api/users"));
```

### Server-Side Configuration

**Redis Rate Limiter Implementation:**

```javascript
// Node.js with ioredis
const Redis = require("ioredis");
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

async function rateLimiter(userId, maxRequests = 1000, windowSeconds = 3600) {
  const key = `ratelimit:user:${userId}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Use Redis sorted set for sliding window
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart); // Remove old entries
  pipeline.zadd(key, now, `${now}-${Math.random()}`); // Add current request
  pipeline.zcount(key, windowStart, now); // Count requests in window
  pipeline.expire(key, windowSeconds); // Set TTL

  const results = await pipeline.exec();
  const requestCount = results[2][1];

  return {
    allowed: requestCount <= maxRequests,
    remaining: Math.max(0, maxRequests - requestCount),
    resetAt: now + windowSeconds * 1000,
  };
}
```

## Rate Limit Bypasses

### Whitelist IPs

Enterprise customers can request IP whitelisting:

```json
{
  "whitelistedIps": ["203.0.113.0/24", "198.51.100.42"],
  "bypassRateLimits": true,
  "reason": "CI/CD pipeline integration"
}
```

### Service Accounts

Dedicated service accounts with higher limits:

```json
{
  "accountType": "service",
  "rateLimits": {
    "requests": 100000,
    "window": "1h",
    "burst": 50000
  }
}
```

## Monitoring & Alerting

### CloudWatch Metrics

```json
{
  "Namespace": "API/RateLimiting",
  "Metrics": [
    {
      "MetricName": "RateLimitExceeded",
      "Dimensions": [
        { "Name": "Endpoint", "Value": "/auth/login" },
        { "Name": "Tier", "Value": "free" }
      ],
      "Value": 1
    },
    {
      "MetricName": "RateLimitUtilization",
      "Dimensions": [{ "Name": "UserId", "Value": "usr_1a2b3c4d5e" }],
      "Value": 85.7,
      "Unit": "Percent"
    }
  ]
}
```

### Alert Thresholds

| Metric              | Warning           | Critical   | Action             |
| ------------------- | ----------------- | ---------- | ------------------ |
| 429 error rate      | >5%               | >10%       | Review tier limits |
| User hitting limits | >80% usage        | >95% usage | Contact customer   |
| Suspicious activity | >1000/min from IP | >10000/min | Auto-block IP      |

## Rate Limit Optimization

### Caching Strategies

**1. Cache frequently accessed resources:**

```http
GET /users/usr_1a2b3c4d5e
Cache-Control: max-age=300, private
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

**2. Use conditional requests:**

```http
GET /users/usr_1a2b3c4d5e
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

Response: 304 Not Modified (doesn't count against rate limit)
```

### Batch Operations

Instead of individual requests:

```javascript
// ❌ Bad: 100 requests
for (const userId of userIds) {
  await fetch(`/users/${userId}`);
}

// ✅ Good: 1 request
await fetch("/users/batch", {
  method: "POST",
  body: JSON.stringify({ userIds }),
});
```

### Webhooks vs Polling

**Polling (inefficient):**

```javascript
// Wastes rate limit quota
setInterval(async () => {
  const data = await fetch("/projects/updates");
}, 10000); // Every 10 seconds
```

**Webhooks (efficient):**

```javascript
// Setup webhook once
await fetch("/webhooks", {
  method: "POST",
  body: JSON.stringify({
    url: "https://myapp.com/webhook",
    events: ["project.updated"],
  }),
});
```

## Testing Rate Limits

### Postman Collection Test

```javascript
// Postman Pre-request Script
pm.sendRequest(
  {
    url: pm.environment.get("api_url") + "/users",
    method: "GET",
    header: {
      Authorization: `Bearer ${pm.environment.get("access_token")}`,
    },
  },
  (err, res) => {
    pm.test("Rate limit headers present", () => {
      pm.expect(res.headers.has("X-RateLimit-Limit")).to.be.true;
      pm.expect(res.headers.has("X-RateLimit-Remaining")).to.be.true;
    });

    const remaining = parseInt(res.headers.get("X-RateLimit-Remaining"));
    pm.test("Rate limit not exceeded", () => {
      pm.expect(remaining).to.be.greaterThan(0);
    });
  },
);
```

### Load Testing with k6

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 100 }, // Ramp up
    { duration: "3m", target: 100 }, // Steady state
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    rate_limit_exceeded: ["rate<0.01"], // Less than 1% rate limited
  },
};

export default function () {
  const res = http.get("https://api.example.com/v1/users", {
    headers: { Authorization: `Bearer ${__ENV.ACCESS_TOKEN}` },
  });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "rate limit not exceeded": (r) => r.status !== 429,
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers["Retry-After"]) || 60;
    sleep(retryAfter);
  }
}
```

## Frequently Asked Questions

**Q: Do rate limits reset at fixed intervals?**
A: No, we use a sliding window algorithm. Limits reset continuously as old requests age out of the window.

**Q: Are rate limits shared across API versions?**
A: Yes, rate limits apply across all API versions (/v1, /v2) for the same user.

**Q: Can I request higher rate limits?**
A: Enterprise customers can request custom rate limits. Contact sales@example.com.

**Q: Do failed requests count against rate limits?**
A: Yes, all requests (including 4xx/5xx errors) count against rate limits.

**Q: How are rate limits enforced in distributed systems?**
A: We use Redis with distributed locks to ensure consistent rate limiting across multiple API servers.

## Additional Resources

- [Authentication Guide](./authentication.md)
- [Error Handling Guide](./error-handling.md)
- [Pagination Guide](./pagination.md)
- [Performance Optimization Runbook](../runbooks/performance-optimization.md)
