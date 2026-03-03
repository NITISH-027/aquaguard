"""
AquaGuard Backend Tests
Test the statutory compliance priority engine without database.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from priority_engine import (
    evaluate_domestic,
    evaluate_agricultural,
    evaluate_industrial,
    evaluate_allocation,
    DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY,
    RESERVOIR_SAFE_LEVEL,
    RESERVOIR_EMERGENCY_LEVEL,
    AGRICULTURAL_STATUTORY_CAP,
    INDUSTRIAL_STATUTORY_CAP,
)


# ── Domestic Tests ──────────────────────────────────────────────────────────

class TestDomestic:
    def test_approved_within_cap(self):
        volume = 1000 * DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY  # exactly at cap
        allocated, status, reason, rule = evaluate_domestic(
            volume, population=1000, reservoir_level=50.0, drought_mode=False
        )
        assert status == "Approved"
        assert allocated == volume

    def test_reduced_exceeds_cap(self):
        pop = 1000
        volume = pop * DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY + 5000  # over cap
        allocated, status, reason, rule = evaluate_domestic(
            volume, population=pop, reservoir_level=50.0, drought_mode=False
        )
        assert status == "Reduced"
        assert allocated == pop * DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY
        assert "135" in reason or "cap" in reason.lower()

    def test_domestic_approved_in_emergency(self):
        """Domestic must always be satisfied, even in emergency."""
        volume = 500 * DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY
        allocated, status, reason, rule = evaluate_domestic(
            volume, population=500, reservoir_level=10.0, drought_mode=False
        )
        assert status in ("Approved", "Reduced")
        assert allocated > 0

    def test_zero_volume_rejected(self):
        allocated, status, reason, rule = evaluate_domestic(
            0.0, population=1000, reservoir_level=50.0, drought_mode=False
        )
        assert status == "Rejected"
        assert allocated == 0.0

    def test_drought_mode_does_not_reduce_domestic(self):
        """Domestic is never reduced due to drought — it has highest priority."""
        volume = 100 * DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY
        allocated, status, reason, rule = evaluate_domestic(
            volume, population=100, reservoir_level=30.0, drought_mode=True
        )
        assert status == "Approved"
        assert allocated == volume


# ── Agricultural Tests ──────────────────────────────────────────────────────

class TestAgricultural:
    def test_approved_normal_conditions(self):
        volume = 100_000.0
        allocated, status, reason, rule = evaluate_agricultural(
            volume, population=1000, reservoir_level=60.0, drought_mode=False
        )
        assert status == "Approved"
        assert allocated == volume

    def test_rejected_emergency_reservoir(self):
        volume = 100_000.0
        allocated, status, reason, rule = evaluate_agricultural(
            volume, population=1000, reservoir_level=10.0, drought_mode=False
        )
        assert status == "Rejected"
        assert allocated == 0.0
        assert str(RESERVOIR_EMERGENCY_LEVEL) in reason or "emergency" in reason.lower()

    def test_reduced_drought_reservoir(self):
        volume = AGRICULTURAL_STATUTORY_CAP  # full cap
        allocated, status, reason, rule = evaluate_agricultural(
            volume, population=1000, reservoir_level=30.0, drought_mode=False
        )
        assert status == "Reduced"
        assert allocated == pytest.approx(AGRICULTURAL_STATUTORY_CAP * 0.70)

    def test_reduced_drought_mode_flag(self):
        volume = AGRICULTURAL_STATUTORY_CAP
        allocated, status, reason, rule = evaluate_agricultural(
            volume, population=1000, reservoir_level=60.0, drought_mode=True
        )
        assert status == "Reduced"
        assert allocated == pytest.approx(AGRICULTURAL_STATUTORY_CAP * 0.70)

    def test_approved_within_drought_cap(self):
        volume = AGRICULTURAL_STATUTORY_CAP * 0.50  # 50% — within drought cap of 70%
        allocated, status, reason, rule = evaluate_agricultural(
            volume, population=1000, reservoir_level=30.0, drought_mode=False
        )
        assert status == "Approved"
        assert allocated == volume

    def test_reduced_exceeds_statutory_cap_normal(self):
        volume = AGRICULTURAL_STATUTORY_CAP + 1_000_000
        allocated, status, reason, rule = evaluate_agricultural(
            volume, population=1000, reservoir_level=60.0, drought_mode=False
        )
        assert status == "Reduced"
        assert allocated == AGRICULTURAL_STATUTORY_CAP


# ── Industrial Tests ──────────────────────────────────────────────────────

class TestIndustrial:
    def test_approved_normal_conditions(self):
        volume = 500_000.0
        allocated, status, reason, rule = evaluate_industrial(
            volume, population=1000, reservoir_level=60.0, drought_mode=False
        )
        assert status == "Approved"
        assert allocated == volume

    def test_rejected_emergency_reservoir(self):
        volume = 500_000.0
        allocated, status, reason, rule = evaluate_industrial(
            volume, population=1000, reservoir_level=10.0, drought_mode=False
        )
        assert status == "Rejected"
        assert allocated == 0.0

    def test_deferred_drought_reservoir(self):
        volume = 500_000.0
        allocated, status, reason, rule = evaluate_industrial(
            volume, population=1000, reservoir_level=30.0, drought_mode=False
        )
        assert status == "Deferred"
        assert allocated == 0.0

    def test_deferred_drought_mode_flag(self):
        volume = 500_000.0
        allocated, status, reason, rule = evaluate_industrial(
            volume, population=1000, reservoir_level=60.0, drought_mode=True
        )
        assert status == "Deferred"
        assert allocated == 0.0

    def test_reduced_exceeds_statutory_cap(self):
        volume = INDUSTRIAL_STATUTORY_CAP + 1_000_000
        allocated, status, reason, rule = evaluate_industrial(
            volume, population=1000, reservoir_level=60.0, drought_mode=False
        )
        assert status == "Reduced"
        assert allocated == INDUSTRIAL_STATUTORY_CAP


# ── Priority Engine Integration Tests ──────────────────────────────────────

class TestPriorityEngine:
    def test_domestic_always_approved_emergency(self):
        """Domestic is satisfied even in emergency."""
        allocated, status, _, _ = evaluate_allocation(
            "R001", 1000, "Domestic", 100_000.0, "2024-Q1", 10.0, False
        )
        assert status in ("Approved", "Reduced")
        assert allocated > 0

    def test_agricultural_rejected_emergency(self):
        allocated, status, _, _ = evaluate_allocation(
            "R001", 1000, "Agricultural", 100_000.0, "2024-Q1", 10.0, False
        )
        assert status == "Rejected"
        assert allocated == 0.0

    def test_industrial_rejected_emergency(self):
        allocated, status, _, _ = evaluate_allocation(
            "R001", 1000, "Industrial", 500_000.0, "2024-Q1", 10.0, False
        )
        assert status == "Rejected"
        assert allocated == 0.0

    def test_industrial_deferred_drought(self):
        allocated, status, _, _ = evaluate_allocation(
            "R001", 1000, "Industrial", 500_000.0, "2024-Q1", 30.0, False
        )
        assert status == "Deferred"
        assert allocated == 0.0

    def test_invalid_sector_rejected(self):
        allocated, status, reason, rule = evaluate_allocation(
            "R001", 1000, "Residential", 100_000.0, "2024-Q1", 50.0, False
        )
        assert status == "Rejected"
        assert allocated == 0.0

    def test_priority_order_domestic_first(self):
        """
        Verify priority order: domestic approved, agricultural reduced in drought,
        industrial deferred in drought.
        """
        # All same reservoir at 30% (drought zone)
        dom_vol, dom_status, _, _ = evaluate_allocation(
            "R001", 1000, "Domestic", 100_000.0, "2024-Q1", 30.0, False
        )
        agr_vol, agr_status, _, _ = evaluate_allocation(
            "R002", 1000, "Agricultural", AGRICULTURAL_STATUTORY_CAP, "2024-Q1", 30.0, False
        )
        ind_vol, ind_status, _, _ = evaluate_allocation(
            "R003", 1000, "Industrial", 500_000.0, "2024-Q1", 30.0, False
        )

        # Domestic fully allocated
        assert dom_status in ("Approved", "Reduced")
        assert dom_vol > 0

        # Agricultural reduced
        assert agr_status == "Reduced"
        assert agr_vol == pytest.approx(AGRICULTURAL_STATUTORY_CAP * 0.70)

        # Industrial deferred
        assert ind_status == "Deferred"
        assert ind_vol == 0.0
