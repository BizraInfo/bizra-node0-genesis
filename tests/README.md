# Testing Framework Documentation

## Overview

World-class automated testing framework with **90%+ coverage** across all testing levels.

## Test Pyramid

```
         /\
        /E2E\      (10%) - User journeys with Playwright
       /------\
      /Integr.\   (20%) - API tests with Supertest
     /----------\
    /   Unit     \ (70%) - Component tests with Jest
   /--------------\
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm run playwright:install
```

### 2. Start Test Database

```bash
npm run db:test:up
```

### 3. Run Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests (requires k6)
npm run test:performance

# Mutation testing
npm run test:mutation
```

## Test Structure

```
tests/
├── unit/                      # Unit tests (70% coverage target)
│   ├── services/              # Service layer tests
│   │   ├── auth.service.test.ts
│   │   ├── user.service.test.ts
│   │   └── validation.service.test.ts
│   ├── controllers/           # Controller tests
│   └── utils/                 # Utility function tests
├── integration/               # Integration tests (20% coverage target)
│   ├── api/                   # API endpoint tests
│   │   ├── auth.api.test.ts
│   │   ├── user.api.test.ts
│   │   └── validation.api.test.ts
│   └── database/              # Database integration tests
├── e2e/                       # E2E tests (10% coverage target)
│   ├── user-journey.spec.ts
│   └── admin-workflow.spec.ts
├── performance/               # Performance tests
│   ├── load-test.js           # k6 load testing
│   └── stress-test.js         # k6 stress testing
├── fixtures/                  # Test data
│   ├── users.fixture.ts
│   └── validation.fixture.ts
├── helpers/                   # Test utilities
│   ├── test-server.ts
│   ├── database-cleaner.ts
│   └── mock-factory.ts
├── sql/                       # Database setup
│   └── init.sql
└── setup.ts                   # Global test setup
```

## Test Categories

### Unit Tests

**Target Coverage: >90%**

Tests individual functions and components in isolation.

```typescript
// Example
describe('AuthService', () => {
  it('should hash password before storage', async () => {
    const service = new AuthService();
    const result = await service.register(userData);
    expect(result.password).not.toBe(userData.password);
  });
});
```

**Run:**
```bash
npm run test:unit
```

### Integration Tests

**Target Coverage: All API endpoints**

Tests API endpoints with real database and dependencies.

```typescript
// Example
describe('POST /api/auth/register', () => {
  it('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(validUser)
      .expect(201);

    expect(response.body).toHaveProperty('token');
  });
});
```

**Run:**
```bash
npm run test:integration
```

### E2E Tests

**Target Coverage: Critical user journeys**

Tests complete user workflows in real browser.

```typescript
// Example
test('should complete registration flow', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*\/dashboard/);
});
```

**Run:**
```bash
npm run test:e2e
npm run test:e2e:headed  # Watch tests run
npm run test:e2e:ui      # Interactive UI mode
```

### Performance Tests

**Target: Response times <500ms for 95th percentile**

Load and stress testing with k6.

```javascript
// Example
export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};
```

**Run:**
```bash
npm run test:performance  # Load test
npm run test:stress       # Stress test
```

### Mutation Testing

**Target: >90% mutation score**

Tests the quality of your tests by mutating code.

```bash
npm run test:mutation
```

## Coverage Requirements

| Metric     | Target  |
|------------|---------|
| Statements | >90%    |
| Branches   | >90%    |
| Functions  | >90%    |
| Lines      | >90%    |

## Test Helpers

### MockFactory

Create test data easily:

```typescript
import { createUser, createMockRequest } from '@tests/helpers/mock-factory';

const user = createUser();
const req = createMockRequest({ body: { email: 'test@example.com' }});
```

### Database Cleaner

Automatic database cleanup:

```typescript
import { setupDatabaseCleaner } from '@tests/helpers/database-cleaner';

const cleaner = setupDatabaseCleaner(dbPool);
// Automatically cleans between tests
```

### Test Server

Isolated test server:

```typescript
import { createTestServer } from '@tests/helpers/test-server';

const server = createTestServer(app);
await server.start();
const url = server.getUrl();
```

## Best Practices

### 1. Arrange-Act-Assert Pattern

```typescript
it('should validate email', () => {
  // Arrange
  const email = 'invalid-email';

  // Act
  const result = validateEmail(email);

  // Assert
  expect(result).toBe(false);
});
```

### 2. One Assertion Per Test

```typescript
// ❌ Bad
it('should create and update user', () => {
  const user = createUser();
  expect(user.id).toBeDefined();
  const updated = updateUser(user);
  expect(updated.name).toBe('Updated');
});

// ✅ Good
it('should create user with id', () => {
  const user = createUser();
  expect(user.id).toBeDefined();
});

it('should update user name', () => {
  const updated = updateUser(user);
  expect(updated.name).toBe('Updated');
});
```

### 3. Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should return 401 when authentication token is missing', () => { ... });
```

### 4. Test Independence

```typescript
// ❌ Bad - Tests depend on order
let user;
it('creates user', () => { user = createUser(); });
it('updates user', () => { updateUser(user); });

// ✅ Good - Each test is independent
it('creates user', () => {
  const user = createUser();
  expect(user).toBeDefined();
});

it('updates user', () => {
  const user = createUser();
  const updated = updateUser(user);
  expect(updated).toBeDefined();
});
```

### 5. Mock External Dependencies

```typescript
import { createMockEmailService } from '@tests/helpers/mock-factory';

const mockEmail = createMockEmailService();
const authService = new AuthService(db, logger, mockEmail);

expect(mockEmail.send).toHaveBeenCalled();
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run db:test:up
      - run: npm run test:ci
      - run: npm run test:e2e
```

## Coverage Reports

After running tests, view coverage reports:

```bash
# Generate HTML coverage report
npm run test:coverage

# Open report
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

## Debugging Tests

### Jest Debugging

```bash
# Debug in Chrome DevTools
npm run test:debug

# Then open chrome://inspect
```

### Playwright Debugging

```bash
# Run with debugger
PWDEBUG=1 npm run test:e2e

# Or use UI mode
npm run test:e2e:ui
```

## Performance Optimization

### Parallel Execution

```bash
# Run tests in parallel (default)
npm test

# Run serially (for integration tests)
npm run test:integration -- --runInBand
```

### Test Isolation

- Use transactions for database tests
- Clean state between tests
- Mock external services
- Use test-specific configuration

## Continuous Improvement

### Mutation Testing Results

After running mutation tests:

```bash
npm run test:mutation
open coverage/mutation-report.html
```

### Coverage Trends

Track coverage over time:

```bash
# Generate coverage badge
npm run test:coverage -- --coverageReporters=json-summary
```

## Troubleshooting

### Database Connection Issues

```bash
# Reset test database
npm run db:test:reset

# Check database status
docker-compose -f docker-compose.test.yml ps
```

### Playwright Issues

```bash
# Reinstall browsers
npm run playwright:install

# Clear Playwright cache
npx playwright install --with-deps
```

### Memory Issues

```bash
# Increase Node.js memory
NODE_OPTIONS=--max_old_space_size=4096 npm test
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Stryker Documentation](https://stryker-mutator.io/)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For questions or issues:
- Create an issue in the project repository
- Contact the testing team
- Review test examples in the codebase

---

**Remember:** Good tests are the foundation of maintainable software. Invest in quality tests for long-term success.
