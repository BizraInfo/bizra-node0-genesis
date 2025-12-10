/**
 * Memory Monitor Utility
 * Detects memory leaks and tracks memory usage patterns
 */

export interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  timestamp: number;
}

export interface MemoryLeakReport {
  detected: boolean;
  growthRate: number; // bytes per snapshot
  totalGrowth: number;
  snapshots: MemorySnapshot[];
  threshold: number;
}

export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private interval: NodeJS.Timeout | null = null;
  private baselineSnapshot: MemorySnapshot | null = null;

  /**
   * Take a memory snapshot
   */
  snapshot(): MemorySnapshot {
    const mem = process.memoryUsage();
    const snapshot: MemorySnapshot = {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers || 0,
      rss: mem.rss,
      timestamp: Date.now(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs: number = 100): void {
    this.stopMonitoring();
    this.baselineSnapshot = this.snapshot();
    this.interval = setInterval(() => {
      this.snapshot();
    }, intervalMs);
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Detect memory leaks
   */
  detectLeak(thresholdBytes: number = 10 * 1024 * 1024): MemoryLeakReport {
    if (this.snapshots.length < 2) {
      return {
        detected: false,
        growthRate: 0,
        totalGrowth: 0,
        snapshots: this.snapshots,
        threshold: thresholdBytes,
      };
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const totalGrowth = last.heapUsed - first.heapUsed;
    const growthRate = totalGrowth / this.snapshots.length;

    return {
      detected: totalGrowth > thresholdBytes,
      growthRate,
      totalGrowth,
      snapshots: this.snapshots,
      threshold: thresholdBytes,
    };
  }

  /**
   * Get memory growth rate
   */
  getGrowthRate(): number {
    if (this.snapshots.length < 2) return 0;

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const timeDiff = last.timestamp - first.timestamp;
    const memDiff = last.heapUsed - first.heapUsed;

    return timeDiff > 0 ? (memDiff / timeDiff) * 1000 : 0; // bytes per second
  }

  /**
   * Get peak memory usage
   */
  getPeakUsage(): MemorySnapshot | null {
    if (this.snapshots.length === 0) return null;
    return this.snapshots.reduce((peak, current) =>
      current.heapUsed > peak.heapUsed ? current : peak,
    );
  }

  /**
   * Get average memory usage
   */
  getAverageUsage(): number {
    if (this.snapshots.length === 0) return 0;
    const total = this.snapshots.reduce((sum, snap) => sum + snap.heapUsed, 0);
    return total / this.snapshots.length;
  }

  /**
   * Force garbage collection if available
   */
  forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get memory delta from baseline
   */
  getDelta(): MemorySnapshot | null {
    if (!this.baselineSnapshot || this.snapshots.length === 0) return null;

    const current = this.snapshots[this.snapshots.length - 1];
    return {
      heapUsed: current.heapUsed - this.baselineSnapshot.heapUsed,
      heapTotal: current.heapTotal - this.baselineSnapshot.heapTotal,
      external: current.external - this.baselineSnapshot.external,
      arrayBuffers: current.arrayBuffers - this.baselineSnapshot.arrayBuffers,
      rss: current.rss - this.baselineSnapshot.rss,
      timestamp: current.timestamp,
    };
  }

  /**
   * Reset monitor state
   */
  reset(): void {
    this.stopMonitoring();
    this.snapshots = [];
    this.baselineSnapshot = null;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Format bytes to human readable
   */
  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Generate memory report
   */
  generateReport(): string {
    const peak = this.getPeakUsage();
    const average = this.getAverageUsage();
    const growthRate = this.getGrowthRate();
    const leak = this.detectLeak();

    return `
Memory Monitor Report
=====================
Snapshots: ${this.snapshots.length}
Peak Usage: ${peak ? MemoryMonitor.formatBytes(peak.heapUsed) : 'N/A'}
Average Usage: ${MemoryMonitor.formatBytes(average)}
Growth Rate: ${MemoryMonitor.formatBytes(growthRate)}/sec
Leak Detected: ${leak.detected ? 'YES ⚠️' : 'NO ✓'}
Total Growth: ${MemoryMonitor.formatBytes(leak.totalGrowth)}
    `.trim();
  }
}

/**
 * Create a memory monitor instance
 */
export function createMemoryMonitor(): MemoryMonitor {
  return new MemoryMonitor();
}

/**
 * Monitor memory during function execution
 */
export async function monitorMemory<T>(
  fn: () => Promise<T> | T,
  options: { interval?: number; threshold?: number } = {},
): Promise<{ result: T; report: MemoryLeakReport }> {
  const monitor = new MemoryMonitor();
  monitor.startMonitoring(options.interval || 100);

  const result = await fn();

  monitor.stopMonitoring();
  const report = monitor.detectLeak(options.threshold);

  return { result, report };
}
