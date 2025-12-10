/**
 * Jest Global Test Lifecycle Management (با احسان)
 *
 * Prevents timeout errors by managing setInterval cleanup
 * Implements احسان principle: explicit lifecycle control
 *
 * This file is automatically loaded by Jest (configured in jest.config.js)
 */

import { performanceMetrics } from '../../src/monitoring/performance-metrics.service';
import { stopAuthCleanup } from '../../src/security/auth.strategy';

/**
 * Global setup before all tests
 */
beforeAll(() => {
  // Use fake timers for setInterval tests
  jest.useFakeTimers({ legacyFakeTimers: false });
});

/**
 * Setup before each test
 */
beforeEach(() => {
  // Clear all timers to prevent test interference
  jest.clearAllTimers();

  // Reset modules to ensure clean state
  // Note: This is heavy, only enable if tests are still failing
  // jest.resetModules();
});

/**
 * Cleanup after each test
 */
afterEach(() => {
  // Clear all timers created during test
  jest.clearAllTimers();

  // Clear all mocks
  jest.clearAllMocks();
});

/**
 * Global cleanup after all tests
 */
afterAll(async () => {
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

  // Use real timers for cleanup
  jest.useRealTimers();

  // Small delay to allow async cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit process in tests - let Jest handle it
});

/**
 * Export cleanup utilities for tests that need explicit control
 */
export const testLifecycle = {
  /**
   * Manually cleanup all intervals (for tests that create their own)
   */
  cleanupAllIntervals: () => {
    jest.clearAllTimers();
    performanceMetrics.destroy();
    stopAuthCleanup();
  },

  /**
   * Fast-forward all timers by specified time
   */
  advanceTimers: (ms: number) => {
    jest.advanceTimersByTime(ms);
  },

  /**
   * Run all pending timers immediately
   */
  runAllTimers: () => {
    jest.runAllTimers();
  },
};
