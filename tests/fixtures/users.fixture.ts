/**
 * User Test Fixtures
 * Predefined test data for user-related tests
 */

export const validUser = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
};

export const validUsers = [
  {
    email: 'alice@example.com',
    username: 'alice',
    password: 'AlicePass123!',
    firstName: 'Alice',
    lastName: 'Anderson',
  },
  {
    email: 'bob@example.com',
    username: 'bob',
    password: 'BobPass123!',
    firstName: 'Bob',
    lastName: 'Brown',
  },
  {
    email: 'charlie@example.com',
    username: 'charlie',
    password: 'CharliePass123!',
    firstName: 'Charlie',
    lastName: 'Chen',
  },
];

export const invalidUsers = {
  missingEmail: {
    username: 'testuser',
    password: 'SecurePass123!',
  },
  invalidEmail: {
    email: 'not-an-email',
    username: 'testuser',
    password: 'SecurePass123!',
  },
  shortPassword: {
    email: 'test@example.com',
    username: 'testuser',
    password: '123',
  },
  weakPassword: {
    email: 'test@example.com',
    username: 'testuser',
    password: 'password',
  },
  invalidUsername: {
    email: 'test@example.com',
    username: 'a',
    password: 'SecurePass123!',
  },
  specialCharsUsername: {
    email: 'test@example.com',
    username: 'test@user!',
    password: 'SecurePass123!',
  },
};

export const userCredentials = {
  valid: {
    email: 'test@example.com',
    password: 'SecurePass123!',
  },
  invalidPassword: {
    email: 'test@example.com',
    password: 'WrongPassword123!',
  },
  nonExistentUser: {
    email: 'nonexistent@example.com',
    password: 'SecurePass123!',
  },
};

export const userProfiles = {
  complete: {
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Software developer and tech enthusiast',
    location: 'San Francisco, CA',
    website: 'https://johndoe.com',
    avatar: 'https://example.com/avatar.jpg',
  },
  minimal: {
    firstName: 'Jane',
    lastName: 'Smith',
  },
};

export const adminUser = {
  email: 'admin@example.com',
  username: 'admin',
  password: 'AdminPass123!',
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'manage_users'],
};

export const edgeCaseUsers = {
  maxLengthEmail: {
    email: 'a'.repeat(64) + '@' + 'b'.repeat(189) + '.com', // Max 255 chars
    username: 'maxemailuser',
    password: 'SecurePass123!',
  },
  maxLengthUsername: {
    email: 'maxuser@example.com',
    username: 'a'.repeat(50), // Max 50 chars
    password: 'SecurePass123!',
  },
  specialCharsEmail: {
    email: 'test+tag@example.co.uk',
    username: 'specialuser',
    password: 'SecurePass123!',
  },
  unicodeUsername: {
    email: 'unicode@example.com',
    username: 'user_测试_тест',
    password: 'SecurePass123!',
  },
};
