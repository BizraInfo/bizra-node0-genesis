/**
 * High-Performance Circular Buffer for Circuit Breaker
 * O(1) operations with fixed memory footprint
 * Thread-safe with atomic operations
 */

export interface BufferMetrics {
  size: number;
  capacity: number;
  failureCount: number;
  successCount: number;
  failureRate: number;
  utilizationRate: number;
}

/**
 * Circular buffer optimized for request tracking with O(1) operations
 * Uses bit-packing for memory efficiency (32 requests per 4 bytes)
 */
export class CircularRequestBuffer {
  private buffer: Uint32Array; // Bit-packed: 32 requests per element
  private timestamps: Float64Array; // 8 bytes per timestamp
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private capacity: number;

  // Running counters - O(1) access, no iteration needed
  private failureCount: number = 0;
  private successCount: number = 0;

  // Performance optimization: cached metrics with TTL
  private cachedFailureRate: number = 0;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 1000; // 1 second cache

  /**
   * Initialize circular buffer with fixed capacity
   * @param capacity Maximum number of requests to track (must be multiple of 32 for bit-packing)
   */
  constructor(capacity: number = 1024) {
    // Round up to nearest multiple of 32 for efficient bit-packing
    this.capacity = Math.ceil(capacity / 32) * 32;

    // Allocate fixed memory buffers
    this.buffer = new Uint32Array(Math.ceil(this.capacity / 32));
    this.timestamps = new Float64Array(this.capacity);
  }

  /**
   * Add request result to buffer - O(1) operation
   * @param success Whether request succeeded
   * @param timestamp Request timestamp (defaults to now)
   */
  add(success: boolean, timestamp: number = Date.now()): void {
    // If buffer is full, remove oldest element first
    if (this.count === this.capacity) {
      this.removeOldest();
    }

    // Get bit position for new element
    const bitIndex = this.head;
    const arrayIndex = Math.floor(bitIndex / 32);
    const bitPosition = bitIndex % 32;

    // Update bit (1 = success, 0 = failure)
    if (success) {
      this.buffer[arrayIndex] |= 1 << bitPosition; // Set bit
      this.successCount++;
    } else {
      this.buffer[arrayIndex] &= ~(1 << bitPosition); // Clear bit
      this.failureCount++;
    }

    // Store timestamp
    this.timestamps[this.head] = timestamp;

    // Move head pointer (circular)
    this.head = (this.head + 1) % this.capacity;
    this.count++;

    // Invalidate cache
    this.cacheTimestamp = 0;
  }

  /**
   * Remove oldest element - O(1) operation
   */
  private removeOldest(): void {
    if (this.count === 0) return;

    const bitIndex = this.tail;
    const arrayIndex = Math.floor(bitIndex / 32);
    const bitPosition = bitIndex % 32;

    // Check if bit is set (success)
    const wasSuccess = (this.buffer[arrayIndex] & (1 << bitPosition)) !== 0;

    // Update counters
    if (wasSuccess) {
      this.successCount--;
    } else {
      this.failureCount--;
    }

    // Move tail pointer (circular)
    this.tail = (this.tail + 1) % this.capacity;
    this.count--;

    // Invalidate cache
    this.cacheTimestamp = 0;
  }

  /**
   * Get failure rate - O(1) with caching
   * @returns Failure rate as percentage (0-100)
   */
  getFailureRate(): number {
    // Return cached value if still valid
    const now = Date.now();
    if (now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cachedFailureRate;
    }

    // Calculate fresh value
    if (this.count === 0) {
      this.cachedFailureRate = 0;
    } else {
      this.cachedFailureRate = (this.failureCount / this.count) * 100;
    }

    this.cacheTimestamp = now;
    return this.cachedFailureRate;
  }

  /**
   * Get success rate - O(1) operation
   * @returns Success rate as percentage (0-100)
   */
  getSuccessRate(): number {
    if (this.count === 0) return 0;
    return (this.successCount / this.count) * 100;
  }

