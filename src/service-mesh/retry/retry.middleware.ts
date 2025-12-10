/**
 * Retry Middleware with Exponential Backoff
 * Implements intelligent retry logic with jitter and backoff strategies
 */

import { EventEmitter } from "events";

export type BackoffStrategy =
  | "exponential"
  | "linear"
  | "constant"
  | "fibonacci";

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay?: number; // milliseconds
  backoffStrategy?: BackoffStrategy;
  backoffMultiplier?: number;
  jitter?: boolean;
  jitterFactor?: number; // 0-1, adds randomness to delay

  // Retry conditions
  retryableErrors?: string[]; // Error messages/codes that trigger retry
  retryableStatusCodes?: number[]; // HTTP status codes that trigger retry
  shouldRetry?: (error: any, attempt: number) => boolean;

  // Circuit breaker integration
  circuitBreakerEnabled?: boolean;

  // Callbacks
  onRetry?: (attempt: number, delay: number, error: any) => void;
  onMaxRetriesReached?: (error: any) => void;
}

export interface RetryMetrics {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  totalDelay: number;
  avgRetryCount: number;
  maxRetriesReached: number;
}

export class RetryMiddleware extends EventEmitter {
  private config: RetryConfig;
  private metrics: RetryMetrics = {
    totalAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    totalDelay: 0,
    avgRetryCount: 0,
    maxRetriesReached: 0,
  };
  private fibonacciCache: number[] = [1, 1];

  constructor(config: RetryConfig) {
    super();
    this.config = {
      backoffStrategy: "exponential",
      backoffMultiplier: 2,
      maxDelay: 30000, // 30 seconds
      jitter: true,
      jitterFactor: 0.1,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      circuitBreakerEnabled: false,
      ...config,
    };
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(fn: () => Promise<T>, context?: string): Promise<T> {
    let lastError: any;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        this.metrics.totalAttempts++;
        const result = await fn();

        // If we had retries and succeeded, count it
        if (attempt > 0) {
          this.metrics.successfulRetries++;
          this.updateAvgRetryCount();

          this.emit("retry-success", {
            context,
            attempt,
            totalDelay: this.calculateTotalDelay(attempt),
          });
        }

        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        // Check if we should retry
        if (!this.shouldRetry(error, attempt)) {
          this.metrics.failedRetries++;
          throw error;
        }

        // Max retries reached
        if (attempt > this.config.maxRetries) {
          this.metrics.maxRetriesReached++;

          if (this.config.onMaxRetriesReached) {
            this.config.onMaxRetriesReached(error);
          }

          this.emit("max-retries-reached", {
            context,
            attempt: attempt - 1,
            error,
          });

          throw new Error(
            `Max retries (${this.config.maxRetries}) reached. Last error: ${error.message}`,
          );
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt);
        this.metrics.totalDelay += delay;

        // Emit retry event
        this.emit("retry-attempt", {
          context,
          attempt,
          delay,
          error,
          nextRetryIn: delay,
        });

        // Call retry callback
        if (this.config.onRetry) {
          this.config.onRetry(attempt, delay, error);
        }

        // Wait before retry
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Determine if should retry based on error
   */
  private shouldRetry(error: any, attempt: number): boolean {
    // Custom retry logic
    if (this.config.shouldRetry) {
      return this.config.shouldRetry(error, attempt);
    }

    // Check retryable status codes
    if (error.response?.status && this.config.retryableStatusCodes) {
      if (this.config.retryableStatusCodes.includes(error.response.status)) {
        return true;
      }
    }

    // Check retryable error messages
    if (this.config.retryableErrors) {
      const errorMessage = error.message || error.toString();
      return this.config.retryableErrors.some((msg) =>
        errorMessage.includes(msg),
      );
    }

    // Default: retry on network errors and 5xx errors
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ETIMEDOUT" ||
      error.code === "ENOTFOUND" ||
      error.message?.includes("timeout")
    ) {
      return true;
    }

    if (error.response?.status >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Calculate retry delay based on strategy
   */
  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.backoffStrategy) {
      case "exponential":
        delay = this.exponentialBackoff(attempt);
        break;
      case "linear":
        delay = this.linearBackoff(attempt);
        break;
      case "constant":
        delay = this.config.initialDelay;
        break;
      case "fibonacci":
        delay = this.fibonacciBackoff(attempt);
        break;
      default:
        delay = this.exponentialBackoff(attempt);
    }

    // Apply max delay cap
    if (this.config.maxDelay) {
      delay = Math.min(delay, this.config.maxDelay);
    }

    // Apply jitter
    if (this.config.jitter) {
      delay = this.applyJitter(delay);
    }

    return delay;
  }

  /**
   * Exponential backoff: delay = initialDelay * (multiplier ^ attempt)
   */
  private exponentialBackoff(attempt: number): number {
    const multiplier = this.config.backoffMultiplier || 2;
    return this.config.initialDelay * Math.pow(multiplier, attempt - 1);
  }

  /**
   * Linear backoff: delay = initialDelay * attempt
   */
  private linearBackoff(attempt: number): number {
    return this.config.initialDelay * attempt;
  }

  /**
   * Fibonacci backoff: delay = initialDelay * fibonacci(attempt)
   */
  private fibonacciBackoff(attempt: number): number {
    // Ensure fibonacci number is calculated
    while (this.fibonacciCache.length < attempt) {
      const len = this.fibonacciCache.length;
      this.fibonacciCache.push(
        this.fibonacciCache[len - 1] + this.fibonacciCache[len - 2],
      );
    }

    return this.config.initialDelay * this.fibonacciCache[attempt - 1];
  }

  /**
   * Apply jitter to delay (adds randomness)
   */
  private applyJitter(delay: number): number {
    const jitterFactor = this.config.jitterFactor || 0.1;
    const jitter = delay * jitterFactor * (Math.random() * 2 - 1); // Random between -jitterFactor and +jitterFactor
    return Math.max(0, delay + jitter);
  }

  /**
   * Calculate total delay for given number of attempts
   */
  private calculateTotalDelay(attempts: number): number {
    let total = 0;
    for (let i = 1; i <= attempts; i++) {
      total += this.calculateDelay(i);
    }
    return total;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update average retry count
   */
  private updateAvgRetryCount(): void {
    const totalSuccessful = this.metrics.successfulRetries;
    if (totalSuccessful === 0) {
      this.metrics.avgRetryCount = 0;
      return;
    }

    // This is a simplified calculation
    // In production, you'd want to track actual retry counts per operation
    this.metrics.avgRetryCount =
      this.metrics.totalAttempts /
      (this.metrics.successfulRetries + this.metrics.failedRetries);
  }

  /**
   * Get metrics
   */
  getMetrics(): RetryMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      totalDelay: 0,
      avgRetryCount: 0,
      maxRetriesReached: 0,
    };
  }

