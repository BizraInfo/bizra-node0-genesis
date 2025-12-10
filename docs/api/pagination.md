# Pagination Guide

## Overview

The API supports **cursor-based pagination** for efficient, scalable data retrieval. Cursor pagination is preferred over offset-based pagination for large datasets as it provides consistent results and better performance.

## Pagination Methods

### Cursor-Based Pagination (Recommended)

Cursor pagination uses an opaque cursor token to fetch the next set of results. This method is:

- **Consistent**: No duplicate or missing items when data changes
- **Performant**: Uses indexed fields for efficient database queries
- **Scalable**: Works well with millions of records

**Request:**

```bash
GET /v1/users?limit=20&cursor=cur_abc123xyz
```

**Response:**

```json
{
  "data": [
    {
      "id": "usr_1a2b3c4d5e",
      "email": "user1@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": "usr_2b3c4d5e6f",
      "email": "user2@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "createdAt": "2025-01-14T09:20:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "cur_def456uvw",
    "prevCursor": "cur_ghi789rst",
    "hasMore": true,
    "limit": 20
  }
}
```

### Offset-Based Pagination (Legacy)

**Note**: Offset pagination is deprecated and available only for backwards compatibility. Use cursor pagination for new integrations.

**Request:**

```bash
GET /v1/users?limit=20&offset=40
```

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "offset": 40,
    "limit": 20,
    "total": 1547,
    "hasMore": true
  }
}
```

## Query Parameters

| Parameter   | Type    | Default     | Max | Description                          |
| ----------- | ------- | ----------- | --- | ------------------------------------ |
| `limit`     | integer | 20          | 100 | Number of items per page             |
| `cursor`    | string  | -           | -   | Pagination cursor for next/prev page |
| `sortBy`    | string  | `createdAt` | -   | Field to sort by                     |
| `sortOrder` | string  | `desc`      | -   | Sort order: `asc` or `desc`          |

## Pagination Response Structure

```json
{
  "data": [],
  "pagination": {
    "nextCursor": "cur_next",
    "prevCursor": "cur_prev",
    "hasMore": true,
    "limit": 20
  }
}
```

### Pagination Object Fields

| Field        | Type           | Description                                   |
| ------------ | -------------- | --------------------------------------------- |
| `nextCursor` | string \| null | Cursor for next page (null if no more pages)  |
| `prevCursor` | string \| null | Cursor for previous page (null on first page) |
| `hasMore`    | boolean        | Whether more results exist after current page |
| `limit`      | integer        | Number of items requested per page            |

## Usage Examples

### Basic Pagination

**Fetch first page:**

```bash
curl -X GET 'https://api.example.com/v1/users?limit=20' \
  -H 'Authorization: Bearer {accessToken}'
```

**Response:**

```json
{
  "data": [...20 users...],
  "pagination": {
    "nextCursor": "cur_abc123",
    "prevCursor": null,
    "hasMore": true,
    "limit": 20
  }
}
```

**Fetch next page:**

```bash
curl -X GET 'https://api.example.com/v1/users?limit=20&cursor=cur_abc123' \
  -H 'Authorization: Bearer {accessToken}'
