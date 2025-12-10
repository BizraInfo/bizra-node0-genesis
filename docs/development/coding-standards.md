# Coding Standards

## Overview

This document outlines the coding standards and best practices for the Enterprise API Platform. Following these standards ensures code consistency, maintainability, and quality across the entire codebase.

## General Principles

### 1. Code Quality

- **Write self-documenting code**: Use descriptive names over comments
- **Keep it simple**: Avoid over-engineering and unnecessary complexity
- **DRY (Don't Repeat Yourself)**: Extract reusable logic into functions/modules
- **SOLID principles**: Follow object-oriented design principles
- **Boy Scout Rule**: Leave code better than you found it

### 2. Performance

- **Optimize for readability first**: Premature optimization is the root of all evil
- **Measure before optimizing**: Use profiling tools to identify bottlenecks
- **Async by default**: Use async/await for I/O operations
- **Pagination**: Always paginate large datasets
- **Caching**: Cache expensive operations appropriately

### 3. Security

- **Input validation**: Validate and sanitize all user inputs
- **Parameterized queries**: Prevent SQL injection
- **Authentication**: Never trust client-side authentication
- **Secrets management**: Never commit secrets to version control
- **Least privilege**: Grant minimum necessary permissions

## Language-Specific Standards

### JavaScript/TypeScript

#### File Structure

```typescript
// services/user/userService.ts

// 1. Imports (external packages first, then internal)
import { Router } from "express";
import { z } from "zod";

import { database } from "../database";
import { logger } from "../utils/logger";
import { AuthMiddleware } from "../middleware/auth";

// 2. Types and interfaces
interface UserCreateRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

// 3. Constants
const MAX_LOGIN_ATTEMPTS = 5;
const PASSWORD_MIN_LENGTH = 8;

// 4. Validation schemas
const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

// 5. Main class or function exports
export class UserService {
  constructor(
    private db: Database,
    private logger: Logger,
  ) {}

  async createUser(data: UserCreateRequest): Promise<UserResponse> {
    // Implementation
  }

  async getUser(id: string): Promise<UserResponse | null> {
    // Implementation
  }
}

// 6. Helper functions (private)
function hashPassword(password: string): Promise<string> {
  // Implementation
}

// 7. Default export (if applicable)
export default UserService;
```

#### Naming Conventions

```typescript
// Classes: PascalCase
class UserService {}
class AuthenticationMiddleware {}

// Functions/methods: camelCase
function getUserById() {}
async function fetchData() {}

// Variables: camelCase
const userName = "John";
let isAuthenticated = false;

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = "https://api.example.com";

// Private properties: prefix with underscore
class Example {
  private _privateProperty: string;
  public publicProperty: number;
}

// Interfaces: PascalCase with descriptive names
interface UserRepository {}
interface ApiResponse<T> {}

// Type aliases: PascalCase
type UserId = string;
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

// Enums: PascalCase for enum, UPPER_CASE for values
enum UserRole {
  ADMIN = "admin",
  MEMBER = "member",
  VIEWER = "viewer",
}

// Files: kebab-case
// user-service.ts
// authentication-middleware.ts
// api-client.ts
```

#### TypeScript Best Practices

```typescript
// ✅ Use explicit types for function parameters and returns
function getUser(id: string): Promise<User | null> {
  return database.users.findById(id);
}

// ✅ Use interfaces for objects
interface User {
  id: string;
  email: string;
  role: UserRole;
}

// ✅ Use type unions for specific values
type Status = 'pending' | 'approved' | 'rejected';

// ✅ Use enums for related constants
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401
}

// ✅ Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  error: string | null;
  timestamp: Date;
}

// ❌ Avoid 'any' type
// Bad
function processData(data: any): any {}

// Good
function processData<T>(data: T): T {}

// ✅ Use strict null checks
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true
  }
}

// ✅ Use readonly for immutable properties
interface Config {
  readonly apiKey: string;
  readonly baseUrl: string;
}

// ✅ Use utility types
type PartialUser = Partial<User>;
type RequiredUser = Required<User>;
type UserWithoutPassword = Omit<User, 'password'>;
type UserIdAndEmail = Pick<User, 'id' | 'email'>;
```

#### Async/Await

```typescript
// ✅ Use async/await over callbacks
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await database.users.findById(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  } catch (error) {
    logger.error("Failed to fetch user:", error);
    throw error;
  }
}

// ✅ Handle errors with try/catch
async function updateUser(id: string, data: Partial<User>): Promise<User> {
  try {
    const user = await database.users.update(id, data);
    await cache.invalidate(`user:${id}`);
    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new BadRequestError(error.message);
    }
    throw error;
  }
}

// ✅ Use Promise.all for parallel operations
async function getUserWithProjects(userId: string): Promise<UserWithProjects> {
  const [user, projects] = await Promise.all([
    database.users.findById(userId),
    database.projects.findByUserId(userId),
  ]);

  return { ...user, projects };
}

// ❌ Don't mix async/await with .then()
// Bad
async function badExample() {
  return fetchUser("123").then((user) => user.email);
}

// Good
async function goodExample() {
  const user = await fetchUser("123");
  return user.email;
}
```

#### Error Handling

```typescript
// Define custom error classes
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errorType: string,
    public details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NotFound");
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, "ValidationError", details);
  }
}

// Use custom errors
async function getUser(id: string): Promise<User> {
  const user = await database.users.findById(id);

  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`);
  }

  return user;
}

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.errorType,
      message: err.message,
      details: err.details,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    });
  }

  // Log unexpected errors
  logger.error("Unexpected error:", err);

  res.status(500).json({
    error: "InternalServerError",
    message: "An unexpected error occurred",
    requestId: req.id,
  });
});
```

### Code Organization

#### Folder Structure

```
src/
├── api/                    # API routes and controllers
│   ├── v1/
│   │   ├── auth/
│   │   │   ├── authController.ts
│   │   │   ├── authRoutes.ts
│   │   │   └── authValidation.ts
│   │   └── users/
│   │       ├── userController.ts
│   │       ├── userRoutes.ts
│   │       └── userValidation.ts
│   └── index.ts
├── services/               # Business logic
│   ├── authService.ts
│   ├── userService.ts
│   └── emailService.ts
├── models/                 # Data models and schemas
│   ├── User.ts
│   ├── Organization.ts
│   └── index.ts
├── middleware/             # Express middleware
│   ├── authentication.ts
│   ├── authorization.ts
│   ├── rateLimiting.ts
│   └── errorHandler.ts
├── utils/                  # Utility functions
│   ├── logger.ts
│   ├── validation.ts
│   └── crypto.ts
├── config/                 # Configuration
│   ├── database.ts
│   ├── redis.ts
│   └── index.ts
├── types/                  # TypeScript type definitions
│   ├── express.d.ts
│   └── models.ts
└── index.ts                # Application entry point
```

#### Module Exports

```typescript
// ✅ Named exports for multiple items
// utils/crypto.ts
export function hashPassword(password: string): Promise<string> {}
export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {}
export function generateToken(): string {}

