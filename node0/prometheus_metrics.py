#!/usr/bin/env python3
"""
PROMETHEUS HISTOGRAM METRICS EXPORTER FOR NODE0
Version: 1.0
Deployment Date: October 26, 2025

Exports OpenMetrics-format histograms for SLO tracking:
- API latency (with explicit buckets for P95/P99 calculation)
- Alpha service latency
- MCP service latency
- Agent coordination metrics
- Optimizer cycle duration
- Ihsan compliance score

Reference: https://prometheus.io/docs/practices/histograms/
"""

import time
from typing import Dict, List, Any, Optional
from collections import defaultdict
from datetime import datetime
import threading

class PrometheusHistogram:
    """
    Prometheus histogram with explicit buckets

    Allows accurate quantile calculation via histogram_quantile() in PromQL
    """

    def __init__(self, name: str, help_text: str, buckets: List[float], labels: List[str] = None):
        self.name = name
        self.help_text = help_text
        self.buckets = sorted(buckets)
        self.labels = labels or []

        # Storage: {label_values: {bucket: count}}
        self.bucket_counts = defaultdict(lambda: defaultdict(int))
        self.sum_values = defaultdict(float)
        self.count_values = defaultdict(int)

        self.lock = threading.Lock()

    def observe(self, value: float, label_values: tuple = ()):
        """Record an observation"""
        with self.lock:
            # Increment buckets
            for bucket in self.buckets:
                if value <= bucket:
                    self.bucket_counts[label_values][bucket] += 1

            # Always increment +Inf bucket
            self.bucket_counts[label_values][float('inf')] += 1

            # Update sum and count
            self.sum_values[label_values] += value
            self.count_values[label_values] += 1

    def render(self) -> str:
        """Render in OpenMetrics format"""
        with self.lock:
            lines = []

            # HELP and TYPE
            lines.append(f"# HELP {self.name} {self.help_text}")
            lines.append(f"# TYPE {self.name} histogram")

            # Render each label combination
            for label_values, buckets in self.bucket_counts.items():
                label_str = self._format_labels(label_values)

                # Render buckets
                for bucket, count in sorted(buckets.items()):
                    bucket_str = "+Inf" if bucket == float('inf') else str(bucket)
                    lines.append(f'{self.name}_bucket{{le="{bucket_str}"{label_str}}} {count}')

                # Render sum and count
                lines.append(f'{self.name}_sum{{{label_str}}} {self.sum_values[label_values]}')
                lines.append(f'{self.name}_count{{{label_str}}} {self.count_values[label_values]}')

            return '\n'.join(lines)

    def _format_labels(self, label_values: tuple) -> str:
        """Format labels for metric output"""
        if not self.labels or not label_values:
            return ""

        pairs = [f'{k}="{v}"' for k, v in zip(self.labels, label_values)]
        return ("," if pairs else "") + ",".join(pairs)


class PrometheusGauge:
    """Simple gauge metric"""

    def __init__(self, name: str, help_text: str, labels: List[str] = None):
        self.name = name
        self.help_text = help_text
        self.labels = labels or []
        self.values = defaultdict(float)
        self.lock = threading.Lock()

    def set(self, value: float, label_values: tuple = ()):
        """Set gauge value"""
        with self.lock:
            self.values[label_values] = value

    def inc(self, amount: float = 1.0, label_values: tuple = ()):
        """Increment gauge"""
        with self.lock:
            self.values[label_values] += amount

    def render(self) -> str:
        """Render in OpenMetrics format"""
        with self.lock:
            lines = []

            lines.append(f"# HELP {self.name} {self.help_text}")
            lines.append(f"# TYPE {self.name} gauge")

            for label_values, value in self.values.items():
                label_str = self._format_labels(label_values)
                lines.append(f'{self.name}{{{label_str}}} {value}')

            return '\n'.join(lines)

    def _format_labels(self, label_values: tuple) -> str:
        """Format labels for metric output"""
        if not self.labels or not label_values:
            return ""

        pairs = [f'{k}="{v}"' for k, v in zip(self.labels, label_values)]
        return ",".join(pairs) if pairs else ""


