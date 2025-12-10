"""
BIZRA vLLM Performance Validation Script
احsان: Verify state-of-art performance targets

Validates:
- Latency: p95 < 1000ms
- Throughput: >= 30 tokens/sec (minimum), >= 50 optimal
- احسان pass rate: >= 80%

Usage:
  python tests/validate-vllm-performance.py
  python tests/validate-vllm-performance.py --url http://localhost:8000
  python tests/validate-vllm-performance.py --requests 100
"""

import sys
import time
import json
import argparse
import statistics
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import requests
except ImportError:
    print("ERROR: requests library not found")
    print("Install: pip install requests")
    sys.exit(1)

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------

DEFAULT_URL = "http://localhost:8000"
DEFAULT_REQUESTS = 50  # Number of test requests
DEFAULT_CONCURRENCY = 10  # Concurrent requests

# احسان Targets
LATENCY_TARGET_MS = 1000  # p95 < 1s
THROUGHPUT_TARGET = 30.0  # tokens/sec minimum
THROUGHPUT_OPTIMAL = 50.0  # tokens/sec optimal
IHSAN_PASS_RATE_TARGET = 80.0  # 80%+

# Test prompts
TEST_PROMPTS = [
    "What is احسان in BIZRA?",
    "Explain the Proof of Impact mechanism.",
    "How does BIZRA serve 10K users?",
    "What makes BIZRA different from other blockchain projects?",
    "Describe the BIZRA token economy.",
    "What is the role of Node-0 in the BIZRA network?",
    "How does BIZRA ensure data integrity?",
    "What are the key principles of احsان in software development?",
]

# -------------------------------------------------------------------
# احسان Validation
# -------------------------------------------------------------------

