/**
 * Security Integration Tests
 * End-to-end security testing
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import { authStrategy } from '../../src/security/auth.strategy';
import { requirePermissions, Permission } from '../../src/security/rbac.middleware';
import { validate, registerUserSchema, loginUserSchema } from '../../src/security/validator';
import { globalRateLimiter, authRateLimiter } from '../../src/security/rate-limiter';
import { applySecurityHeaders } from '../../src/security/security-headers';

describe('Security Integration Tests', () => {
  let app: Application;
  let accessToken: string;

  beforeAll(async () => {
    // Setup Express app with security middleware
    app = express();
    app.use(express.json());

    // Apply security headers
    applySecurityHeaders(app);

    // Test routes
    app.post('/api/auth/register', validate({ body: registerUserSchema }), (req, res) => {
      res.status(201).json({ message: 'User registered' });
    });

    app.post('/api/auth/login', authRateLimiter, validate({ body: loginUserSchema }), async (req, res) => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        req.body.email,
        ['user'],
        []
      );
      res.json(tokenPair);
    });

    app.get('/api/protected', authStrategy.authMiddleware, (req, res) => {
      res.json({ message: 'Protected resource', user: (req as any).user });
    });

    app.get(
      '/api/admin',
      authStrategy.authMiddleware,
      requirePermissions(Permission.ADMIN_READ),
      (req, res) => {
        res.json({ message: 'Admin resource' });
      }
    );

    app.get('/api/rate-limited', globalRateLimiter, (req, res) => {
      res.json({ message: 'Success' });
    });
  });

  describe('Authentication Flow', () => {
    it('should register user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecureP@ssw0rd123',
          firstName: 'Test',
          lastName: 'User',
          acceptTerms: true
        });

      expect(response.status).toBe(201);
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          firstName: 'Test',
          lastName: 'User',
          acceptTerms: true
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should login and receive token pair', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      accessToken = response.body.accessToken;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
    });

    it('should reject access without token', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.status).toBe(401);
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    it('should deny access to admin route for regular user', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
    });

    it('should allow access to admin route for admin user', async () => {
      // Generate admin token
      const adminToken = await authStrategy.generateTokenPair(
        'admin-123',
        'admin@example.com',
        ['admin'],
        [Permission.ADMIN_READ]
      );

      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', `Bearer ${adminToken.accessToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecureP@ssw0rd123',
          firstName: 'Test',
          lastName: 'User',
          acceptTerms: true
        });

      expect(response.status).toBe(400);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
    });

    it('should sanitize and validate input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: '  TEST@EXAMPLE.COM  ',
          password: 'SecureP@ssw0rd123',
          firstName: 'Test',
          lastName: 'User',
          acceptTerms: true
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limit on login endpoint', async () => {
      // Make multiple requests
      const requests = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrong-password'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      const response = await request(app).get('/api/rate-limited');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Security Headers', () => {
    it('should include Content-Security-Policy header', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.headers).toHaveProperty('content-security-policy');
    });

    it('should include HSTS header', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.headers).toHaveProperty('strict-transport-security');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should include X-Content-Type-Options header', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should not expose X-Powered-By header', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.headers).not.toHaveProperty('x-powered-by');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight request', async () => {
      const response = await request(app)
        .options('/api/protected')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.status).toBe(204);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Origin', 'http://localhost:3000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Error Handling', () => {
    it('should return generic error for authentication failure', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
      expect(response.body).not.toHaveProperty('stack');
    });

    it('should return validation errors without sensitive data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('stack');
    });
  });

  describe('Token Security', () => {
    it('should use RS256 algorithm for tokens', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const header = JSON.parse(
        Buffer.from(tokenPair.accessToken.split('.')[0], 'base64').toString()
      );

      expect(header.alg).toBe('RS256');
    });

    it('should include required JWT claims', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const payload = JSON.parse(
        Buffer.from(tokenPair.accessToken.split('.')[1], 'base64').toString()
      );

      expect(payload).toHaveProperty('iss');
      expect(payload).toHaveProperty('aud');
      expect(payload).toHaveProperty('iat');
      expect(payload).toHaveProperty('exp');
      expect(payload).toHaveProperty('userId');
    });

    it('should have short-lived access tokens', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const payload = JSON.parse(
        Buffer.from(tokenPair.accessToken.split('.')[1], 'base64').toString()
      );

      const expiryTime = payload.exp - payload.iat;
      expect(expiryTime).toBeLessThanOrEqual(15 * 60); // 15 minutes
    });
  });
});
