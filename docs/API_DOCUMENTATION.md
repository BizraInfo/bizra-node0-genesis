# BIZRA Backend API Documentation

## Overview

Production-ready backend services for BIZRA blockchain with Express + TypeScript featuring authentication, user management, and blockchain validation.

## Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.bizra.example.com/api/v1
```

## Authentication

All protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Health & Status

#### GET /health

Health check endpoint (no auth required)

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-17T15:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

#### GET /ready

Readiness check with dependency status

**Response:**

```json
{
  "status": "ready",
  "timestamp": "2025-10-17T15:00:00.000Z",
  "checks": {
    "database": true,
    "redis": true
  }
}
```

---

### Authentication Endpoints

#### POST /auth/register

Register new user account

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecureP@ssw0rd!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user",
      "status": "pending_verification"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

#### POST /auth/login

Login with email and password

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd!",
  "deviceInfo": "Optional device identifier"
}
```

**Response:** Same as register

#### POST /auth/refresh

Refresh access token

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    }
  }
}
```

#### POST /auth/logout

Logout current session (requires auth)

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..." // Optional
}
```

#### POST /auth/change-password

Change user password (requires auth)

**Request Body:**

```json
{
  "currentPassword": "OldP@ssw0rd!",
  "newPassword": "NewP@ssw0rd!"
}
```

---

### User Management Endpoints

#### GET /users/me

Get current user profile (requires auth)

**Response:**

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user",
      "status": "active",
      "email_verified": true,
      "created_at": "2025-10-17T15:00:00.000Z"
    }
  }
}
```

#### PATCH /users/me

Update current user profile (requires auth)

**Request Body:**

```json
{
  "username": "newusername",
  "metadata": {
    "custom": "field"
  }
}
```

#### GET /users

Get all users (requires moderator/admin)

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `role` - Filter by role (admin, moderator, user, guest)
- `status` - Filter by status
- `search` - Search by username or email
- `sortBy` - Sort field (created_at, username, email, last_login)
- `sortOrder` - Sort direction (asc, desc)

**Response:**

```json
{
  "success": true,
  "data": [...users],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

#### PATCH /users/:userId/role

Update user role (requires admin)

**Request Body:**

```json
{
  "role": "moderator"
}
```

#### PATCH /users/:userId/status

Update user status (requires admin)

**Request Body:**

```json
{
  "status": "suspended",
  "reason": "Policy violation"
}
```

---

### BIZRA Blockchain Validation Endpoints

#### POST /validate/transaction

Validate blockchain transaction

**Request Body:**

```json
{
  "txHash": "0x1234567890abcdef...",
  "networkId": "mainnet"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "data": {
      "hash": "0x123...",
      "from": "0xabc...",
      "to": "0xdef...",
      "value": "1000000000000000000",
      "status": "confirmed",
      "confirmations": 12,
      "blockNumber": 12345
    },
    "validatedAt": "2025-10-17T15:00:00.000Z",
    "networkId": "mainnet"
  }
}
```

#### POST /validate/block

Validate blockchain block

**Request Body:**

```json
{
  "blockNumber": 12345,
  "networkId": "mainnet"
}
```

#### POST /validate/address

Validate blockchain address

**Request Body:**

```json
{
  "address": "0x1234567890abcdef...",
  "networkId": "mainnet"
}
```

#### GET /validate/block-number

Get current block number

**Response:**

```json
{
  "success": true,
  "data": {
    "blockNumber": 12345
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional details
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-10-17T15:00:00.000Z"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid request data
- `AUTHENTICATION_ERROR` (401) - Authentication failed
- `AUTHORIZATION_ERROR` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource already exists
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

---

## Rate Limiting

Rate limits are applied per IP address and endpoint:

- **Authentication endpoints**: 5 requests per 15 minutes
- **Standard API endpoints**: 100 requests per 15 minutes
- **Public endpoints**: 300 requests per minute

Rate limit headers:

- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Timestamp when limit resets
- `Retry-After` - Seconds to wait (only on 429 errors)

---

## Caching

Responses are cached with the following headers:

- `X-Cache` - HIT or MISS
- `X-Cache-Key` - Cache key used (for debugging)

Cache TTLs:

- User profiles: 15 minutes
- Validation results: 1 hour
- Default: 5 minutes

---

## Security

### Headers

All responses include security headers:

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Expiry

- Access Token: 15 minutes
- Refresh Token: 7 days

---

## Request ID Tracking

All requests receive a unique ID for tracking:

- Header: `X-Request-Id`
- Included in all responses and logs
