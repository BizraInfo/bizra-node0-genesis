/**
 * Metrics Parser Unit Tests با احسان
 * Fast, isolated tests for OpenMetrics parsing logic
 */

import { describe, it, expect } from 'vitest';

// Sample OpenMetrics data
const SAMPLE_METRICS = `
# HELP ihsan_compliance_score gauge
# TYPE ihsan_compliance_score gauge
ihsan_compliance_score{} 100

# HELP http_request_duration_seconds HTTP request latency histogram
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum{method="GET",endpoint="/api",status_code="200"} 0.123
http_request_duration_seconds_count{method="GET",endpoint="/api",status_code="200"} 7
http_request_duration_seconds_sum{method="POST",endpoint="/api/validate",status_code="200"} 0.456
http_request_duration_seconds_count{method="POST",endpoint="/api/validate",status_code="200"} 3

# HELP http_requests_total Counter of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/health",status="200"} 42
http_requests_total{method="POST",endpoint="/api/validate",status="200"} 15
`;

/**
 * Simple metrics parser (matches src/utils/metrics.ts)
 */
class MetricsParser {
  constructor(public endpoint: string) {}

  getGauge(text: string, metricName: string): number | null {
    const regex = new RegExp(`${metricName}\\{[^}]*\\}\\s+(\\d+(?:\\.\\d+)?)`);
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
  }

  getCounter(text: string, metricName: string, labels?: Record<string, string>): number | null {
    let pattern = metricName;
    if (labels) {
      const labelStr = Object.entries(labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
      pattern += `\\{${labelStr}\\}`;
    } else {
      pattern += '\\{[^}]*\\}';
    }
    pattern += '\\s+(\\d+(?:\\.\\d+)?)';

    const regex = new RegExp(pattern);
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
  }

  getAvgFromHist(
    text: string,
    metricName: string,
    labelKey?: string,
    labelValue?: string
  ): number | null {
    const sumRegex = labelKey && labelValue
      ? new RegExp(`${metricName}_sum\\{[^}]*${labelKey}="${labelValue}"[^}]*\\}\\s+(\\d+(?:\\.\\d+)?)`)
      : new RegExp(`${metricName}_sum\\{[^}]*\\}\\s+(\\d+(?:\\.\\d+)?)`);

    const countRegex = labelKey && labelValue
      ? new RegExp(`${metricName}_count\\{[^}]*${labelKey}="${labelValue}"[^}]*\\}\\s+(\\d+(?:\\.\\d+)?)`)
      : new RegExp(`${metricName}_count\\{[^}]*\\}\\s+(\\d+(?:\\.\\d+)?)`);

    const sumMatch = text.match(sumRegex);
    const countMatch = text.match(countRegex);

    if (!sumMatch || !countMatch) return null;

    const sum = parseFloat(sumMatch[1]);
    const count = parseFloat(countMatch[1]);

    return count > 0 ? sum / count : null;
  }
}

describe('MetricsParser', () => {
  describe('getGauge()', () => {
    it('parses gauge metric correctly', () => {
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getGauge(SAMPLE_METRICS, 'ihsan_compliance_score');
      expect(value).toBe(100);
    });

    it('returns null for non-existent gauge', () => {
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getGauge(SAMPLE_METRICS, 'nonexistent_metric');
      expect(value).toBeNull();
    });

    it('handles احسان characters in metric names', () => {
      const arabicMetrics = 'احسان_score{} 95.5';
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getGauge(arabicMetrics, 'احسان_score');
      expect(value).toBe(95.5);
    });
  });

  describe('getCounter()', () => {
    it('parses counter without label filter', () => {
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getCounter(SAMPLE_METRICS, 'http_requests_total');
      expect(value).toBeGreaterThan(0);
    });

    it('parses counter with exact label match', () => {
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getCounter(
        SAMPLE_METRICS,
        'http_requests_total',
        { method: 'GET', endpoint: '/health', status: '200' }
      );
      expect(value).toBe(42);
    });

    it('returns null for non-matching labels', () => {
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getCounter(
        SAMPLE_METRICS,
        'http_requests_total',
        { method: 'DELETE', endpoint: '/nonexistent', status: '404' }
      );
      expect(value).toBeNull();
    });
  });

  describe('getAvgFromHist()', () => {
    it('computes histogram average correctly', () => {
      const parser = new MetricsParser('http://test/metrics');
      const avg = parser.getAvgFromHist(
        SAMPLE_METRICS,
        'http_request_duration_seconds',
        'endpoint',
        '/api'
      );
      expect(avg).toBeCloseTo(0.123 / 7, 6);
    });

    it('computes average for different label', () => {
      const parser = new MetricsParser('http://test/metrics');
      const avg = parser.getAvgFromHist(
        SAMPLE_METRICS,
        'http_request_duration_seconds',
        'endpoint',
        '/api/validate'
      );
      expect(avg).toBeCloseTo(0.456 / 3, 6);
    });

    it('returns null when count is zero', () => {
      const zeroCount = 'metric_sum{} 100\nmetric_count{} 0';
      const parser = new MetricsParser('http://test/metrics');
      const avg = parser.getAvgFromHist(zeroCount, 'metric');
      expect(avg).toBeNull();
    });

    it('returns null for non-existent histogram', () => {
      const parser = new MetricsParser('http://test/metrics');
      const avg = parser.getAvgFromHist(SAMPLE_METRICS, 'nonexistent_histogram');
      expect(avg).toBeNull();
    });
  });

  describe('Edge Cases با احسان', () => {
    it('handles malformed label sets (leading comma)', () => {
      const malformed = 'http_requests_total{,method="GET"} 10';
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getCounter(malformed, 'http_requests_total');
      // Should not match malformed labelset
      expect(value).toBeNull();
    });

    it('handles empty label sets', () => {
      const empty = 'simple_counter{} 123';
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getCounter(empty, 'simple_counter');
      expect(value).toBe(123);
    });

    it('handles float values', () => {
      const floats = 'temperature_celsius{location="server"} 42.7';
      const parser = new MetricsParser('http://test/metrics');
      const value = parser.getCounter(floats, 'temperature_celsius');
      expect(value).toBe(42.7);
    });
  });
});