```

### Pagination with Sorting

**Sort by email (ascending):**

```bash
GET /v1/users?limit=20&sortBy=email&sortOrder=asc
```

**Sort by creation date (descending):**

```bash
GET /v1/users?limit=20&sortBy=createdAt&sortOrder=desc
```

### Pagination with Filtering

**Combine pagination with filters:**

```bash
GET /v1/users?limit=20&cursor=cur_abc123&role=admin&status=active
```

**Response includes filtered results:**

```json
{
  "data": [...admin users with active status...],
  "pagination": {
    "nextCursor": "cur_def456",
    "hasMore": true,
    "limit": 20,
    "filters": {
      "role": "admin",
      "status": "active"
    }
  }
}
```

## Client-Side Implementation

### JavaScript/TypeScript

**Fetch all pages:**

```javascript
async function fetchAllUsers(baseUrl, accessToken) {
  const allUsers = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const url = cursor
      ? `${baseUrl}/users?limit=100&cursor=${cursor}`
      : `${baseUrl}/users?limit=100`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data, pagination } = await response.json();

    allUsers.push(...data);
    cursor = pagination.nextCursor;
    hasMore = pagination.hasMore;
  }

  return allUsers;
}
```

**Paginated component (React):**

```jsx
function UserList() {
  const [users, setUsers] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  async function loadMoreUsers() {
    if (loading || !hasMore) return;

    setLoading(true);

    const url = cursor
      ? `/api/users?limit=20&cursor=${cursor}`
      : "/api/users?limit=20";

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data, pagination } = await response.json();

    setUsers((prev) => [...prev, ...data]);
    setCursor(pagination.nextCursor);
    setHasMore(pagination.hasMore);
    setLoading(false);
  }

  useEffect(() => {
    loadMoreUsers();
  }, []);

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}

      {hasMore && (
        <button onClick={loadMoreUsers} disabled={loading}>
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

**Infinite scroll (React + Intersection Observer):**

```jsx
function InfiniteUserList() {
  const [users, setUsers] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef(null);

  async function loadMoreUsers() {
    const url = cursor
      ? `/api/users?limit=20&cursor=${cursor}`
      : "/api/users?limit=20";

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data, pagination } = await response.json();

    setUsers((prev) => [...prev, ...data]);
    setCursor(pagination.nextCursor);
    setHasMore(pagination.hasMore);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreUsers();
        }
      },
      { threshold: 1.0 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [cursor, hasMore]);

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}

      {hasMore && <div ref={loadMoreRef}>Loading...</div>}
    </div>
  );
}
```

### Python

```python
import requests
from typing import List, Dict, Generator

class APIClient:
    def __init__(self, base_url: str, access_token: str):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {access_token}'}

    def paginate(
        self,
        endpoint: str,
        limit: int = 100,
        **filters
    ) -> Generator[Dict, None, None]:
        """Generator that yields all items from paginated endpoint"""
        cursor = None
        has_more = True

        while has_more:
            params = {'limit': limit, **filters}
            if cursor:
                params['cursor'] = cursor

            response = requests.get(
                f'{self.base_url}/{endpoint}',
                headers=self.headers,
                params=params
            )
            response.raise_for_status()

            data = response.json()

            for item in data['data']:
                yield item

            pagination = data['pagination']
            cursor = pagination.get('nextCursor')
            has_more = pagination.get('hasMore', False)

    def fetch_all(self, endpoint: str, **filters) -> List[Dict]:
        """Fetch all items from paginated endpoint"""
        return list(self.paginate(endpoint, **filters))

# Usage
client = APIClient('https://api.example.com/v1', access_token)

# Iterate through all users
for user in client.paginate('users', role='admin'):
    print(user['email'])

# Fetch all projects at once
projects = client.fetch_all('projects', status='active')
```

## Performance Optimization

### Optimal Page Size

| Use Case        | Recommended Limit | Reason                             |
| --------------- | ----------------- | ---------------------------------- |
| UI pagination   | 20-50             | Better UX, faster rendering        |
| Infinite scroll | 20-30             | Smooth scrolling experience        |
| Bulk export     | 100               | Fewer API calls, faster transfer   |
| Real-time sync  | 50-100            | Balance between freshness and load |

### Caching Strategies

**Cache paginated responses:**

```javascript
class PaginatedCache {
  constructor(ttlMs = 60000) {
    this.cache = new Map();
    this.ttlMs = ttlMs;
  }

  getCacheKey(endpoint, cursor) {
    return `${endpoint}:${cursor || "first"}`;
  }

  get(endpoint, cursor) {
    const key = this.getCacheKey(endpoint, cursor);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttlMs) {
      return cached.data;
    }

    this.cache.delete(key);
    return null;
  }

  set(endpoint, cursor, data) {
    const key = this.getCacheKey(endpoint, cursor);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

const cache = new PaginatedCache(60000); // 1-minute TTL

async function fetchPage(endpoint, cursor) {
  const cached = cache.get(endpoint, cursor);
  if (cached) return cached;

  const response = await fetch(buildUrl(endpoint, cursor));
  const data = await response.json();

  cache.set(endpoint, cursor, data);
  return data;
}
```

### Prefetching Next Page

```javascript
async function fetchWithPrefetch(endpoint, cursor) {
  // Fetch current page
  const currentPage = await fetchPage(endpoint, cursor);

  // Prefetch next page in background
  if (currentPage.pagination.hasMore) {
    fetchPage(endpoint, currentPage.pagination.nextCursor).catch((err) =>
      console.warn("Prefetch failed:", err),
    );
  }

  return currentPage;
}
```

## Cursor Format

Cursors are **opaque tokens** that encode pagination state. Clients should treat cursors as opaque strings and not attempt to parse or construct them.

**Example cursor structure (base64-encoded JSON):**

```json
// Decoded cursor (for illustration only - treat as opaque!)
{
  "lastId": "usr_2b3c4d5e6f",
  "lastValue": "2025-01-14T09:20:00Z",
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

## Common Pitfalls

### ❌ Don't Construct Cursors Manually

```javascript
// ❌ WRONG: Never manually create cursors
const cursor = btoa(JSON.stringify({ lastId: "usr_123" }));

// ✅ CORRECT: Use cursors from API responses
const cursor = response.pagination.nextCursor;
```

### ❌ Don't Cache Results Across Filter Changes

```javascript
// ❌ WRONG: Filter change invalidates cursor
users = await fetch("/users?role=admin&cursor=cur_abc");
// Later, changing filter...
users = await fetch("/users?role=member&cursor=cur_abc"); // Invalid!

// ✅ CORRECT: Reset cursor when filters change
function onFilterChange() {
  setCursor(null); // Reset to first page
  setUsers([]);
  loadUsers();
}
```

### ❌ Don't Use Offset Pagination for Large Datasets

```javascript
// ❌ WRONG: Offset becomes slow with large offsets
GET /users?offset=100000&limit=20  // Slow database query!

// ✅ CORRECT: Cursor pagination scales to any size
GET /users?cursor=cur_abc&limit=20  // Fast indexed lookup
```

## Error Handling

### Invalid Cursor

```json
{
  "error": "InvalidCursor",
  "message": "The pagination cursor is invalid or expired",
  "statusCode": 400,
  "details": {
    "cursor": "cur_invalid_xyz",
    "hint": "Request first page without cursor parameter"
  },
  "requestId": "req_page001"
}
```

### Cursor Expired

```json
{
  "error": "CursorExpired",
  "message": "Pagination cursor has expired",
  "statusCode": 400,
  "details": {
    "expiredAt": "2025-01-16T10:30:00Z",
    "maxAge": "24 hours",
    "hint": "Start pagination from beginning"
  },
  "requestId": "req_page002"
}
```

## Testing Pagination

### Postman Tests

```javascript
// Test pagination structure
pm.test("Response has pagination object", () => {
  const response = pm.response.json();
  pm.expect(response).to.have.property("data");
  pm.expect(response).to.have.property("pagination");
  pm.expect(response.pagination).to.have.property("hasMore");
  pm.expect(response.pagination).to.have.property("limit");
});

// Test cursor format
pm.test("Cursor is valid format", () => {
  const pagination = pm.response.json().pagination;
  if (pagination.nextCursor) {
    pm.expect(pagination.nextCursor).to.match(/^cur_[a-zA-Z0-9]+$/);
  }
});

// Auto-pagination test
pm.test("Fetch all pages", async () => {
  let allData = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const response = await pm.sendRequest({
      url: `${pm.environment.get("api_url")}/users?limit=20${cursor ? `&cursor=${cursor}` : ""}`,
      headers: {
        Authorization: `Bearer ${pm.environment.get("access_token")}`,
      },
    });

    const { data, pagination } = response.json();
    allData.push(...data);

    cursor = pagination.nextCursor;
    hasMore = pagination.hasMore;
  }

  pm.expect(allData.length).to.be.greaterThan(0);
  console.log(`Fetched ${allData.length} total items`);
});
```

## Additional Resources

- [Rate Limiting Guide](./rate-limiting.md) - Pagination and rate limits
- [Error Handling Guide](./error-handling.md) - Handling pagination errors
- [Performance Optimization Runbook](../runbooks/performance-optimization.md)
- [OpenAPI Specification](./openapi.yaml) - Full API documentation
