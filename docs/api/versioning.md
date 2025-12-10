# API Versioning Strategy

## Overview

The API uses **URI versioning** with a commitment to backwards compatibility and smooth migration paths. This document outlines our versioning philosophy, deprecation policy, and migration strategies.

## Versioning Scheme

### Current Versions

| Version   | Status  | Release Date | End of Life | Notes                        |
| --------- | ------- | ------------ | ----------- | ---------------------------- |
| **v1**    | Current | 2025-01-15   | TBD         | Latest stable version        |
| v2 (beta) | Beta    | 2025-10-01   | -           | Preview of upcoming features |

### Version Format

```
https://api.example.com/{version}/{resource}
                         ↑
                    Version identifier: v1, v2, etc.
```

**Examples:**

```bash
# Version 1 (current)
GET https://api.example.com/v1/users
POST https://api.example.com/v1/projects

# Version 2 (beta)
GET https://api.example.com/v2/users
POST https://api.example.com/v2/projects
```

## Version Selection

### URI-Based Versioning (Primary)

**Recommended**: Specify version in URL path.

```bash
curl https://api.example.com/v1/users \
  -H "Authorization: Bearer {token}"
```

**Benefits:**

- Clear and explicit
- Easy to test multiple versions
- Works with all HTTP clients
- Cacheable at CDN/proxy level

### Header-Based Versioning (Alternative)

Optional: Use `API-Version` header.

```bash
curl https://api.example.com/users \
  -H "Authorization: Bearer {token}" \
  -H "API-Version: v1"
```

**Fallback behavior:**

- No version specified → defaults to latest stable (v1)
- Invalid version → 400 error with available versions

## Backwards Compatibility

### Backwards-Compatible Changes

These changes **do not** require a new major version:

✅ **Safe Changes:**

- Adding new endpoints
- Adding optional request parameters
- Adding new fields to responses
- Adding new HTTP methods to existing endpoints
- Expanding enum values (with proper validation)
- Performance improvements
- Bug fixes

**Example: Adding optional field**

```json
// v1 - Original
{
  "id": "usr_123",
  "email": "user@example.com"
}

// v1 - After backwards-compatible change
{
  "id": "usr_123",
  "email": "user@example.com",
  "phoneNumber": "+1-555-123-4567"  // ✅ New optional field
}
```

### Breaking Changes

These changes **require** a new major version:

❌ **Breaking Changes:**

- Removing endpoints or fields
- Renaming fields
- Changing data types
- Changing error response format
- Changing authentication mechanism
- Modifying URL structure
- Changing HTTP status codes
- Removing enum values

**Example: Breaking change requiring v2**

```json
// v1
{
  "created": "2025-01-15T10:30:00Z"  // ISO 8601 string
}

// v2 - Breaking change!
{
  "created": 1642262400  // Unix timestamp (incompatible)
}
```

## Version Migration

### Migration Path: v1 → v2

#### Key Changes in v2

| Feature         | v1 Behavior      | v2 Behavior              | Migration Guide             |
| --------------- | ---------------- | ------------------------ | --------------------------- |
| Date format     | ISO 8601 strings | Unix timestamps          | Parse strings to timestamps |
| Error responses | Simple format    | RFC 7807 Problem Details | Update error handling       |
| Pagination      | Cursor + offset  | Cursor only              | Remove offset support       |
| Authentication  | JWT only         | JWT + OAuth 2.0          | Implement OAuth flow        |

#### Example Migration

**v1 User Response:**

```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "createdAt": "2025-01-15T10:30:00Z",
  "role": "admin"
}
```

**v2 User Response:**

```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "created": 1642262400,
  "updated": 1642262400,
  "role": {
    "id": "role_admin",
    "name": "Administrator",
    "permissions": ["read", "write", "admin"]
  },
  "links": {
    "self": "/v2/users/usr_123",
    "organization": "/v2/organizations/org_456"
  }
}
```

### Migration Strategies

#### Strategy 1: Gradual Migration (Recommended)

Maintain both versions simultaneously with gradual endpoint migration.

```javascript
// Phase 1: Support both versions
async function getUser(userId, version = "v1") {
  const response = await fetch(
    `https://api.example.com/${version}/users/${userId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return response.json();
}

// Phase 2: Migrate critical endpoints first
const user = await getUser("usr_123", "v2");

// Phase 3: Update all calls to v2
const user = await getUser("usr_123"); // Default to v2
```

#### Strategy 2: Adapter Pattern

Use adapters to translate between versions.

```javascript
class UserApiAdapter {
  constructor(version = "v1") {
    this.version = version;
  }

  async getUser(userId) {
    const response = await fetch(
      `https://api.example.com/${this.version}/users/${userId}`,
    );
    const data = await response.json();

    return this.normalizeUser(data);
  }

  normalizeUser(rawUser) {
    if (this.version === "v1") {
      return {
        id: rawUser.id,
        email: rawUser.email,
        created: new Date(rawUser.createdAt).getTime() / 1000,
        role: { name: rawUser.role },
      };
    }

    // v2 already in normalized format
    return rawUser;
  }
}

// Use adapter for version-agnostic code
const adapter = new UserApiAdapter(process.env.API_VERSION || "v1");
const user = await adapter.getUser("usr_123");
```

#### Strategy 3: Feature Flags

Gradually roll out v2 with feature flags.

```javascript
const useV2API = featureFlags.isEnabled("api-v2-migration");