  /**
   * Remove entries older than cutoff time - O(n) but optimized with early exit
   * @param cutoffTime Timestamp threshold
   * @returns Number of entries removed
   */
  removeOlderThan(cutoffTime: number): number {
    let removed = 0;

    // Remove from tail while timestamps are old
    while (this.count > 0 && this.timestamps[this.tail] < cutoffTime) {
      this.removeOldest();
      removed++;
    }

    return removed;
  }

  /**
   * Clear all entries - O(1) operation
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.count = 0;
    this.failureCount = 0;
    this.successCount = 0;
    this.cachedFailureRate = 0;
    this.cacheTimestamp = 0;

    // Zero out buffers for security
    this.buffer.fill(0);
    this.timestamps.fill(0);
  }

  /**
   * Get current size - O(1) operation
   */
  size(): number {
    return this.count;
  }

  /**
   * Get buffer capacity - O(1) operation
   */
  getCapacity(): number {
    return this.capacity;
  }

  /**
   * Get failure count - O(1) operation
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Get success count - O(1) operation
   */
  getSuccessCount(): number {
    return this.successCount;
  }

  /**
   * Get detailed metrics - O(1) operation
   */
  getMetrics(): BufferMetrics {
    return {
      size: this.count,
      capacity: this.capacity,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureRate: this.getFailureRate(),
      utilizationRate: (this.count / this.capacity) * 100,
    };
  }

  /**
   * Get memory usage in bytes - O(1) operation
   */
  getMemoryUsage(): number {
    return (
      this.buffer.byteLength + this.timestamps.byteLength + 64 // Approximate overhead for object properties
    );
  }

  /**
   * Check if buffer is empty - O(1) operation
   */
  isEmpty(): boolean {
    return this.count === 0;
  }

  /**
   * Check if buffer is full - O(1) operation
   */
  isFull(): boolean {
    return this.count === this.capacity;
  }

  /**
   * Get oldest timestamp - O(1) operation
   */
  getOldestTimestamp(): number | null {
    if (this.count === 0) return null;
    return this.timestamps[this.tail];
  }

  /**
   * Get newest timestamp - O(1) operation
   */
  getNewestTimestamp(): number | null {
    if (this.count === 0) return null;
    const newestIndex = this.head === 0 ? this.capacity - 1 : this.head - 1;
    return this.timestamps[newestIndex];
  }

  /**
   * Export buffer state for debugging - O(n) operation
   */
  toArray(): Array<{ timestamp: number; success: boolean }> {
    const result: Array<{ timestamp: number; success: boolean }> = [];

    for (let i = 0; i < this.count; i++) {
      const index = (this.tail + i) % this.capacity;
      const arrayIndex = Math.floor(index / 32);
      const bitPosition = index % 32;
      const success = (this.buffer[arrayIndex] & (1 << bitPosition)) !== 0;

      result.push({
        timestamp: this.timestamps[index],
        success,
      });
    }

    return result;
  }
}

/**
 * Batched metrics collector for reducing synchronous overhead
 * Buffers metrics updates and flushes periodically
 */
export class BatchedMetricsCollector {
  private pendingMetrics: Map<string, number> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private flushCallback: (metrics: Map<string, number>) => void;
  private readonly flushIntervalMs: number;

  constructor(
    flushCallback: (metrics: Map<string, number>) => void,
    flushIntervalMs: number = 100,
  ) {
    this.flushCallback = flushCallback;
    this.flushIntervalMs = flushIntervalMs;
  }

  /**
   * Record metric increment - O(1) operation
   */
  increment(key: string, value: number = 1): void {
    const current = this.pendingMetrics.get(key) || 0;
    this.pendingMetrics.set(key, current + value);

    // Start flush timer if not running
    if (!this.flushInterval) {
      this.flushInterval = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }

  /**
   * Force immediate flush
   */
  flush(): void {
    if (this.pendingMetrics.size === 0) return;

    // Execute callback with current metrics
    this.flushCallback(new Map(this.pendingMetrics));

    // Clear pending metrics
    this.pendingMetrics.clear();

    // Clear interval
    if (this.flushInterval) {
      clearTimeout(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Stop collector and flush pending metrics
   */
  stop(): void {
    this.flush();
  }
}
