/**
 * Load Generator Utility
 * Generates realistic load patterns for testing
 */

export interface LoadPattern {
  type: 'constant' | 'ramp' | 'spike' | 'wave' | 'random';
  duration: number;
  rps?: number; // requests per second
  startRps?: number;
  endRps?: number;
  spikeMultiplier?: number;
  waveAmplitude?: number;
  wavePeriod?: number;
}

export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duration: number;
  actualRps: number;
  errors: Array<{ error: Error; timestamp: number }>;
  latencies: number[];
}

export class LoadGenerator {
  private running: boolean = false;
  private results: LoadTestResult = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    duration: 0,
    actualRps: 0,
    errors: [],
    latencies: [],
  };

  /**
   * Generate constant load
   */
  async generateConstantLoad<T>(
    fn: () => Promise<T>,
    rps: number,
    durationMs: number,
  ): Promise<LoadTestResult> {
    this.reset();
    this.running = true;

    const startTime = Date.now();
    const intervalMs = 1000 / rps;
    const endTime = startTime + durationMs;

    const promises: Promise<void>[] = [];

    while (Date.now() < endTime && this.running) {
      const requestStart = performance.now();

      promises.push(
        fn()
          .then(() => {
            this.results.successfulRequests++;
            this.results.latencies.push(performance.now() - requestStart);
          })
          .catch((error) => {
            this.results.failedRequests++;
            this.results.errors.push({ error, timestamp: Date.now() });
          }),
      );

      this.results.totalRequests++;

      // Wait for next interval
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    // Wait for all requests to complete
    await Promise.all(promises);

    this.results.duration = Date.now() - startTime;
    this.results.actualRps = (this.results.totalRequests / this.results.duration) * 1000;

    return { ...this.results };
  }

  /**
   * Generate ramping load
   */
  async generateRampLoad<T>(
    fn: () => Promise<T>,
    startRps: number,
    endRps: number,
    durationMs: number,
  ): Promise<LoadTestResult> {
    this.reset();
    this.running = true;

    const startTime = Date.now();
    const endTime = startTime + durationMs;
    const rpsIncrement = (endRps - startRps) / (durationMs / 1000);

    const promises: Promise<void>[] = [];

    while (Date.now() < endTime && this.running) {
      const elapsed = (Date.now() - startTime) / 1000;
      const currentRps = startRps + rpsIncrement * elapsed;
      const intervalMs = 1000 / currentRps;

      const requestStart = performance.now();

      promises.push(
        fn()
          .then(() => {
            this.results.successfulRequests++;
            this.results.latencies.push(performance.now() - requestStart);
          })
          .catch((error) => {
            this.results.failedRequests++;
            this.results.errors.push({ error, timestamp: Date.now() });
          }),
      );

      this.results.totalRequests++;

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    await Promise.all(promises);

    this.results.duration = Date.now() - startTime;
    this.results.actualRps = (this.results.totalRequests / this.results.duration) * 1000;

    return { ...this.results };
  }

  /**
   * Generate spike load
   */
  async generateSpikeLoad<T>(
    fn: () => Promise<T>,
    baselineRps: number,
    spikeRps: number,
    spikeDurationMs: number,
    totalDurationMs: number,
  ): Promise<LoadTestResult> {
    this.reset();
    this.running = true;

    const startTime = Date.now();
    const endTime = startTime + totalDurationMs;
    const spikeStart = startTime + totalDurationMs / 2 - spikeDurationMs / 2;
    const spikeEnd = spikeStart + spikeDurationMs;

    const promises: Promise<void>[] = [];

    while (Date.now() < endTime && this.running) {
      const now = Date.now();
      const currentRps = now >= spikeStart && now <= spikeEnd ? spikeRps : baselineRps;
      const intervalMs = 1000 / currentRps;

      const requestStart = performance.now();

      promises.push(
        fn()
          .then(() => {
            this.results.successfulRequests++;
            this.results.latencies.push(performance.now() - requestStart);
          })
          .catch((error) => {
            this.results.failedRequests++;
            this.results.errors.push({ error, timestamp: Date.now() });
          }),
      );

      this.results.totalRequests++;

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    await Promise.all(promises);

    this.results.duration = Date.now() - startTime;
    this.results.actualRps = (this.results.totalRequests / this.results.duration) * 1000;

    return { ...this.results };
  }

  /**
   * Generate wave pattern load
   */
  async generateWaveLoad<T>(
    fn: () => Promise<T>,
    baseRps: number,
    amplitude: number,
    periodMs: number,
    durationMs: number,
  ): Promise<LoadTestResult> {
    this.reset();
    this.running = true;

    const startTime = Date.now();
    const endTime = startTime + durationMs;

    const promises: Promise<void>[] = [];

    while (Date.now() < endTime && this.running) {
      const elapsed = Date.now() - startTime;
      const phase = (elapsed % periodMs) / periodMs;
      const currentRps = baseRps + amplitude * Math.sin(phase * 2 * Math.PI);
      const intervalMs = 1000 / currentRps;

      const requestStart = performance.now();

      promises.push(
        fn()
          .then(() => {
            this.results.successfulRequests++;
            this.results.latencies.push(performance.now() - requestStart);
          })
          .catch((error) => {
            this.results.failedRequests++;
            this.results.errors.push({ error, timestamp: Date.now() });
          }),
      );

      this.results.totalRequests++;

      await new Promise((resolve) => setTimeout(resolve, Math.max(1, intervalMs)));
    }

    await Promise.all(promises);

    this.results.duration = Date.now() - startTime;
    this.results.actualRps = (this.results.totalRequests / this.results.duration) * 1000;

    return { ...this.results };
  }

  /**
   * Generate concurrent load (all at once)
   */
  async generateConcurrentLoad<T>(
    fn: () => Promise<T>,
    concurrency: number,
  ): Promise<LoadTestResult> {
    this.reset();
    this.running = true;

    const startTime = Date.now();
    const promises: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      const requestStart = performance.now();

      promises.push(
        fn()
          .then(() => {
            this.results.successfulRequests++;
            this.results.latencies.push(performance.now() - requestStart);
          })
          .catch((error) => {
            this.results.failedRequests++;
            this.results.errors.push({ error, timestamp: Date.now() });
          }),
      );

      this.results.totalRequests++;
    }

    await Promise.all(promises);

    this.results.duration = Date.now() - startTime;
    this.results.actualRps = (this.results.totalRequests / this.results.duration) * 1000;

    return { ...this.results };
  }

  /**
   * Stop load generation
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Reset results
   */
  private reset(): void {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      duration: 0,
      actualRps: 0,
      errors: [],
      latencies: [],
    };
  }

  /**
   * Get current results
   */
  getResults(): LoadTestResult {
    return { ...this.results };
  }

  /**
   * Generate load test report
   */
  generateReport(result: LoadTestResult): string {
    const successRate = (result.successfulRequests / result.totalRequests) * 100;
    const avgLatency =
      result.latencies.reduce((a, b) => a + b, 0) / result.latencies.length || 0;

    return `
Load Test Report
================
Duration: ${result.duration}ms
Total Requests: ${result.totalRequests}
Successful: ${result.successfulRequests} (${successRate.toFixed(2)}%)
Failed: ${result.failedRequests}
Actual RPS: ${result.actualRps.toFixed(2)}
Average Latency: ${avgLatency.toFixed(2)}ms
Errors: ${result.errors.length}
    `.trim();
  }
}

/**
 * Create a load generator instance
 */
export function createLoadGenerator(): LoadGenerator {
  return new LoadGenerator();
}
