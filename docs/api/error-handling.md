# Error Handling Guide

## Overview

The API uses standard HTTP status codes and returns consistent, structured error responses with detailed information for debugging and monitoring.

## Error Response Structure

All error responses follow this standardized format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "INVALID_FORMAT"
    }
  ],
  "requestId": "req_abc123xyz",
  "timestamp": "2025-01-17T10:30:00Z",
  "documentation": "https://docs.example.com/errors/validation-error"
}
```

### Field Descriptions

| Field           | Type    | Required | Description                                      |
| --------------- | ------- | -------- | ------------------------------------------------ |
| `error`         | string  | Yes      | Machine-readable error type (PascalCase)         |
| `message`       | string  | Yes      | Human-readable error description                 |
| `statusCode`    | integer | Yes      | HTTP status code                                 |
| `details`       | array   | No       | Detailed validation errors or additional context |
| `requestId`     | string  | Yes      | Unique request identifier for support/debugging  |
| `timestamp`     | string  | Yes      | ISO 8601 timestamp of error occurrence           |
| `documentation` | string  | No       | Link to relevant documentation                   |

## HTTP Status Codes

### Success Codes (2xx)

| Code | Status     | Usage                                 |
| ---- | ---------- | ------------------------------------- |
| 200  | OK         | Successful GET, PATCH, DELETE         |
| 201  | Created    | Successful POST (resource created)    |
| 202  | Accepted   | Request accepted for async processing |
| 204  | No Content | Successful DELETE (no response body)  |

### Client Error Codes (4xx)

| Code | Status               | Usage                                      | Example                                      |
| ---- | -------------------- | ------------------------------------------ | -------------------------------------------- |
| 400  | Bad Request          | Invalid request syntax or validation error | Malformed JSON, missing required fields      |
| 401  | Unauthorized         | Missing or invalid authentication          | No token, expired token, invalid credentials |
| 403  | Forbidden            | Authenticated but insufficient permissions | User role lacks required permissions         |
| 404  | Not Found            | Resource doesn't exist                     | Invalid user ID, deleted resource            |
| 405  | Method Not Allowed   | HTTP method not supported for endpoint     | POST to read-only endpoint                   |
| 409  | Conflict             | Resource conflict                          | Duplicate email, concurrent update conflict  |
| 410  | Gone                 | Resource permanently deleted               | Account deleted, subscription canceled       |
| 422  | Unprocessable Entity | Semantic validation error                  | Business rule violation                      |
| 429  | Too Many Requests    | Rate limit exceeded                        | Exceeded quota, too many login attempts      |

### Server Error Codes (5xx)

| Code | Status                | Usage                    | Example                                          |
| ---- | --------------------- | ------------------------ | ------------------------------------------------ |
| 500  | Internal Server Error | Unexpected server error  | Unhandled exception, database connection failure |
| 502  | Bad Gateway           | Upstream service error   | Third-party API failure                          |
| 503  | Service Unavailable   | Service temporarily down | Maintenance mode, overloaded                     |
| 504  | Gateway Timeout       | Upstream service timeout | Slow database query, external API timeout        |

## Common Error Types

### 1. Validation Errors (400)

**Single Field Error:**

```json
{
  "error": "ValidationError",
  "message": "Request validation failed",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "INVALID_FORMAT",
      "value": "not-an-email"
    }
  ],
  "requestId": "req_val123",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

**Multiple Field Errors:**

```json
{
  "error": "ValidationError",
  "message": "Multiple validation errors",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "REQUIRED_FIELD"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "code": "MIN_LENGTH",
      "constraint": 8
    },
    {
      "field": "age",
      "message": "Age must be between 18 and 120",
      "code": "OUT_OF_RANGE",
      "min": 18,
      "max": 120
    }
  ],
  "requestId": "req_val456",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

### 2. Authentication Errors (401)

**Missing Token:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication token is required",
  "statusCode": 401,
  "requestId": "req_auth001",
  "timestamp": "2025-01-17T10:30:00Z",
  "documentation": "https://docs.example.com/authentication"
}
```

**Expired Token:**

```json
{
  "error": "TokenExpired",
  "message": "Access token has expired",
  "statusCode": 401,
  "details": {
    "expiredAt": "2025-01-17T09:30:00Z",
    "currentTime": "2025-01-17T10:30:00Z"
  },
  "requestId": "req_auth002",
  "timestamp": "2025-01-17T10:30:00Z",
  "hint": "Use refresh token to obtain new access token"
}
```

**Invalid Credentials:**