const apiVersion = useV2API ? "v2" : "v1";
const users = await fetch(`/api/${apiVersion}/users`);
```

## Deprecation Policy

### Deprecation Timeline

```
Version Release → Deprecation Notice → End of Life
                  (6 months)           (12 months)
```

**Example Timeline:**

```
v1 Released:    2025-01-15
v2 Released:    2025-07-15
v1 Deprecated:  2026-01-15 (6 months notice)
v1 End of Life: 2026-07-15 (12 months total)
```

### Deprecation Warnings

**HTTP Headers:**

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 15 Jul 2026 00:00:00 GMT
Link: <https://api.example.com/v2/users>; rel="alternate"
Warning: 299 - "API v1 is deprecated. Migrate to v2 by 2026-07-15"
```

**Response Body (v1):**

```json
{
  "data": {...},
  "deprecation": {
    "deprecated": true,
    "sunsetDate": "2026-07-15T00:00:00Z",
    "migrationGuide": "https://docs.example.com/migration/v1-to-v2",
    "alternateVersion": "v2"
  }
}
```

### Email Notifications

Users receive deprecation notices:

```
Subject: Action Required: API v1 Deprecation Notice

Dear Developer,

API v1 will be deprecated on 2026-01-15 and sunset on 2026-07-15.

Your app "MyApp" (client_id: app_xyz) is currently using v1:
- 85,234 requests to /v1/users (last 30 days)
- 12,456 requests to /v1/projects (last 30 days)

Migration Resources:
- Migration Guide: https://docs.example.com/migration/v1-to-v2
- v2 Documentation: https://docs.example.com/api/v2
- Support: api-support@example.com

Questions? Reply to this email or contact our support team.

Best regards,
API Team
```

## Testing Multiple Versions

### Postman Environments

**v1 Environment:**

```json
{
  "api_version": "v1",
  "base_url": "https://api.example.com/v1",
  "access_token": "{{v1_access_token}}"
}
```

**v2 Environment:**

```json
{
  "api_version": "v2",
  "base_url": "https://api.example.com/v2",
  "access_token": "{{v2_access_token}}"
}
```

**Collection Request:**

```
GET {{base_url}}/users
Authorization: Bearer {{access_token}}
```

### Automated Testing

```javascript
// Jest test suite for both versions
describe.each(["v1", "v2"])("API %s", (version) => {
  const baseUrl = `https://api.example.com/${version}`;

  test("should list users", async () => {
    const response = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("should get user by ID", async () => {
    const response = await fetch(`${baseUrl}/users/usr_123`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(200);

    const user = await response.json();
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("email");
  });
});
```

## Version Detection

### Automatic Version Detection

```javascript
async function detectApiVersion(baseUrl) {
  try {
    // Try v2
    const v2Response = await fetch(`${baseUrl}/v2/health`);
    if (v2Response.ok) {
      return "v2";
    }
  } catch (err) {
    // v2 not available
  }

  // Fallback to v1
  return "v1";
}

// Usage
const apiVersion = await detectApiVersion("https://api.example.com");
console.log(`Using API version: ${apiVersion}`);
```

### Version Compatibility Check

```bash
# Check available API versions
curl https://api.example.com/versions

# Response
{
  "versions": [
    {
      "version": "v1",
      "status": "stable",
      "deprecated": false,
      "releaseDate": "2025-01-15",
      "sunsetDate": null
    },
    {
      "version": "v2",
      "status": "beta",
      "deprecated": false,
      "releaseDate": "2025-10-01",
      "documentation": "https://docs.example.com/api/v2"
    }
  ],
  "latest": "v1",
  "recommended": "v1"
}
```

## Best Practices

### For API Consumers

1. **Always specify version explicitly** in production code
2. **Subscribe to deprecation notices** via developer portal
3. **Test against beta versions** before release
4. **Monitor deprecation headers** in API responses
5. **Plan migrations early** - don't wait until sunset date

### For API Providers

1. **Version at the URL level** for clarity
2. **Maintain at least 2 versions** simultaneously
3. **Provide migration guides** with code examples
4. **Announce breaking changes** 12+ months in advance
5. **Keep deprecation policy transparent** and predictable

## SDK Version Support

### Official SDKs

| SDK        | v1 Support | v2 Support       | Notes                                |
| ---------- | ---------- | ---------------- | ------------------------------------ |
| JavaScript | ✅ v1.x.x  | ✅ v2.x.x (beta) | npm install @example/api-client      |
| Python     | ✅ v1.x.x  | ✅ v2.x.x (beta) | pip install example-api-client       |
| Java       | ✅ v1.x.x  | 🚧 Coming soon   | Maven/Gradle                         |
| Go         | ✅ v1.x.x  | 🚧 Coming soon   | go get github.com/example/api-client |

**SDK version mapping:**

```
SDK v1.x.x → API v1
SDK v2.x.x → API v2
```

## Additional Resources

- [OpenAPI v1 Specification](./openapi.yaml)
- [OpenAPI v2 Specification](./openapi-v2.yaml) (beta)
- [Migration Guide: v1 → v2](../development/migration-v1-to-v2.md)
- [Changelog](../CHANGELOG.md)
- [Breaking Changes Policy](../development/breaking-changes-policy.md)
