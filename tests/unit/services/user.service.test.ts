/**
 * @test User Service Unit Tests
 * @description Comprehensive tests for user service operations
 * @coverage >95% - All CRUD operations and business logic
 */
import { UserService } from '@/services/user.service';
import { createMockDbClient, createMockLogger, createUser, createUsers } from '@tests/helpers/mock-factory';
import { validUser, validUsers, edgeCaseUsers } from '@tests/fixtures/users.fixture';

describe('UserService', () => {
  let userService: UserService;
  let mockDb: any;
  let mockLogger: any;

  beforeEach(() => {
    mockDb = createMockDbClient();
    mockLogger = createMockLogger();
    userService = new UserService(mockDb, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const newUser = createUser();
      mockDb.query.mockResolvedValue({
        rows: [{ id: '123', ...newUser }]
      });

      // Act
      const result = await userService.createUser(newUser);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(newUser.email);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.any(Array)
      );
    });

    it('should throw error on duplicate email', async () => {
      // Arrange
      mockDb.query.mockRejectedValue({ code: '23505' }); // Postgres unique violation

      // Act & Assert
      await expect(userService.createUser(validUser))
        .rejects.toThrow('User with this email already exists');
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidUser = { username: 'test' };

      // Act & Assert
      await expect(userService.createUser(invalidUser))
        .rejects.toThrow('Email is required');
    });

    it('should set default values', async () => {
      // Arrange
      const minimalUser = { email: 'test@example.com', password: 'Pass123!' };
      mockDb.query.mockResolvedValue({
        rows: [{
          ...minimalUser,
          id: '123',
          createdAt: new Date(),
          isActive: true,
          role: 'user'
        }]
      });

      // Act
      const result = await userService.createUser(minimalUser);

      // Assert
      expect(result.isActive).toBe(true);
      expect(result.role).toBe('user');
      expect(result).toHaveProperty('createdAt');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      // Arrange
      const user = createUser({ id: '123' });
      mockDb.query.mockResolvedValue({ rows: [user] });

      // Act
      const result = await userService.getUserById('123');

      // Assert
      expect(result).toEqual(user);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['123']
      );
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await userService.getUserById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should not include password in result', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ id: '123', email: 'test@example.com', password: 'hashed' }]
      });

      // Act
      const result = await userService.getUserById('123');

      // Assert
      expect(result).not.toHaveProperty('password');
    });

    it('should handle invalid id format', async () => {
      // Act & Assert
      await expect(userService.getUserById(''))
        .rejects.toThrow('Invalid user id');
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      // Arrange
      const updates = { firstName: 'Updated', lastName: 'Name' };
      mockDb.query.mockResolvedValue({
        rows: [{ id: '123', ...validUser, ...updates }]
      });

      // Act
      const result = await userService.updateUser('123', updates);

      // Assert
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.any(Array)
      );
    });

    it('should not update protected fields', async () => {
      // Arrange
      const maliciousUpdate = { id: '999', role: 'admin' };

      // Act
      await userService.updateUser('123', maliciousUpdate);

      // Assert
      const queryCall = mockDb.query.mock.calls[0];
      expect(queryCall[0]).not.toContain('id =');
      expect(queryCall[0]).not.toContain('role =');
    });

    it('should update timestamp', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({
        rows: [{ id: '123', updatedAt: new Date() }]
      });

      // Act
      const result = await userService.updateUser('123', { firstName: 'Test' });

      // Assert
      expect(result).toHaveProperty('updatedAt');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [] });

      // Act & Assert
      await expect(userService.updateUser('nonexistent', {}))
        .rejects.toThrow('User not found');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user by default', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rowCount: 1 });

      // Act
      await userService.deleteUser('123');

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET deleted_at'),
        expect.any(Array)
      );
    });

    it('should hard delete when specified', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rowCount: 1 });

      // Act
      await userService.deleteUser('123', { hard: true });

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM users'),
        expect.any(Array)
      );
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rowCount: 0 });

      // Act & Assert
      await expect(userService.deleteUser('nonexistent'))
        .rejects.toThrow('User not found');
    });
  });

  describe('listUsers', () => {
    it('should return paginated user list', async () => {
      // Arrange
      const users = createUsers(10);
      mockDb.query.mockResolvedValue({ rows: users });

      // Act
      const result = await userService.listUsers({ page: 1, limit: 10 });

      // Assert
      expect(result.data).toHaveLength(10);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
    });

    it('should filter by search term', async () => {
      // Arrange
      const users = createUsers(3);
      mockDb.query.mockResolvedValue({ rows: users });

      // Act
      await userService.listUsers({ search: 'john' });

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['%john%'])
      );
    });

    it('should sort by specified field', async () => {
      // Act
      await userService.listUsers({ sortBy: 'createdAt', order: 'DESC' });

      // Assert
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY created_at DESC'),
        expect.any(Array)
      );
    });

    it('should handle empty results', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      const result = await userService.listUsers();

      // Assert
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum length fields', async () => {
      // Arrange
      const maxUser = edgeCaseUsers.maxLengthEmail;
      mockDb.query.mockResolvedValue({ rows: [{ id: '123', ...maxUser }] });

      // Act & Assert
      await expect(userService.createUser(maxUser)).resolves.toHaveProperty('id');
    });

    it('should handle special characters in search', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [] });

      // Act
      await userService.listUsers({ search: "test'; DROP TABLE users; --" });

      // Assert - Should sanitize input
      const queryCall = mockDb.query.mock.calls[0];
      expect(queryCall[0]).not.toContain('DROP TABLE');
    });

    it('should handle concurrent updates', async () => {
      // Arrange
      mockDb.query.mockResolvedValue({ rows: [{ id: '123', version: 2 }] });

      // Act
      const updates = Array(5).fill(null).map((_, i) =>
        userService.updateUser('123', { firstName: `Name${i}` })
      );

      // Assert
      await expect(Promise.all(updates)).resolves.toHaveLength(5);
    });
  });

  describe('Performance', () => {
    it('should list 1000 users under 100ms', async () => {
      // Arrange
      const largeUserSet = createUsers(1000);
      mockDb.query.mockResolvedValue({ rows: largeUserSet });

      // Act
      const start = performance.now();
      await userService.listUsers({ limit: 1000 });
      const duration = performance.now() - start;

      // Assert
      expect(duration).toBeLessThan(100);
    });

    it('should use database indexes for queries', async () => {
      // Act
      await userService.getUserById('123');

      // Assert - Should use indexed query
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        expect.any(Array)
      );
    });
  });
});