class PrometheusCounter:
    """Prometheus counter metric (monotonically increasing)"""

    def __init__(self, name: str, help_text: str, labels: List[str] = None):
        self.name = name
        self.help_text = help_text
        self.labels = labels or []
        self.values = defaultdict(float)
        self.lock = threading.Lock()

    def inc(self, amount: float = 1.0, label_values: tuple = ()):
        """Increment counter"""
        with self.lock:
            self.values[label_values] += amount

    def render(self) -> str:
        """Render in OpenMetrics format"""
        with self.lock:
            lines = []

            lines.append(f"# HELP {self.name} {self.help_text}")
            lines.append(f"# TYPE {self.name} counter")

            for label_values, value in self.values.items():
                label_str = self._format_labels(label_values)
                lines.append(f'{self.name}{{{label_str}}} {value}')

            return '\n'.join(lines)

    def _format_labels(self, label_values: tuple) -> str:
        """Format labels for metric output"""
        if not self.labels or not label_values:
            return ""

        pairs = [f'{k}="{v}"' for k, v in zip(self.labels, label_values)]
        return ",".join(pairs) if pairs else ""


class Node0MetricsRegistry:
    """
    Central metrics registry for Node0

    Exports all metrics in OpenMetrics format for Prometheus scraping
    """

    def __init__(self):
        self.metrics = []

        # API latency histogram (explicit buckets for accurate quantiles)
        self.api_latency = PrometheusHistogram(
            name="http_request_duration_seconds",
            help_text="HTTP request duration in seconds",
            buckets=[0.001, 0.005, 0.010, 0.025, 0.050, 0.100, 0.250, 0.500, 1.0, 2.5, 5.0],
            labels=["method", "endpoint", "status_code"]
        )
        self.metrics.append(self.api_latency)

        # Alpha service latency
        self.alpha_latency = PrometheusHistogram(
            name="alpha_request_duration_seconds",
            help_text="Alpha service request duration in seconds",
            buckets=[0.010, 0.050, 0.100, 0.250, 0.500, 1.0, 2.0, 5.0, 10.0],
            labels=["operation"]
        )
        self.metrics.append(self.alpha_latency)

        # MCP LLM latency
        self.mcp_llm_latency = PrometheusHistogram(
            name="mcp_llm_request_duration_seconds",
            help_text="MCP LLM request duration in seconds",
            buckets=[0.010, 0.050, 0.100, 0.250, 0.500, 1.0, 2.0, 5.0],
            labels=["model"]
        )
        self.metrics.append(self.mcp_llm_latency)

        # Agent coordination latency
        self.agent_coordination_latency = PrometheusHistogram(
            name="agent_coordination_duration_seconds",
            help_text="Agent coordination duration in seconds",
            buckets=[0.001, 0.005, 0.010, 0.050, 0.100, 0.250, 0.500, 1.0],
            labels=["coordinator", "agent_type"]
        )
        self.metrics.append(self.agent_coordination_latency)

        # Optimizer cycle duration
        self.optimizer_cycle_duration = PrometheusHistogram(
            name="bizra_optimizer_cycle_duration_seconds",
            help_text="Duration of an optimization cycle",
            buckets=[1, 5, 10, 15, 30, 60, 120, 300],
            labels=["cycle_status"]
        )
        self.metrics.append(self.optimizer_cycle_duration)

        # Ihsan compliance score (gauge)
        self.ihsan_score = PrometheusGauge(
            name="ihsan_compliance_score",
            help_text="Ihsan compliance score (0-100)"
        )
        self.metrics.append(self.ihsan_score)

        # SNR score (gauge)
        self.snr_score = PrometheusGauge(
            name="bizra_snr_score",
            help_text="Signal-to-Noise Ratio score (0-100)"
        )
        self.metrics.append(self.snr_score)

        # Active connections (gauge)
        self.active_connections = PrometheusGauge(
            name="bizra_active_connections",
            help_text="Number of active WebSocket connections"
        )
        self.metrics.append(self.active_connections)

        # Messages sent (counter)
        self.messages_sent = PrometheusCounter(
            name="bizra_messages_sent_total",
            help_text="Total WebSocket messages sent"
        )
        self.metrics.append(self.messages_sent)

        # Errors total (counter)
        self.errors_total = PrometheusCounter(
            name="bizra_errors_total",
            help_text="Total errors encountered"
        )
        self.metrics.append(self.errors_total)

        # SLO error budget remaining (gauge)
        self.error_budget = PrometheusGauge(
            name="slo_error_budget_remaining",
            help_text="Error budget remaining for SLO (0-1)",
            labels=["slo_name"]
        )
        self.metrics.append(self.error_budget)

        # Request counters for availability calculation (احسان - COUNTER not gauge)
        self.http_requests_total = PrometheusCounter(
            name="http_requests_total",
            help_text="Total HTTP requests",
            labels=["method", "route", "status_code"]  # route pattern, not exact endpoint
        )
        self.metrics.append(self.http_requests_total)

    @staticmethod
    def normalize_route(endpoint: str) -> str:
        """
        Normalize endpoint to route pattern to cap label cardinality

        احسان Compliance: Prevents cardinality explosion from UUID/ID paths
        Examples:
          /api/user/12345 → /api/user/{id}
          /api/cycle/integrated-1761436752 → /api/cycle/{id}
          /health → /health (static routes unchanged)
        """
        import re

        # UUID pattern
        endpoint = re.sub(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '/{uuid}', endpoint, flags=re.IGNORECASE)

        # Numeric IDs
        endpoint = re.sub(r'/\d+', '/{id}', endpoint)

        # Cycle IDs (integrated-timestamp pattern)
        endpoint = re.sub(r'/integrated-\d+', '/{cycle_id}', endpoint)
        endpoint = re.sub(r'/cycle-\d+', '/{cycle_id}', endpoint)

        return endpoint

    def record_api_request(self, method: str, endpoint: str, status_code: int, duration_seconds: float):
        """Record API request metrics"""
        route = self.normalize_route(endpoint)  # احسان - use route pattern
        labels = (method, route, str(status_code))
        self.api_latency.observe(duration_seconds, labels)
        self.http_requests_total.inc(1.0, labels)

    def record_alpha_request(self, operation: str, duration_seconds: float):
        """Record Alpha service request"""
        self.alpha_latency.observe(duration_seconds, (operation,))

    def record_mcp_llm_request(self, model: str, duration_seconds: float):
        """Record MCP LLM request"""
        self.mcp_llm_latency.observe(duration_seconds, (model,))

    def record_agent_coordination(self, coordinator: str, agent_type: str, duration_seconds: float):
        """Record agent coordination event"""
        self.agent_coordination_latency.observe(duration_seconds, (coordinator, agent_type))

    def record_optimizer_cycle(self, status: str, duration_seconds: float):
        """Record optimizer cycle completion"""
        self.optimizer_cycle_duration.observe(duration_seconds, (status,))

    def set_ihsan_score(self, score: float):
        """Set current Ihsan compliance score"""
        self.ihsan_score.set(score)

    def set_snr_score(self, score: float):
        """Set current SNR score"""
        self.snr_score.set(score)

    def set_active_connections(self, count: float):
        """Set active connections count"""
        self.active_connections.set(count)

    def set_messages_sent(self, count: float):
        """Set total messages sent (counter)"""
        self.messages_sent.inc(count)

    def set_errors_total(self, count: float):
        """Set total errors (counter)"""
        self.errors_total.inc(count)

    def set_error_budget(self, slo_name: str, budget_remaining: float):
        """Set error budget remaining for an SLO"""
        self.error_budget.set(budget_remaining, (slo_name,))

    def render_metrics(self) -> str:
        """Render all metrics in OpenMetrics format"""
        lines = [
            "# OpenMetrics format - BIZRA Node0 Metrics",
            f"# Generated: {datetime.now().isoformat()}",
            ""
        ]

        for metric in self.metrics:
            lines.append(metric.render())
            lines.append("")  # Blank line between metrics

        # Add EOF marker (OpenMetrics standard)
        lines.append("# EOF")

        return '\n'.join(lines)

    def get_promql_examples(self) -> Dict[str, str]:
        """Get example PromQL queries for these metrics"""
        return {
            "api_p95_latency": """
                # 95th percentile API latency (1h window)
                histogram_quantile(0.95,
                  sum(rate(http_request_duration_seconds_bucket[1h])) by (le)
                )
            """,

            "api_p99_latency": """
                # 99th percentile API latency (1h window)
                histogram_quantile(0.99,
                  sum(rate(http_request_duration_seconds_bucket[1h])) by (le)
                )
            """,

            "api_availability_30d": """
                # API availability over 30 days
                sum(rate(http_requests_total{status_code!~"5.."}[30d]))
                /
                sum(rate(http_requests_total[30d]))
            """,

            "error_budget_remaining": """
                # Error budget remaining for API availability SLO
                1 - (
                  (1 - sum(rate(http_requests_total{status_code!~"5.."}[30d]))
                       / sum(rate(http_requests_total[30d])))
                  / (1 - 0.999)
                )
            """,

            "burn_rate_1h": """
                # Error budget burn rate (1h window)
                (1 - sum(rate(http_requests_total{status_code!~"5.."}[1h]))
                     / sum(rate(http_requests_total[1h])))
                / (1 - 0.999)
            """,

            "optimizer_success_rate": """
                # Optimizer cycle success rate
                sum(rate(bizra_optimizer_cycle_duration_seconds_count{cycle_status="success"}[1h]))
                /
                sum(rate(bizra_optimizer_cycle_duration_seconds_count[1h]))
            """,

            "ihsan_compliance_check": """
                # Ihsan compliance check (should be >= 95.0)
                ihsan_compliance_score >= 95.0
            """
        }


