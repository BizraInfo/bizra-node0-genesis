/**
 * Validation Test Fixtures
 * Test data for validation rules and scenarios
 */

export const validationRules = {
  email: {
    type: 'email',
    required: true,
    maxLength: 255,
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  },
  password: {
    type: 'string',
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
  },
  username: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: '^[a-zA-Z0-9_-]+$',
  },
  phoneNumber: {
    type: 'string',
    required: false,
    pattern: '^\\+?[1-9]\\d{1,14}$', // E.164 format
  },
  url: {
    type: 'url',
    required: false,
    pattern: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$',
  },
};

export const validInputs = {
  email: [
    'test@example.com',
    'user.name@example.co.uk',
    'first+last@domain.com',
    'test_123@sub.domain.org',
  ],
  password: [
    'SecurePass123!',
    'MyP@ssw0rd',
    'Str0ng!Pass',
    'C0mpl3x&Secure',
  ],
  username: [
    'testuser',
    'user_123',
    'test-user',
    'User123',
  ],
  phoneNumber: [
    '+14155552671',
    '+442071838750',
    '+81312345678',
    '14155552671',
  ],
  url: [
    'https://example.com',
    'http://www.example.com',
    'https://sub.domain.example.com/path',
    'https://example.com/path?query=value',
  ],
};

export const invalidInputs = {
  email: [
    'notanemail',
    '@example.com',
    'user@',
    'user name@example.com',
    'user@domain',
  ],
  password: [
    '123', // Too short
    'password', // No uppercase, number, or special char
    'PASSWORD123', // No lowercase or special char
    'Password', // No number or special char
    'Pass123', // No special char
  ],
  username: [
    'ab', // Too short
    'a'.repeat(51), // Too long
    'user@name', // Invalid characters
    'user name', // Spaces not allowed
    '!invalid!', // Special characters
  ],
  phoneNumber: [
    '123', // Too short
    'not-a-number',
    '+1234567890123456', // Too long
    '++1234567890',
  ],
  url: [
    'not a url',
    'ftp://example.com', // Wrong protocol
    'example.com', // Missing protocol
    'http:/example.com', // Malformed
  ],
};

export const edgeCases = {
  boundaries: {
    minLength: 'abc', // Exactly 3 chars for username
    maxLength: 'a'.repeat(50), // Exactly 50 chars for username
    justUnderMin: 'ab', // 2 chars
    justOverMax: 'a'.repeat(51), // 51 chars
  },
  specialCharacters: {
    emoji: '😀test😀',
    unicode: 'тестuser测试',
    sqlInjection: "'; DROP TABLE users; --",
    xss: '<script>alert("XSS")</script>',
    pathTraversal: '../../etc/passwd',
  },
  whitespace: {
    leading: '  test@example.com',
    trailing: 'test@example.com  ',
    internal: 'test  user@example.com',
    tabs: 'test\t@example.com',
    newlines: 'test\n@example.com',
  },
  casing: {
    lowercase: 'test@example.com',
    uppercase: 'TEST@EXAMPLE.COM',
    mixed: 'TeSt@ExAmPlE.CoM',
  },
};

export const validationErrors = {
  required: {
    field: 'email',
    message: 'Email is required',
    code: 'REQUIRED',
  },
  invalid: {
    field: 'email',
    message: 'Email format is invalid',
    code: 'INVALID_FORMAT',
  },
  tooShort: {
    field: 'password',
    message: 'Password must be at least 8 characters',
    code: 'MIN_LENGTH',
  },
  tooLong: {
    field: 'username',
    message: 'Username must not exceed 50 characters',
    code: 'MAX_LENGTH',
  },
  pattern: {
    field: 'username',
    message: 'Username can only contain letters, numbers, hyphens, and underscores',
    code: 'PATTERN_MISMATCH',
  },
};

export const complexValidationScenarios = [
  {
    description: 'User registration with all valid fields',
    input: {
      email: 'new.user@example.com',
      username: 'newuser123',
      password: 'SecurePass123!',
      firstName: 'New',
      lastName: 'User',
    },
    expected: { valid: true, errors: [] },
  },
  {
    description: 'Missing required email',
    input: {
      username: 'newuser123',
      password: 'SecurePass123!',
    },
    expected: {
      valid: false,
      errors: [{ field: 'email', code: 'REQUIRED' }],
    },
  },
  {
    description: 'Multiple validation errors',
    input: {
      email: 'invalid-email',
      username: 'ab',
      password: '123',
    },
    expected: {
      valid: false,
      errors: [
        { field: 'email', code: 'INVALID_FORMAT' },
        { field: 'username', code: 'MIN_LENGTH' },
        { field: 'password', code: 'MIN_LENGTH' },
      ],
    },
  },
];
