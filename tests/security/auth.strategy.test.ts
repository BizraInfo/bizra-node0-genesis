/**
 * Authentication Strategy Tests
 * Comprehensive test suite for JWT authentication
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthStrategy } from '../../src/security/auth.strategy';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('AuthStrategy', () => {
  let authStrategy: AuthStrategy;

  beforeEach(() => {
    authStrategy = new AuthStrategy();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Generation', () => {
    it('should generate valid access and refresh token pair', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const roles = ['user'];
      const permissions = ['content:read', 'content:write'];

      const tokenPair = await authStrategy.generateTokenPair(
        userId,
        email,
        roles,
        permissions
      );

      expect(tokenPair).toHaveProperty('accessToken');
      expect(tokenPair).toHaveProperty('refreshToken');
      expect(tokenPair).toHaveProperty('expiresIn');
      expect(tokenPair).toHaveProperty('refreshExpiresIn');
      expect(tokenPair.expiresIn).toBe(15 * 60); // 15 minutes
      expect(tokenPair.refreshExpiresIn).toBe(7 * 24 * 60 * 60); // 7 days
    });

    it('should generate tokens with correct payload', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const roles = ['user', 'admin'];
      const permissions = ['content:read', 'content:write', 'user:manage'];

      const tokenPair = await authStrategy.generateTokenPair(
        userId,
        email,
        roles,
        permissions
      );

      const decoded = await authStrategy.verifyToken(tokenPair.accessToken);

      expect(decoded.userId).toBe(userId);
      expect(decoded.email).toBe(email);
      expect(decoded.roles).toEqual(roles);
      expect(decoded.permissions).toEqual(permissions);
      expect(decoded.iss).toBe('bizra-secure-api');
      expect(decoded.aud).toBe('bizra-clients');
    });

    it('should generate unique token IDs for each token pair', async () => {
      const tokenPair1 = await authStrategy.generateTokenPair(
        'user-1',
        'test1@example.com',
        ['user'],
        []
      );

      const tokenPair2 = await authStrategy.generateTokenPair(
        'user-2',
        'test2@example.com',
        ['user'],
        []
      );

      const decoded1 = await authStrategy.verifyToken(tokenPair1.accessToken);
      const decoded2 = await authStrategy.verifyToken(tokenPair2.accessToken);

      expect(decoded1.tokenId).not.toBe(decoded2.tokenId);
    });
  });

  describe('Token Verification', () => {
    it('should verify valid token successfully', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        ['content:read']
      );

      const decoded = await authStrategy.verifyToken(tokenPair.accessToken);

      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should reject token with invalid signature', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      // Tamper with token
      const parts = tokenPair.accessToken.split('.');
      parts[2] = 'invalid-signature';
      const tamperedToken = parts.join('.');

      await expect(authStrategy.verifyToken(tamperedToken)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should reject expired token', async () => {
      // Create token with immediate expiry
      const userId = 'user-123';
      const payload = {
        userId,
        email: 'test@example.com',
        roles: ['user'],
        permissions: [],
        tokenId: crypto.randomUUID(),
        iss: 'bizra-secure-api',
        aud: 'bizra-clients'
      };

      // Mock token with past expiry
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await expect(
        authStrategy.verifyToken('expired-token')
      ).rejects.toThrow('Token expired');
    });

    it('should reject revoked token', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const decoded = await authStrategy.verifyToken(tokenPair.accessToken);
      authStrategy.revokeToken(decoded.tokenId, 'Test revocation');

      await expect(
        authStrategy.verifyToken(tokenPair.accessToken)
      ).rejects.toThrow('Token has been revoked');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const originalTokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        ['content:read']
      );

      const newTokenPair = await authStrategy.refreshAccessToken(
        originalTokenPair.refreshToken
      );

      expect(newTokenPair).toHaveProperty('accessToken');
      expect(newTokenPair).toHaveProperty('refreshToken');
      expect(newTokenPair.accessToken).not.toBe(originalTokenPair.accessToken);
      expect(newTokenPair.refreshToken).not.toBe(originalTokenPair.refreshToken);
    });

    it('should reject refresh with revoked refresh token', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const decoded = jwt.decode(tokenPair.refreshToken) as any;
      authStrategy.revokeToken(decoded.refreshId, 'Test');

      await expect(
        authStrategy.refreshAccessToken(tokenPair.refreshToken)
      ).rejects.toThrow('Refresh token has been revoked');
    });

    it('should revoke old tokens after refresh', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      await authStrategy.refreshAccessToken(tokenPair.refreshToken);

      // Original tokens should be revoked
      await expect(
        authStrategy.verifyToken(tokenPair.accessToken)
      ).rejects.toThrow();
    });
  });

  describe('Token Revocation', () => {
    it('should revoke token successfully', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const decoded = await authStrategy.verifyToken(tokenPair.accessToken);
      authStrategy.revokeToken(decoded.tokenId, 'Manual revocation');

      await expect(
        authStrategy.verifyToken(tokenPair.accessToken)
      ).rejects.toThrow('Token has been revoked');
    });

    it('should revoke all user tokens', async () => {
      const userId = 'user-123';

      const token1 = await authStrategy.generateTokenPair(
        userId,
        'test@example.com',
        ['user'],
        []
      );

      const token2 = await authStrategy.generateTokenPair(
        userId,
        'test@example.com',
        ['user'],
        []
      );

      authStrategy.revokeUserTokens(userId, 'User logout');

      await expect(authStrategy.verifyToken(token1.accessToken)).rejects.toThrow();
      await expect(authStrategy.verifyToken(token2.accessToken)).rejects.toThrow();
    });
  });

  describe('Token Cleanup', () => {
    it('should cleanup expired tokens', async () => {
      // Generate token
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      // Run cleanup
      authStrategy.cleanupExpiredTokens();

      // Active tokens should still work
      const decoded = await authStrategy.verifyToken(tokenPair.accessToken);
      expect(decoded.userId).toBe('user-123');
    });
  });

  describe('Express Middleware', () => {
    it('should authenticate valid request', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const req: any = {
        headers: {
          authorization: `Bearer ${tokenPair.accessToken}`
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      await authStrategy.authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('user-123');
    });

    it('should reject request without token', async () => {
      const req: any = {
        headers: {}
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      await authStrategy.authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const req: any = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };

      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const next = jest.fn();

      await authStrategy.authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Security Properties', () => {
    it('should use RS256 algorithm', () => {
      // Verify that the auth strategy uses RS256
      const strategy = new AuthStrategy();
      expect((strategy as any).algorithm).toBe('RS256');
    });

    it('should have short-lived access tokens', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const decoded = jwt.decode(tokenPair.accessToken) as any;
      const expiryTime = decoded.exp - decoded.iat;

      expect(expiryTime).toBeLessThanOrEqual(15 * 60); // 15 minutes or less
    });

    it('should include issuer and audience claims', async () => {
      const tokenPair = await authStrategy.generateTokenPair(
        'user-123',
        'test@example.com',
        ['user'],
        []
      );

      const decoded = jwt.decode(tokenPair.accessToken) as any;

      expect(decoded.iss).toBe('bizra-secure-api');
      expect(decoded.aud).toBe('bizra-clients');
    });
  });
});