  /**
   * Create a retry wrapper for a function
   */
  wrap<T extends (...args: any[]) => Promise<any>>(fn: T, context?: string): T {
    return (async (...args: any[]) => {
      return this.execute(() => fn(...args), context);
    }) as T;
  }
}

/**
 * Retry decorator for methods
 */
export function Retry(config: RetryConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const retry = new RetryMiddleware(config);

    descriptor.value = async function (...args: any[]) {
      return retry.execute(
        () => originalMethod.apply(this, args),
        `${target.constructor.name}.${propertyKey}`,
      );
    };

    return descriptor;
  };
}

/**
 * Create retry middleware with common configurations
 */
export class RetryPresets {
  static networkRequest(): RetryMiddleware {
    return new RetryMiddleware({
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffStrategy: "exponential",
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    });
  }

  static databaseOperation(): RetryMiddleware {
    return new RetryMiddleware({
      maxRetries: 5,
      initialDelay: 100,
      maxDelay: 5000,
      backoffStrategy: "exponential",
      retryableErrors: ["ECONNREFUSED", "ETIMEDOUT", "connection", "deadlock"],
    });
  }

  static criticalOperation(): RetryMiddleware {
    return new RetryMiddleware({
      maxRetries: 10,
      initialDelay: 500,
      maxDelay: 30000,
      backoffStrategy: "fibonacci",
      jitter: true,
      jitterFactor: 0.2,
    });
  }

  static quickRetry(): RetryMiddleware {
    return new RetryMiddleware({
      maxRetries: 2,
      initialDelay: 100,
      maxDelay: 500,
      backoffStrategy: "constant",
      jitter: false,
    });
  }
}

export default RetryMiddleware;
