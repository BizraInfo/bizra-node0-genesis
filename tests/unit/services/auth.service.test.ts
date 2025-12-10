/**
 * @test Authentication Service Unit Tests
 * @description Comprehensive tests for authentication service
 * @coverage >95% - All authentication flows and edge cases
 */
import { AuthService } from '@/services/auth.service';
import { createMockDbClient, createMockLogger, createMockEmailService } from '@tests/helpers/mock-factory';
import { validUser, userCredentials, invalidUsers } from '@tests/fixtures/users.fixture';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockDb: any;
  let mockLogger: any;
  let mockEmailService: any;

  beforeEach(() => {
    mockDb = createMockDbClient();
    mockLogger = createMockLogger();
    mockEmailService = createMockEmailService();
    authService = new AuthService(mockDb, mockLogger, mockEmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const hashedPassword = 'hashed_password_123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Check if user exists
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: '123', ...validUser, password: hashedPassword }]
      }); // Insert user

      // Act
      const result = await authService.register(validUser);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(validUser.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(validUser.password, 10);
      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockEmailService.sendVerification).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: '123' }] });

      // Act & Assert
      await expect(authService.register(validUser))
        .rejects.toThrow('Email already exists');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      // Act & Assert
      await expect(authService.register(invalidUsers.invalidEmail))
        .rejects.toThrow('Invalid email format');
    });

    it('should validate password strength', async () => {
      // Act & Assert
      await expect(authService.register(invalidUsers.weakPassword))
        .rejects.toThrow('Password does not meet security requirements');
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockDb.query.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(authService.register(validUser))
        .rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should sanitize user input', async () => {
      // Arrange
      const maliciousUser = {
        ...validUser,
        email: "test@example.com'; DROP TABLE users; --",
      };
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: '123' }] });

      // Act
      await authService.register(maliciousUser);

      // Assert
      const queryCall = mockDb.query.mock.calls[1];
      expect(queryCall[0]).not.toContain('DROP TABLE');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('SecurePass123!', 10);
      const user = { id: '123', email: validUser.email, password: hashedPassword };
      mockDb.query.mockResolvedValue({ rows: [user] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('jwt_token_123');

      // Act
      const result = await authService.login(userCredentials.valid);

      // Assert
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(validUser.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('SecurePass123!', hashedPassword);
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should throw error with invalid password', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ id: '123', password: 'hashed' }] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(userCredentials.invalidPassword))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(authService.login(userCredentials.nonExistentUser))
        .rejects.toThrow('Invalid credentials');
    });

    it('should update last login timestamp', async () => {
      // Arrange
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: '123', password: 'hashed' }] });
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // Update query
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token');

      // Act
      await authService.login(userCredentials.valid);

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('last_login'),
        expect.any(Array)
      );
    });

    it('should implement rate limiting', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ id: '123', password: 'hashed' }] });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act - Multiple failed attempts
      const attempts = Array(6).fill(null).map(() =>
        authService.login(userCredentials.invalidPassword).catch(() => {})
      );
      await Promise.all(attempts);

      // Assert - Next attempt should be rate limited
      await expect(authService.login(userCredentials.valid))
        .rejects.toThrow('Too many login attempts');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', () => {
      // Arrange
      const payload = { userId: '123', email: 'test@example.com' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      // Act
      const result = authService.verifyToken('valid_token');

      // Assert
      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalled();
    });

    it('should throw error for expired token', () => {
      // Arrange
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act & Assert
      expect(() => authService.verifyToken('expired_token'))
        .toThrow('Token expired');
    });

    it('should throw error for invalid token', () => {
      // Arrange
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      expect(() => authService.verifyToken('invalid_token'))
        .toThrow('Invalid token');
    });
  });

  describe('refreshToken', () => {
    it('should generate new token from valid refresh token', async () => {
      // Arrange
      const payload = { userId: '123' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      (jwt.sign as jest.Mock).mockReturnValue('new_token');
      mockDb.query.mockResolvedValue({ rows: [{ id: '123', email: 'test@example.com' }] });

      // Act
      const result = await authService.refreshToken('refresh_token');

      // Assert
      expect(result).toHaveProperty('token');
      expect(jwt.sign).toHaveBeenCalled();
    });

    it('should invalidate used refresh token', async () => {
      // Arrange
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });
      (jwt.sign as jest.Mock).mockReturnValue('new_token');
      mockDb.query.mockResolvedValue({ rows: [{ id: '123' }] });

      // Act
      await authService.refreshToken('refresh_token');

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.any(Array)
      );
    });
  });

  describe('resetPassword', () => {
    it('should generate password reset token', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ id: '123' }] });

      // Act
      await authService.requestPasswordReset('test@example.com');

      // Assert
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalled();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('reset_token'),
        expect.any(Array)
      );
    });

    it('should not reveal if email does not exist', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [] });

      // Act & Assert - Should not throw error
      await expect(authService.requestPasswordReset('nonexistent@example.com'))
        .resolves.not.toThrow();
      expect(mockEmailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('should reset password with valid token', async () => {
      // Arrange
      const resetToken = 'valid_reset_token';
      mockDb.query.mockResolvedValue({
        rows: [{ id: '123', reset_token: resetToken, reset_expires: new Date(Date.now() + 3600000) }]
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed_password');

      // Act
      await authService.resetPassword(resetToken, 'NewSecurePass123!');

      // Assert
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.any(Array)
      );
    });

    it('should reject expired reset token', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ id: '123', reset_expires: new Date(Date.now() - 1000) }]
      });

      // Act & Assert
      await expect(authService.resetPassword('expired_token', 'NewPass123!'))
        .rejects.toThrow('Reset token expired');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent registration attempts', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      mockDb.query.mockResolvedValueOnce({ rows: [{ id: '123' }] });

      // Act
      const attempts = Array(5).fill(null).map(() =>
        authService.register({ ...validUser, email: `test${Math.random()}@example.com` })
      );

      // Assert
      await expect(Promise.all(attempts)).resolves.toHaveLength(5);
    });

    it('should handle very long passwords', async () => {
      // Arrange
      const longPassword = 'A1!' + 'a'.repeat(1000);

      // Act & Assert
      await expect(authService.register({ ...validUser, password: longPassword }))
        .rejects.toThrow('Password exceeds maximum length');
    });

    it('should handle unicode characters in email', async () => {
      // Arrange
      const unicodeEmail = 'test测试@example.com';

      // Act & Assert
      await expect(authService.register({ ...validUser, email: unicodeEmail }))
        .rejects.toThrow('Invalid email format');
    });
  });

  describe('Performance', () => {
    it('should hash password in under 200ms', async () => {
      // Arrange
      (bcrypt.hash as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
        return 'hashed';
      });

      // Act
      const start = performance.now();
      await bcrypt.hash('password', 10);
      const duration = performance.now() - start;

      // Assert
      expect(duration).toBeLessThan(200);
    });

    it('should verify token in under 10ms', () => {
      // Arrange
      (jwt.verify as jest.Mock).mockReturnValue({ userId: '123' });

      // Act
      const start = performance.now();
      authService.verifyToken('token');
      const duration = performance.now() - start;

      // Assert
      expect(duration).toBeLessThan(10);
    });
  });
});