```json
{
  "error": "InvalidCredentials",
  "message": "Invalid email or password",
  "statusCode": 401,
  "details": {
    "attemptsRemaining": 3,
    "lockoutAfter": 5
  },
  "requestId": "req_auth003",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

**MFA Required:**

```json
{
  "error": "MFARequired",
  "message": "Multi-factor authentication code required",
  "statusCode": 401,
  "mfaRequired": true,
  "mfaMethod": "totp",
  "requestId": "req_auth004",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

### 3. Authorization Errors (403)

**Insufficient Permissions:**

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource",
  "statusCode": 403,
  "details": {
    "requiredRole": "admin",
    "currentRole": "member",
    "requiredPermissions": ["delete:users"],
    "resource": "/users/usr_xyz789"
  },
  "requestId": "req_authz001",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

**Organization Access Denied:**

```json
{
  "error": "OrganizationAccessDenied",
  "message": "You are not a member of this organization",
  "statusCode": 403,
  "details": {
    "organizationId": "org_abc123",
    "userId": "usr_xyz789"
  },
  "requestId": "req_authz002",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

### 4. Not Found Errors (404)

**Resource Not Found:**

```json
{
  "error": "NotFound",
  "message": "User not found",
  "statusCode": 404,
  "details": {
    "resourceType": "User",
    "resourceId": "usr_nonexistent",
    "searchedIn": "organization:org_abc123"
  },
  "requestId": "req_nf001",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

**Endpoint Not Found:**

```json
{
  "error": "EndpointNotFound",
  "message": "The requested endpoint does not exist",
  "statusCode": 404,
  "details": {
    "path": "/v1/invalid/endpoint",
    "method": "GET",
    "suggestion": "Check API documentation for valid endpoints"
  },
  "requestId": "req_nf002",
  "timestamp": "2025-01-17T10:30:00Z",
  "documentation": "https://docs.example.com/api"
}
```

### 5. Conflict Errors (409)

**Duplicate Resource:**

```json
{
  "error": "Conflict",
  "message": "A user with this email already exists",
  "statusCode": 409,
  "details": {
    "conflictField": "email",
    "conflictValue": "user@example.com",
    "existingResourceId": "usr_existing123"
  },
  "requestId": "req_conf001",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

**Concurrent Update Conflict:**

```json
{
  "error": "ConcurrentUpdateConflict",
  "message": "Resource was modified by another request",
  "statusCode": 409,
  "details": {
    "resourceId": "usr_abc123",
    "expectedVersion": 5,
    "currentVersion": 6,
    "hint": "Fetch latest version and retry"
  },
  "requestId": "req_conf002",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

### 6. Rate Limit Errors (429)

**Rate Limit Exceeded:**

```json
{
  "error": "RateLimitExceeded",
  "message": "Rate limit exceeded. Please try again in 58 minutes",
  "statusCode": 429,
  "details": {
    "limit": 1000,
    "remaining": 0,
    "resetAt": "2025-01-17T12:00:00Z",
    "resetAfter": 3480,
    "policy": "1000 requests per hour",
    "tier": "free"
  },
  "requestId": "req_rate001",
  "timestamp": "2025-01-17T11:02:00Z"
}
```

### 7. Server Errors (500)

**Internal Server Error:**

```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred. Our team has been notified.",
  "statusCode": 500,
  "requestId": "req_err001",
  "timestamp": "2025-01-17T10:30:00Z",
  "support": "Contact support@example.com with request ID"
}
```

**Database Error:**

```json
{
  "error": "DatabaseError",
  "message": "Database operation failed",
  "statusCode": 500,
  "details": {
    "operation": "query",
    "retryable": true,
    "hint": "Please retry the request"
  },
  "requestId": "req_err002",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

**Third-Party Service Error:**

```json
{
  "error": "ExternalServiceError",
  "message": "Payment provider is temporarily unavailable",
  "statusCode": 502,
  "details": {
    "service": "stripe",
    "retryable": true,
    "estimatedRecovery": "2025-01-17T11:00:00Z"
  },
  "requestId": "req_err003",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

## Error Handling Best Practices

### Client-Side Error Handling

**JavaScript/TypeScript Example:**

```javascript
async function apiRequest(url, options) {
  try {
    const response = await fetch(url, options);

    // Handle successful responses
    if (response.ok) {
      return await response.json();
    }

    // Parse error response
    const error = await response.json();

    // Handle specific error types
    switch (error.statusCode) {
      case 400:
        handleValidationError(error);
        break;
      case 401:
        handleAuthenticationError(error);
        break;
      case 403:
        handleAuthorizationError(error);
        break;
      case 404:
        handleNotFoundError(error);
        break;
      case 429:
        await handleRateLimitError(error);
        break;
      case 500:
      case 502:
      case 503:
        await handleServerError(error);
        break;
      default:
        handleGenericError(error);
    }

    throw new ApiError(error);
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network error or JSON parse error
    throw new NetworkError("Failed to connect to API", err);
  }
}

function handleValidationError(error) {
  error.details?.forEach((detail) => {
    // Display field-specific errors in form
    showFieldError(detail.field, detail.message);
  });
}

async function handleAuthenticationError(error) {
  if (error.error === "TokenExpired") {
    // Attempt token refresh
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry original request with new token
      return apiRequest(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  }

  // Redirect to login
  redirectToLogin();
}

async function handleRateLimitError(error) {
  const retryAfter = error.details.resetAfter * 1000;

  // Show user-friendly message
  showNotification(
    `Too many requests. Please wait ${formatDuration(retryAfter)}`,
  );

  // Implement exponential backoff
  await sleep(retryAfter);

  // Retry request
  return apiRequest(url, options);
}

async function handleServerError(error) {
  if (error.details?.retryable) {
    // Exponential backoff for retryable errors
    const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 32000);
    await sleep(backoffMs);
    return apiRequest(url, options);
  }

  // Show error to user with request ID
  showErrorDialog(
    "Something went wrong",
    `Please contact support with request ID: ${error.requestId}`,
  );
}
```

### Server-Side Error Handling

**Express.js Middleware:**

```javascript
// Custom error class
class ApiError extends Error {
  constructor(message, statusCode, errorType, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
  }
}

// Validation error handler
function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
        code: detail.type.toUpperCase().replace(/\./g, "_"),
      }));

      throw new ApiError(
        "Request validation failed",
        400,
        "ValidationError",
        details,
      );
    }

    next();
  };
}

// Global error handler
app.use((err, req, res, next) => {
  const requestId = req.id || generateRequestId();

  // Log error for monitoring
  logger.error({
    error: err.errorType || "InternalServerError",
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    requestId,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
  });

  // Don't leak sensitive information in production
  const isProduction = process.env.NODE_ENV === "production";

  res.status(err.statusCode || 500).json({
    error: err.errorType || "InternalServerError",
    message:
      isProduction && err.statusCode === 500
        ? "An unexpected error occurred"
        : err.message,
    statusCode: err.statusCode || 500,
    details: err.details || undefined,
    requestId,
    timestamp: new Date().toISOString(),
    ...(isProduction ? {} : { stack: err.stack }),
  });
});
```

## Error Logging & Monitoring

### Structured Logging

```json
{
  "level": "error",
  "timestamp": "2025-01-17T10:30:00Z",
  "requestId": "req_abc123",
  "userId": "usr_xyz789",
  "error": {
    "type": "DatabaseError",
    "message": "Connection timeout",
    "statusCode": 500,
    "stack": "Error: Connection timeout\n    at Database.query..."
  },
  "request": {
    "method": "GET",
    "path": "/users/usr_xyz789",
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "context": {
    "organizationId": "org_abc123",
    "environment": "production",
    "region": "us-east-1"
  }
}
```

### Error Alerting Rules

| Error Type           | Threshold       | Severity | Action                      |
| -------------------- | --------------- | -------- | --------------------------- |
| 500 errors           | >1% of requests | High     | Page on-call engineer       |
| 401 errors           | >10% spike      | Medium   | Investigate auth service    |
| 429 errors           | >5% of requests | Low      | Review rate limits          |
| Specific error spike | >100/min        | High     | Auto-scale or circuit break |

## Retry Strategies

### Idempotency

**Idempotent Endpoints (safe to retry):**

- GET requests (read-only)
- PUT requests (full update)
- DELETE requests (already deleted = success)

**Non-Idempotent Endpoints (require idempotency keys):**

```bash
# Use Idempotency-Key header for POST requests
curl -X POST https://api.example.com/v1/payments \
  -H "Authorization: Bearer {token}" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{"amount": 1000, "currency": "USD"}'

# Duplicate request with same key returns original response
# Different request with same key returns 409 Conflict
```

### Exponential Backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelayMs = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry client errors (4xx except 429)
      if (
        error.statusCode >= 400 &&
        error.statusCode < 500 &&
        error.statusCode !== 429
      ) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        throw error; // Last attempt failed
      }

      // Exponential backoff with jitter
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * delayMs; // ±30% jitter
      await sleep(delayMs + jitter);
    }
  }
}
```

## Testing Error Scenarios

### Postman Tests

```javascript
// Test error response structure
pm.test("Error response has required fields", () => {
  const response = pm.response.json();
  pm.expect(response).to.have.property("error");
  pm.expect(response).to.have.property("message");
  pm.expect(response).to.have.property("statusCode");
  pm.expect(response).to.have.property("requestId");
  pm.expect(response).to.have.property("timestamp");
});

// Test validation errors
pm.test("Validation error includes details", () => {
  const response = pm.response.json();
  if (response.statusCode === 400) {
    pm.expect(response).to.have.property("details");
    pm.expect(response.details).to.be.an("array");
    response.details.forEach((detail) => {
      pm.expect(detail).to.have.property("field");
      pm.expect(detail).to.have.property("message");
    });
  }
});
```

## Additional Resources

- [Authentication Guide](./authentication.md)
- [Rate Limiting Guide](./rate-limiting.md)
- [Pagination Guide](./pagination.md)
- [Troubleshooting Runbook](../runbooks/troubleshooting.md)
- [Incident Response Runbook](../runbooks/incident-response.md)
