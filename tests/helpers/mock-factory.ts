/**
 * Mock Factory
 * Creates mock objects and test data
 */
import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationRule {
  id: string;
  field: string;
  type: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export class MockFactory {
  /**
   * Create mock user
   */
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.username(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create multiple mock users
   */
  static createUsers(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  /**
   * Create mock validation rule
   */
  static createValidationRule(overrides: Partial<ValidationRule> = {}): ValidationRule {
    return {
      id: faker.string.uuid(),
      field: faker.lorem.word(),
      type: faker.helpers.arrayElement(['string', 'number', 'email', 'url']),
      required: faker.datatype.boolean(),
      minLength: faker.number.int({ min: 1, max: 10 }),
      maxLength: faker.number.int({ min: 50, max: 255 }),
      pattern: faker.helpers.arrayElement(['^[a-zA-Z]+$', '^\\d+$', undefined]),
      ...overrides,
    };
  }

  /**
   * Create mock JWT token
   */
  static createJwtToken(payload: Record<string, any> = {}): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const body = Buffer.from(JSON.stringify({
      sub: faker.string.uuid(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload,
    })).toString('base64');
    const signature = faker.string.alphanumeric(43);

    return `${header}.${body}.${signature}`;
  }

  /**
   * Create mock request object
   */
  static createMockRequest(overrides: any = {}): any {
    return {
      body: {},
      params: {},
      query: {},
      headers: {},
      method: 'GET',
      url: '/',
      ...overrides,
    };
  }

  /**
   * Create mock response object
   */
  static createMockResponse(): any {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    return res;
  }

  /**
   * Create mock next function
   */
  static createMockNext(): jest.Mock {
    return jest.fn();
  }

  /**
   * Create mock database client
   */
  static createMockDbClient(): any {
    return {
      query: jest.fn(),
      connect: jest.fn(),
      release: jest.fn(),
      end: jest.fn(),
    };
  }

  /**
   * Create mock logger
   */
  static createMockLogger(): any {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
  }

  /**
   * Create mock email service
   */
  static createMockEmailService(): any {
    return {
      send: jest.fn().mockResolvedValue(true),
      sendVerification: jest.fn().mockResolvedValue(true),
      sendPasswordReset: jest.fn().mockResolvedValue(true),
    };
  }

  /**
   * Reset all mocks
   */
  static resetAll(): void {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  }
}

// Export convenience functions
export const createUser = MockFactory.createUser.bind(MockFactory);
export const createUsers = MockFactory.createUsers.bind(MockFactory);
export const createValidationRule = MockFactory.createValidationRule.bind(MockFactory);
export const createJwtToken = MockFactory.createJwtToken.bind(MockFactory);
export const createMockRequest = MockFactory.createMockRequest.bind(MockFactory);
export const createMockResponse = MockFactory.createMockResponse.bind(MockFactory);
export const createMockNext = MockFactory.createMockNext.bind(MockFactory);
export const createMockDbClient = MockFactory.createMockDbClient.bind(MockFactory);
export const createMockLogger = MockFactory.createMockLogger.bind(MockFactory);
export const createMockEmailService = MockFactory.createMockEmailService.bind(MockFactory);