class PerformanceMetrics:
    def __init__(self):
        self.latencies: List[float] = []
        self.throughputs: List[float] = []
        self.ihsan_passes: List[bool] = []
        self.errors: List[str] = []
        self.total_tokens: int = 0

    def add_result(self, latency_ms: float, throughput: float, ihsan_pass: bool, tokens: int):
        self.latencies.append(latency_ms)
        self.throughputs.append(throughput)
        self.ihsan_passes.append(ihsan_pass)
        self.total_tokens += tokens

    def add_error(self, error: str):
        self.errors.append(error)

    def get_summary(self) -> Dict[str, Any]:
        if not self.latencies:
            return {"error": "No successful requests"}

        latencies_sorted = sorted(self.latencies)
        n = len(latencies_sorted)

        return {
            "requests": {
                "total": n + len(self.errors),
                "successful": n,
                "failed": len(self.errors),
                "error_rate": len(self.errors) / (n + len(self.errors)) * 100 if n + len(self.errors) > 0 else 0
            },
            "latency": {
                "avg_ms": statistics.mean(self.latencies),
                "min_ms": min(self.latencies),
                "p50_ms": latencies_sorted[n // 2],
                "p95_ms": latencies_sorted[int(n * 0.95)] if n > 20 else latencies_sorted[-1],
                "p99_ms": latencies_sorted[int(n * 0.99)] if n > 100 else latencies_sorted[-1],
                "max_ms": max(self.latencies)
            },
            "throughput": {
                "avg_tokens_per_sec": statistics.mean(self.throughputs),
                "min_tokens_per_sec": min(self.throughputs),
                "p50_tokens_per_sec": sorted(self.throughputs)[n // 2],
                "p95_tokens_per_sec": sorted(self.throughputs)[int(n * 0.95)] if n > 20 else sorted(self.throughputs)[-1],
                "max_tokens_per_sec": max(self.throughputs)
            },
            "ihsan": {
                "pass_count": sum(self.ihsan_passes),
                "fail_count": len(self.ihsan_passes) - sum(self.ihsan_passes),
                "pass_rate": sum(self.ihsan_passes) / len(self.ihsan_passes) * 100
            },
            "tokens": {
                "total": self.total_tokens,
                "avg_per_request": self.total_tokens / n if n > 0 else 0
            }
        }

# -------------------------------------------------------------------
# Test Execution
# -------------------------------------------------------------------

def make_request(url: str, prompt: str, max_tokens: int = 100) -> Dict[str, Any]:
    """Make single inference request"""
    start_time = time.time()

    try:
        response = requests.post(
            f"{url}/v1/completions",
            json={
                "model": "bizra-inference",
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": 0.7,
                "top_p": 0.9
            },
            timeout=30
        )

        latency = (time.time() - start_time) * 1000  # ms

        if response.status_code != 200:
            return {"error": f"HTTP {response.status_code}: {response.text}"}

        data = response.json()
        usage = data.get("usage", {})

        return {
            "latency_ms": latency,
            "throughput": usage.get("throughput_tokens_per_sec", 0),
            "ihsan_pass": usage.get("ihsan_pass", False),
            "tokens": usage.get("completion_tokens", 0),
            "text": data.get("choices", [{}])[0].get("text", "")
        }

    except requests.Timeout:
        return {"error": "Request timeout (>30s)"}
    except Exception as e:
        return {"error": str(e)}

def run_validation(url: str, num_requests: int, concurrency: int) -> PerformanceMetrics:
    """Run validation test"""
    print(f"\n{'='*70}")
    print("BIZRA vLLM Performance Validation")
    print(f"{'='*70}\n")
    print(f"Server: {url}")
    print(f"Requests: {num_requests}")
    print(f"Concurrency: {concurrency}")
    print(f"\nahsan Targets:")
    print(f"  - Latency: p95 < {LATENCY_TARGET_MS}ms")
    print(f"  - Throughput: >= {THROUGHPUT_TARGET} tokens/sec (min), >= {THROUGHPUT_OPTIMAL} (optimal)")
    print(f"  - احsان Pass Rate: >= {IHSAN_PASS_RATE_TARGET}%")
    print(f"\n{'='*70}\n")

    # Check server health
    print("Checking server health...")
    try:
        health = requests.get(f"{url}/health", timeout=5)
        if health.status_code == 200:
            health_data = health.json()
            print(f"[OK] Server healthy")
            print(f"     Engine: {health_data.get('engine', 'unknown')}")
            print(f"     احsان score: {health_data.get('احsان_score', 0)}%")
        else:
            print(f"[WARNING] Server health check failed: HTTP {health.status_code}")
    except Exception as e:
        print(f"[ERROR] Cannot connect to server: {e}")
        return PerformanceMetrics()

    print(f"\nRunning {num_requests} requests (concurrency={concurrency})...\n")

    metrics = PerformanceMetrics()

    # Generate test requests
    prompts = [TEST_PROMPTS[i % len(TEST_PROMPTS)] for i in range(num_requests)]

    # Execute with concurrency
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = [executor.submit(make_request, url, prompt) for prompt in prompts]

        completed = 0
        for future in as_completed(futures):
            completed += 1
            result = future.result()

            if "error" in result:
                metrics.add_error(result["error"])
                print(f"[{completed}/{num_requests}] ERROR: {result['error']}")
            else:
                metrics.add_result(
                    result["latency_ms"],
                    result["throughput"],
                    result["ihsan_pass"],
                    result["tokens"]
                )

                # احسان indicator
                ihsan_icon = "[PASS]" if result["ihsan_pass"] else "[FAIL]"
                print(f"[{completed}/{num_requests}] {ihsan_icon} "
                      f"Latency: {result['latency_ms']:.0f}ms, "
                      f"Throughput: {result['throughput']:.1f} tok/s")

    return metrics

# -------------------------------------------------------------------
# Results Display
# -------------------------------------------------------------------

def display_results(metrics: PerformanceMetrics):
    """Display احsان validation results"""
    summary = metrics.get_summary()

    if "error" in summary:
        print(f"\n[ERROR] {summary['error']}")
        return

    print(f"\n{'='*70}")
    print("VALIDATION RESULTS")
    print(f"{'='*70}\n")

    # Requests
    print("[REQUESTS]")
    print(f"  Total:      {summary['requests']['total']}")
    print(f"  Successful: {summary['requests']['successful']}")
    print(f"  Failed:     {summary['requests']['failed']}")
    print(f"  Error Rate: {summary['requests']['error_rate']:.2f}%")

    # Latency
    print(f"\n[LATENCY] (احsان target: p95 < {LATENCY_TARGET_MS}ms)")
    print(f"  Average: {summary['latency']['avg_ms']:.2f}ms")
    print(f"  p50:     {summary['latency']['p50_ms']:.2f}ms")
    print(f"  p95:     {summary['latency']['p95_ms']:.2f}ms")
    print(f"  p99:     {summary['latency']['p99_ms']:.2f}ms")
    print(f"  Max:     {summary['latency']['max_ms']:.2f}ms")

    p95_latency = summary['latency']['p95_ms']
    if p95_latency < LATENCY_TARGET_MS:
        print(f"  [PASS] p95 latency meets احsان target")
    else:
        print(f"  [FAIL] p95 latency exceeds احsان target by {p95_latency - LATENCY_TARGET_MS:.0f}ms")

    # Throughput
    print(f"\n[THROUGHPUT] (احsان target: >= {THROUGHPUT_TARGET} tok/s min, >= {THROUGHPUT_OPTIMAL} optimal)")
    print(f"  Average: {summary['throughput']['avg_tokens_per_sec']:.2f} tokens/sec")
    print(f"  p50:     {summary['throughput']['p50_tokens_per_sec']:.2f} tokens/sec")
    print(f"  p95:     {summary['throughput']['p95_tokens_per_sec']:.2f} tokens/sec")
    print(f"  Max:     {summary['throughput']['max_tokens_per_sec']:.2f} tokens/sec")

    avg_throughput = summary['throughput']['avg_tokens_per_sec']
    if avg_throughput >= THROUGHPUT_OPTIMAL:
        print(f"  [PASS] Throughput exceeds optimal احsان target")
    elif avg_throughput >= THROUGHPUT_TARGET:
        print(f"  [PASS] Throughput meets minimum احsان target")
    else:
        print(f"  [FAIL] Throughput below احsان target by {THROUGHPUT_TARGET - avg_throughput:.1f} tok/s")

    # احsان
    print(f"\n[احسان VALIDATION] (target: >= {IHSAN_PASS_RATE_TARGET}%)")
    print(f"  Pass Count:  {summary['ihsan']['pass_count']}")
    print(f"  Fail Count:  {summary['ihsan']['fail_count']}")
    print(f"  Pass Rate:   {summary['ihsan']['pass_rate']:.2f}%")

    ihsan_pass_rate = summary['ihsan']['pass_rate']
    if ihsan_pass_rate >= IHSAN_PASS_RATE_TARGET:
        print(f"  [PASS] احsان pass rate meets target")
    else:
        print(f"  [FAIL] احsان pass rate below target by {IHSAN_PASS_RATE_TARGET - ihsan_pass_rate:.1f}%")

    # Tokens
    print(f"\n[TOKENS]")
    print(f"  Total Generated: {summary['tokens']['total']}")
    print(f"  Avg Per Request: {summary['tokens']['avg_per_request']:.1f}")

    # Final Verdict
    print(f"\n{'='*70}")
    latency_pass = p95_latency < LATENCY_TARGET_MS
    throughput_pass = avg_throughput >= THROUGHPUT_TARGET
    ihsan_rate_pass = ihsan_pass_rate >= IHSAN_PASS_RATE_TARGET
    error_rate_pass = summary['requests']['error_rate'] < 5.0

    all_pass = latency_pass and throughput_pass and ihsan_rate_pass and error_rate_pass

    if all_pass:
        print("[PASS] احسان VALIDATION PASSED - Ready for 10K users!")
    else:
        print("[FAIL] احسان VALIDATION FAILED:")
        if not latency_pass:
            print(f"  - Latency: p95 {p95_latency:.0f}ms >= {LATENCY_TARGET_MS}ms")
        if not throughput_pass:
            print(f"  - Throughput: {avg_throughput:.1f} < {THROUGHPUT_TARGET} tok/s")
        if not ihsan_rate_pass:
            print(f"  - احsان pass rate: {ihsan_pass_rate:.1f}% < {IHSAN_PASS_RATE_TARGET}%")
        if not error_rate_pass:
            print(f"  - Error rate: {summary['requests']['error_rate']:.1f}% >= 5%")

    print(f"{'='*70}\n")

    # Save results
    results_file = "vllm-validation-results.json"
    with open(results_file, "w") as f:
        json.dump({
            "summary": summary,
            "verdict": "PASS" if all_pass else "FAIL",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }, f, indent=2)
    print(f"Results saved to: {results_file}")

# -------------------------------------------------------------------
# Main
# -------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="BIZRA vLLM Performance Validation")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"Server URL (default: {DEFAULT_URL})")
    parser.add_argument("--requests", type=int, default=DEFAULT_REQUESTS, help=f"Number of requests (default: {DEFAULT_REQUESTS})")
    parser.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY, help=f"Concurrency (default: {DEFAULT_CONCURRENCY})")

    args = parser.parse_args()

    metrics = run_validation(args.url, args.requests, args.concurrency)
    display_results(metrics)

if __name__ == "__main__":
    main()
