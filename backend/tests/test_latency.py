"""
Layer 5: Latency tests
Memvalidasi Req. 8.4 — recommend() harus selesai < 5 detik.
"""

import time

import pytest

from ml.content_based_filter import recommend


# Targets dari requirements
P50_TARGET_MS = 500    # median harus < 0.5 detik
P95_TARGET_MS = 2000   # 95% < 2 detik
P99_TARGET_MS = 5000   # 99% < 5 detik (Req. 8.4)


class TestLatency:
    """Recommend() harus cepat untuk menjaga UX."""

    def test_single_call_under_5_seconds(
        self, artifacts, food_df, base_targets
    ):
        """Single call harus selesai dalam < 5 detik."""
        start = time.perf_counter()
        recommend(base_targets, food_df, artifacts, top_k=20)
        elapsed_ms = (time.perf_counter() - start) * 1000
        assert elapsed_ms < 5000, f"Latency {elapsed_ms:.0f}ms > 5000ms"

    def test_p95_p99_under_threshold(
        self, artifacts, food_df, base_targets
    ):
        """P95 < 2s dan P99 < 5s untuk 50 panggilan berurutan."""
        latencies = []
        for _ in range(50):
            start = time.perf_counter()
            recommend(base_targets, food_df, artifacts, top_k=20)
            latencies.append((time.perf_counter() - start) * 1000)

        latencies.sort()
        p50 = latencies[len(latencies) // 2]
        p95 = latencies[int(len(latencies) * 0.95)]
        p99 = latencies[int(len(latencies) * 0.99)]

        print(f"\n  Latency P50={p50:.1f}ms, P95={p95:.1f}ms, P99={p99:.1f}ms")

        assert p50 < P50_TARGET_MS, f"P50 {p50:.0f}ms > {P50_TARGET_MS}ms"
        assert p95 < P95_TARGET_MS, f"P95 {p95:.0f}ms > {P95_TARGET_MS}ms"
        assert p99 < P99_TARGET_MS, f"P99 {p99:.0f}ms > {P99_TARGET_MS}ms"
