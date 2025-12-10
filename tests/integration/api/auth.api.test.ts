/**
 * @test Authentication API Integration Tests
 * @description Full API integration tests for authentication endpoints
 * @coverage E2E API flows with real database
 */
import request from 'supertest';
import { createTestServer, setupTestApp } from '@tests/helpers/test-server';
import { setupDatabaseCleaner } from '@tests/helpers/database-cleaner';
import { validUser, userCredentials } from '@tests/fixtures/users.fixture';
import { Pool } from 'pg';

describe('Authentication API Integration', () => {
  let server: any;
  let app: any;
  let dbPool: Pool;
  let dbCleaner: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Setup database
    dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'test_db',
      user: process.env.DB_USER || 'test_user',
      password: process.env.DB_PASSWORD || 'test_pass',
    });

    dbCleaner = setupDatabaseCleaner(dbPool);

    // Setup server
    app = setupTestApp();
    server = createTestServer(app);
    await server.start();
    baseUrl = server.getUrl();
  });

  afterAll(async () => {
    await server.stop();
    await dbPool.end();
  });

  beforeEach(async () => {
    await dbCleaner.clean();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(validUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Duplicate registration
      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    it('should hash password before storage', async () => {
      await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Check database directly
      const result = await dbPool.query(
        'SELECT password FROM users WHERE email = $1',
        [validUser.email]
      );

      expect(result.rows[0].password).not.toBe(validUser.password);
      expect(result.rows[0].password).toMatch(/^\$2[aby]\$/); // bcrypt hash
    });

    it('should send verification email', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      // Check that verification token was created
      const result = await dbPool.query(
        'SELECT verification_token FROM users WHERE id = $1',
        [response.body.user.id]
      );

      expect(result.rows[0].verification_token).toBeTruthy();
    });

    it('should validate all required fields', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }) // Missing password
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: 'password' })
      );
    });

    it('should prevent SQL injection', async () => {
      const maliciousData = {
        ...validUser,
        email: "'; DROP TABLE users; --@example.com",
      };

      await request(baseUrl)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(400);

      // Verify table still exists
      const result = await dbPool.query('SELECT COUNT(*) FROM users');
      expect(result.rows).toBeDefined();
    });

    it('should handle concurrent registrations', async () => {
      const users = [
        { ...validUser, email: 'user1@example.com' },
        { ...validUser, email: 'user2@example.com' },
        { ...validUser, email: 'user3@example.com' },
      ];

      const requests = users.map(user =>
        request(baseUrl)
          .post('/api/auth/register')
          .send(user)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register user before login tests
      await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.valid)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userCredentials.valid.email);
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.invalidPassword)
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.nonExistentUser)
        .expect(401);

      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should return valid JWT token', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.valid)
        .expect(200);

      const token = response.body.token;
      expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    it('should update last login timestamp', async () => {
      const loginTime = new Date();

      await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.valid)
        .expect(200);

      const result = await dbPool.query(
        'SELECT last_login FROM users WHERE email = $1',
        [userCredentials.valid.email]
      );

      const lastLogin = new Date(result.rows[0].last_login);
      expect(lastLogin.getTime()).toBeGreaterThanOrEqual(loginTime.getTime());
    });

    it('should implement rate limiting after failed attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(baseUrl)
          .post('/api/auth/login')
          .send(userCredentials.invalidPassword)
          .expect(401);
      }

      // Next attempt should be rate limited
      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.valid)
        .expect(429);

      expect(response.body.error).toContain('Too many attempts');
    });

    it('should accept case-insensitive email', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send({
          email: userCredentials.valid.email.toUpperCase(),
          password: userCredentials.valid.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let verificationToken: string;
    let userId: string;

    beforeEach(async () => {
      const response = await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser);

      userId = response.body.user.id;

      // Get verification token from database
      const result = await dbPool.query(
        'SELECT verification_token FROM users WHERE id = $1',
        [userId]
      );
      verificationToken = result.rows[0].verification_token;
    });

    it('should verify email with valid token', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.message).toContain('verified');

      // Check database
      const result = await dbPool.query(
        'SELECT email_verified FROM users WHERE id = $1',
        [userId]
      );
      expect(result.rows[0].email_verified).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400);

      expect(response.body.error).toContain('Invalid');
    });

    it('should not verify already verified email', async () => {
      // First verification
      await request(baseUrl)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200);

      // Second verification attempt
      const response = await request(baseUrl)
        .post('/api/auth/verify-email')
        .send({ token: verificationToken })
        .expect(400);

      expect(response.body.error).toContain('already verified');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser);

      const loginResponse = await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.valid);

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should generate new token from refresh token', async () => {
      const response = await request(baseUrl)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(refreshToken);
    });

    it('should invalidate used refresh token', async () => {
      // First refresh
      await request(baseUrl)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      // Try to use same token again
      const response = await request(baseUrl)
        .post('/api/auth/refresh-token')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });
  });

  describe('Protected Endpoints', () => {
    let authToken: string;

    beforeEach(async () => {
      await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser);

      const response = await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.valid);

      authToken = response.body.token;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(baseUrl)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe(validUser.email);
    });

    it('should reject request without token', async () => {
      const response = await request(baseUrl)
        .get('/api/users/me')
        .expect(401);

      expect(response.body.error).toContain('No token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(baseUrl)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toContain('Invalid token');
    });

    it('should reject expired token', async () => {
      // Create expired token
      const expiredToken = 'expired.jwt.token'; // Mock expired token

      const response = await request(baseUrl)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toContain('expired');
    });
  });

  describe('Performance', () => {
    it('should handle 100 concurrent registrations', async () => {
      const users = Array.from({ length: 100 }, (_, i) => ({
        ...validUser,
        email: `user${i}@example.com`,
        username: `user${i}`,
      }));

      const start = performance.now();
      const requests = users.map(user =>
        request(baseUrl)
          .post('/api/auth/register')
          .send(user)
      );

      await Promise.all(requests);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10000); // Under 10 seconds
    });

    it('should respond to login under 200ms', async () => {
      await request(baseUrl)
        .post('/api/auth/register')
        .send(validUser);

      const start = performance.now();
      await request(baseUrl)
        .post('/api/auth/login')
        .send(userCredentials.valid);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(200);
    });
  });
});