# Global registry singleton
_registry = None

def get_metrics_registry() -> Node0MetricsRegistry:
    """Get or create the global metrics registry"""
    global _registry
    if _registry is None:
        _registry = Node0MetricsRegistry()
    return _registry


# Example Flask/Express endpoint for /metrics
def create_metrics_endpoint():
    """
    Example function to create a /metrics endpoint

    For Flask:
        @app.route('/metrics')
        def metrics():
            return create_metrics_endpoint(), 200, {'Content-Type': 'text/plain'}

    For Express (Node.js):
        app.get('/metrics', (req, res) => {
          const metrics = python_bridge.call('create_metrics_endpoint');
          res.type('text/plain').send(metrics);
        });
    """
    registry = get_metrics_registry()
    return registry.render_metrics()


if __name__ == "__main__":
    # Demonstration
    print("PROMETHEUS METRICS DEMONSTRATION")
    print("=" * 60)

    registry = get_metrics_registry()

    # Simulate some API requests
    print("\nSimulating API requests...")
    for i in range(100):
        # Vary latency
        if i < 90:
            latency = 0.015  # Fast
        elif i < 98:
            latency = 0.045  # Medium
        else:
            latency = 0.120  # Slow

        status = 200 if i < 99 else 500

        registry.record_api_request("GET", "/health", status, latency)

    # Simulate optimizer cycle
    print("Simulating optimizer cycle...")
    registry.record_optimizer_cycle("success", 41.5)

    # Set Ihsan score
    registry.set_ihsan_score(100.0)

    # Set error budgets
    registry.set_error_budget("api_availability", 0.90)
    registry.set_error_budget("ihsan_compliance", 1.0)

    # Render metrics
    print("\n" + "=" * 60)
    print("SAMPLE METRICS OUTPUT:")
    print("=" * 60)
    print(registry.render_metrics())

    # Show PromQL examples
    print("\n" + "=" * 60)
    print("EXAMPLE PROMQL QUERIES:")
    print("=" * 60)

    examples = registry.get_promql_examples()
    for name, query in examples.items():
        print(f"\n{name}:{query}")

    print("\n" + "=" * 60)
    print("Metrics ready for Prometheus scraping at /metrics endpoint")
