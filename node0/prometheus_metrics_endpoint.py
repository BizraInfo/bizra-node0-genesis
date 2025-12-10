#!/usr/bin/env python3
"""
PROMETHEUS METRICS ENDPOINT (Production Version)

احسان Compliance: No assumptions, fast execution, explicit output
Purpose: Generate Prometheus metrics for Node.js /metrics endpoint
"""

import sys
import os
from datetime import datetime

# Import the metrics registry
from prometheus_metrics import get_metrics_registry

def load_latest_optimizer_data():
    """
    Load latest optimizer metrics from evidence files

    احسان Compliance: Reads actual evidence files, no fabrication
    """
    evidence_dir = os.path.join(os.path.dirname(__file__), '..', 'evidence', 'poi-attestations')

    if not os.path.exists(evidence_dir):
        return None

    try:
        # Find most recent attestation file
        files = [f for f in os.listdir(evidence_dir) if f.startswith('self-optimization-cycle-')]
        if not files:
            return None

        latest_file = sorted(files)[-1]
        file_path = os.path.join(evidence_dir, latest_file)

        import json
        with open(file_path, 'r') as f:
            data = json.load(f)

        return data
    except Exception as e:
        print(f"# Warning: Failed to load optimizer data: {e}", file=sys.stderr)
        return None

def load_runtime_metrics():
    """
    Load runtime metrics from JSON file
    """
    metrics_file = os.path.join(os.path.dirname(__file__), 'runtime_metrics.json')
    if not os.path.exists(metrics_file):
        return None
    
    try:
        import json
        with open(metrics_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"# Warning: Failed to load runtime metrics: {e}", file=sys.stderr)
        return None

def main():
    """Generate and output Prometheus metrics"""
    try:
        # Get metrics registry
        registry = get_metrics_registry()

        # Load runtime metrics (Real-time)
        runtime_metrics = load_runtime_metrics()
        if runtime_metrics:
            registry.set_ihsan_score(runtime_metrics.get('ihsan_score', 0.0))
            registry.set_snr_score(runtime_metrics.get('snr_score', 0.0))
            registry.set_active_connections(runtime_metrics.get('active_connections', 0))
            registry.set_messages_sent(runtime_metrics.get('messages_sent', 0))
            registry.set_errors_total(runtime_metrics.get('errors', 0))

        # Load latest optimizer data and update registry (Historical/Cycle based)
        optimizer_data = load_latest_optimizer_data()
        if optimizer_data:
            # Only set ihsan_score from optimizer if not already set by runtime
            if not runtime_metrics:
                ihsan_score = optimizer_data.get('ahsan_score', 0.0)
                registry.set_ihsan_score(ihsan_score)

            # Optimizer cycle duration (if available)
            cycle_id = optimizer_data.get('cycle_id', 'unknown')

            # Record performance improvements as metrics
            improvements = optimizer_data.get('performance_improvements', {})
            if 'api_p95_ms' in improvements:
                # Convert milliseconds to seconds
                api_latency = improvements['api_p95_ms'] / 1000.0
                registry.record_api_request("GET", "/api", 200, api_latency)

            if 'alpha_p95_ms' in improvements:
                alpha_latency = improvements['alpha_p95_ms'] / 1000.0
                registry.record_alpha_request("inference", alpha_latency)

            if 'mcp_llm_p95_ms' in improvements:
                mcp_latency = improvements['mcp_llm_p95_ms'] / 1000.0
                registry.record_mcp_llm_request("claude-3", mcp_latency)

        # Render metrics in OpenMetrics format
        metrics = registry.render_metrics()

        # Output to stdout (احسان - explicit, clean output)
        print(metrics)

        # Exit cleanly
        sys.exit(0)

    except Exception as e:
        # احسان - explicit error reporting
        print(f"# ERROR: Failed to generate metrics: {e}", file=sys.stderr)

        # Output minimal fallback metrics
        print(f"# OpenMetrics format - BIZRA Node0 Metrics (Error State)")
        print(f"# Generated: {datetime.now().isoformat()}")
        print(f"# Error: {str(e)}")
        print(f"")
        print(f"# HELP bizra_metrics_error Metrics generation error")
        print(f"# TYPE bizra_metrics_error gauge")
        print(f"bizra_metrics_error 1")
        print(f"# EOF")

        sys.exit(1)

if __name__ == "__main__":
    main()
