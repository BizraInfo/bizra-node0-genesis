# Postman Collection

## Overview

This directory contains the official Postman collection and environment configurations for the Enterprise API Platform.

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `enterprise-api.postman_collection.json`
4. Click **Import**

### 2. Import Environments

Import all environment files from the `environments/` directory:

- `production.postman_environment.json` - Production environment
- `staging.postman_environment.json` - Staging environment
- `development.postman_environment.json` - Development environment

### 3. Configure Environment

1. Select your desired environment (Development, Staging, or Production)
2. Click the eye icon to view variables
3. Set your credentials (if needed)

### 4. Authenticate

1. Open the **Authentication** folder
2. Run the **Login** request with your credentials
3. Access token is automatically saved to environment variables
4. All subsequent requests will use this token automatically

## Environment Variables

### Required Variables

| Variable        | Description                       | Example                      |
| --------------- | --------------------------------- | ---------------------------- |
| `base_url`      | API base URL                      | `https://api.example.com/v1` |
| `api_version`   | API version                       | `v1`                         |
| `access_token`  | JWT access token (auto-populated) | `eyJhbGci...`                |
| `refresh_token` | Refresh token (auto-populated)    | `rt_abc123...`               |

### Optional Variables

| Variable  | Description         | Example          |
| --------- | ------------------- | ---------------- |
| `user_id` | User ID for testing | `usr_1a2b3c4d5e` |
| `org_id`  | Organization ID     | `org_9z8y7x6w5v` |

## Features

### Auto Token Refresh

The collection includes a pre-request script that automatically refreshes expired access tokens:

```javascript
// Runs before every request
const expiresAt = pm.environment.get("token_expires_at");
const now = Date.now();

if (expiresAt && now >= expiresAt) {
  // Automatically refresh token
}
```

### Global Tests

Every request includes these automatic tests:

- Response time validation (< 2 seconds)
- Rate limit monitoring
- Response structure validation

### Rate Limit Warnings

The collection monitors rate limits and logs warnings when you're approaching limits:

```
Rate limit warning: 95/1000 requests remaining
```

## Collection Structure

```
Enterprise API Platform
├── Authentication
│   ├── Register User
│   ├── Login
│   └── Refresh Token
├── Users
│   ├── List Users
│   ├── Get User by ID
│   ├── Create User
│   ├── Update User
│   └── Delete User
├── Organizations
│   ├── List Organizations
│   ├── Create Organization
│   └── List Organization Members
└── Projects
    ├── List Projects
    └── Create Project
```

## Testing Workflows

### Basic User Flow

1. **Register** → `POST /auth/register`
2. **Login** → `POST /auth/login` (saves tokens)
3. **List Users** → `GET /users`
4. **Get User** → `GET /users/{userId}`

### Organization Workflow

1. **Login** → `POST /auth/login`
2. **Create Organization** → `POST /organizations`
3. **List Members** → `GET /organizations/{orgId}/members`

### Pagination Testing

1. Run **List Users** with `limit=5`
2. Copy `nextCursor` from response
3. Run **List Users** again with `cursor={nextCursor}`
4. Repeat until `hasMore: false`

## Advanced Usage

### Running Collection with Newman

```bash
# Install Newman
npm install -g newman

# Run collection
newman run enterprise-api.postman_collection.json \
  -e environments/development.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export test-results.html

# Run with specific folder
newman run enterprise-api.postman_collection.json \
  -e environments/production.postman_environment.json \
  --folder "Authentication"
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    newman run postman/enterprise-api.postman_collection.json \
      -e postman/environments/staging.postman_environment.json \
      --env-var "access_token=${{ secrets.API_TOKEN }}" \
      --reporters junit,cli \
      --reporter-junit-export test-results.xml
```

### Environment-Specific Settings

**Development:**

- Base URL: `http://localhost:3000/v1`
- Pre-populated test data
- Relaxed rate limits

**Staging:**

- Base URL: `https://api-staging.example.com/v1`
- Production-like environment
- Full feature set testing

**Production:**

- Base URL: `https://api.example.com/v1`
- Real data (use with caution!)
- Standard rate limits

## Troubleshooting

### Token Expired Errors

If you see 401 errors:

1. Run **Login** request again
2. Or run **Refresh Token** request
3. Token is automatically saved and used

### Rate Limit Exceeded

If you hit rate limits (429 error):

1. Wait for the time specified in `Retry-After` header
2. Check `X-RateLimit-Reset` header for reset time
3. Consider upgrading to higher tier

### Environment Variables Not Set

If variables are missing:

1. Ensure correct environment is selected
2. Check eye icon to view variables
3. Run **Login** to populate tokens

## Best Practices

1. **Use Development environment** for testing
2. **Never commit** access tokens to version control
3. **Monitor rate limits** using the built-in warnings
4. **Organize requests** in folders for complex workflows
5. **Use pre-request scripts** for setup logic
6. **Use tests** to validate responses automatically

## Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [Newman CLI Documentation](https://learning.postman.com/docs/running-collections/using-newman-cli/)
- [API Documentation](../api/openapi.yaml)
- [Authentication Guide](../api/authentication.md)