// ✅ Default export for single main item
// services/userService.ts
export default class UserService {
  // Implementation
}

// ✅ Combine named and default exports
// services/authService.ts
export class AuthService {}
export { AuthError, TokenExpiredError };
export default new AuthService();

// ✅ Re-export from index files
// models/index.ts
export { User } from "./User";
export { Organization } from "./Organization";
export { Project } from "./Project";
```

## Testing Standards

### Test Structure

```typescript
// user.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { UserService } from "./userService";
import { database } from "../database";

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService(database);
  });

  afterEach(async () => {
    await database.truncate();
  });

  describe("createUser", () => {
    it("should create a new user with valid data", async () => {
      // Arrange
      const userData = {
        email: "test@example.com",
        password: "SecureP@ssw0rd",
        firstName: "John",
        lastName: "Doe",
      };

      // Act
      const user = await userService.createUser(userData);

      // Assert
      expect(user).toHaveProperty("id");
      expect(user.email).toBe(userData.email);
      expect(user).not.toHaveProperty("password"); // Password should not be in response
    });

    it("should throw ValidationError for invalid email", async () => {
      // Arrange
      const invalidData = {
        email: "not-an-email",
        password: "SecureP@ssw0rd",
        firstName: "John",
        lastName: "Doe",
      };

      // Act & Assert
      await expect(userService.createUser(invalidData)).rejects.toThrow(
        ValidationError,
      );
    });

    it("should throw ConflictError for duplicate email", async () => {
      // Arrange
      const userData = {
        email: "test@example.com",
        password: "SecureP@ssw0rd",
        firstName: "John",
        lastName: "Doe",
      };

      await userService.createUser(userData);

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe("getUser", () => {
    it("should return user by ID", async () => {
      // Arrange
      const createdUser = await userService.createUser({
        email: "test@example.com",
        password: "password",
        firstName: "John",
        lastName: "Doe",
      });

      // Act
      const user = await userService.getUser(createdUser.id);

      // Assert
      expect(user).toBeDefined();
      expect(user?.id).toBe(createdUser.id);
    });

    it("should return null for non-existent user", async () => {
      // Act
      const user = await userService.getUser("non-existent-id");

      // Assert
      expect(user).toBeNull();
    });
  });
});
```

### Test Coverage Requirements

- **Unit tests**: 80% minimum coverage
- **Integration tests**: Critical paths covered
- **E2E tests**: Main user flows covered

```bash
# Run tests with coverage
npm run test:coverage

# Coverage report
---------|---------|----------|---------|---------|-------------------
File     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------|---------|----------|---------|---------|-------------------
All files|   85.2  |   78.5   |   90.1  |   85.7  |
```

## Documentation Standards

### Code Comments

````typescript
// ✅ Use JSDoc for public APIs
/**
 * Creates a new user account
 *
 * @param data - User registration data
 * @returns Promise resolving to created user (without password)
 * @throws {ValidationError} If input data is invalid
 * @throws {ConflictError} If email already exists
 *
 * @example
 * ```typescript
 * const user = await userService.createUser({
 *   email: 'user@example.com',
 *   password: 'SecureP@ssw0rd',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 * ```
 */
async function createUser(data: UserCreateRequest): Promise<UserResponse> {
  // Implementation
}

// ✅ Comment complex logic
function calculateDiscount(price: number, userTier: string): number {
  // Apply tiered discount based on user membership level
  // - Basic: 5%
  // - Premium: 10%
  // - Enterprise: 15%
  const discountRates = {
    basic: 0.05,
    premium: 0.1,
    enterprise: 0.15,
  };

  return price * (1 - discountRates[userTier]);
}

// ✅ TODO comments with ticket reference
// TODO(JIRA-123): Implement caching for user queries
async function getUser(id: string): Promise<User> {
  return database.users.findById(id);
}

// ❌ Avoid obvious comments
// Bad: Creates a user
function createUser() {}

// ❌ Avoid commented-out code (use version control)
// function oldImplementation() {
//   ...
// }
````

## Version Control Standards

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description

feat(auth): add MFA support with TOTP
fix(users): resolve pagination cursor bug
docs(api): update authentication guide
refactor(db): extract query builder to separate module
test(users): add integration tests for user service
chore(deps): upgrade express to v4.18
perf(cache): optimize Redis connection pooling
```

### Branch Naming

```bash
# Feature branches
feature/JIRA-123-add-mfa-support
feature/user-profile-improvements

# Bug fixes
fix/JIRA-456-pagination-bug
hotfix/critical-auth-vulnerability

# Releases
release/v1.2.0

# Documentation
docs/update-api-guide
```

### Pull Request Guidelines

1. **Title**: Clear, descriptive summary
2. **Description**: Explain what, why, and how
3. **Tests**: Include test coverage
4. **Screenshots**: For UI changes
5. **Breaking Changes**: Clearly marked
6. **Checklist**: Use PR template

```markdown
## Description

Add multi-factor authentication (MFA) support using TOTP.

## Changes

- Add MFA setup endpoint
- Implement TOTP verification
- Update authentication flow
- Add MFA UI components

## Testing

- Unit tests for TOTP generation/validation
- Integration tests for MFA flow
- Manual testing with Google Authenticator

## Breaking Changes

None

## Checklist

- [x] Tests pass
- [x] Documentation updated
- [x] Code reviewed
- [x] CHANGELOG updated
```

## Additional Resources

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
