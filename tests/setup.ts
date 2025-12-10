/**
 * Global Test Setup
 * Configures test environment, mocks, and utilities
 */
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Extend Jest matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidationError(received: any, field: string) {
    const hasError = received.errors &&
                     Array.isArray(received.errors) &&
                     received.errors.some((e: any) => e.field === field);
    return {
      message: () => hasError
        ? `expected not to have validation error for ${field}`
        : `expected to have validation error for ${field}`,
      pass: hasError,
    };
  },
});

// Global test timeouts
jest.setTimeout(10000);

// Mock console for cleaner test output
const originalConsole = { ...console };

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Restore console for specific tests
export const restoreConsole = () => {
  global.console = originalConsole;
};

// Test lifecycle hooks
beforeAll(() => {
  // Global setup
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';

  // Use fake timers for setInterval tests (با احسان - explicit lifecycle control)
  jest.useFakeTimers({ legacyFakeTimers: false });
});

afterAll(async () => {
  // Import cleanup functions
  const { performanceMetrics } = await import('../src/monitoring/performance-metrics.service');
  const { stopAuthCleanup } = await import('../src/security/auth.strategy');

  // Stop all setInterval instances
  try {
    performanceMetrics.destroy();
  } catch (err) {
    // Ignore if already destroyed
  }

  try {
    stopAuthCleanup();
  } catch (err) {
    // Ignore if not started
  }

  // Global cleanup
  jest.clearAllMocks();
  jest.restoreAllMocks();

  // Use real timers for cleanup
  jest.useRealTimers();

  // Small delay to allow async cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});

beforeEach(() => {
  // Reset mocks between tests
  jest.clearAllMocks();

  // Clear all timers to prevent test interference
  jest.clearAllTimers();
});

afterEach(() => {
  // Clear all timers created during test
  jest.clearAllTimers();

  // Cleanup after each test
  jest.resetModules();
});

// Custom matchers type declaration
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidationError(field: string): R;
    }
  }
}

// Export test utilities
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  while (!(await condition())) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Condition timeout');
    }
    await sleep(interval);
  }
};
