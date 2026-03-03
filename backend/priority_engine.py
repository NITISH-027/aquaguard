"""
AquaGuard Priority Engine
--------------------------
Statutory water allocation engine implementing strict rule-based compliance.

Priority Order (Non-negotiable): Domestic > Agricultural > Industrial
No AI/ML, no prediction, no optimization. Pure rule-based decisions.
"""

import json
import os
from typing import Tuple

# ── Statutory constants ──────────────────────────────────────────────────────
DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY = 135.0   # Statutory benchmark
RESERVOIR_SAFE_LEVEL = 40.0        # % — normal operations
RESERVOIR_EMERGENCY_LEVEL = 25.0   # % — hard stop for non-domestic

# Load sector benchmarks from dataset
_DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "crop_benchmarks.json")
with open(_DATA_FILE) as f:
    _BENCHMARKS = json.load(f)

AGRICULTURAL_STATUTORY_CAP = _BENCHMARKS["agricultural_statutory_cap_liters_per_day"]
INDUSTRIAL_STATUTORY_CAP = _BENCHMARKS["industrial_statutory_cap_liters_per_day"]
INDUSTRIAL_BENCHMARK_PER_UNIT = _BENCHMARKS["industrial_benchmark_per_unit_liters_per_day"]


def _reservoir_status(reservoir_level: float) -> str:
    if reservoir_level < RESERVOIR_EMERGENCY_LEVEL:
        return "emergency"
    if reservoir_level < RESERVOIR_SAFE_LEVEL:
        return "drought"
    return "normal"


def evaluate_domestic(
    requested_volume: float,
    population: int,
    reservoir_level: float,
    drought_mode: bool,
) -> Tuple[float, str, str, str]:
    """
    Domestic sector allocation.
    Cap = population × 135 L/person/day.
    Domestic is ALWAYS satisfied first. No reduction below survival minimum.
    Returns: (allocated_volume, status, reason, rule_triggered)
    """
    res_status = _reservoir_status(reservoir_level)
    statutory_cap = population * DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY

    if requested_volume <= 0:
        return (
            0.0,
            "Rejected",
            "Rejected: Requested volume is zero or negative. No allocation made.",
            "RULE-DOM-001: Zero/negative volume request rejected",
        )

    if requested_volume > statutory_cap:
        allocated = statutory_cap
        reason = (
            f"Reduced: Requested volume ({requested_volume:,.0f} L) exceeds statutory domestic cap "
            f"({statutory_cap:,.0f} L = {population} persons × {DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY} L/person/day). "
            f"Allocation capped at statutory maximum. Reservoir at {reservoir_level:.1f}% ({res_status.upper()})."
        )
        rule = f"RULE-DOM-002: Domestic cap enforced at {DOMESTIC_MAX_LITERS_PER_CAPITA_PER_DAY} L/person/day"
        return allocated, "Reduced", reason, rule

    # Domestic always approved regardless of reservoir status (survival priority)
    reason = (
        f"Approved: Domestic allocation within statutory cap "
        f"({requested_volume:,.0f} L ≤ {statutory_cap:,.0f} L). "
        f"Reservoir at {reservoir_level:.1f}% ({res_status.upper()}). "
        f"Priority Rule: Domestic sector has highest statutory priority."
    )
    rule = "RULE-DOM-003: Domestic priority — full allocation within cap approved"
    return requested_volume, "Approved", reason, rule


def evaluate_agricultural(
    requested_volume: float,
    population: int,
    reservoir_level: float,
    drought_mode: bool,
) -> Tuple[float, str, str, str]:
    """
    Agricultural sector allocation.
    Rules applied in order:
      1. Reservoir < emergency → Rejected (hard stop)
      2. Reservoir in drought zone OR drought_mode → 70% of statutory cap
      3. Requested > statutory cap → Reduced to cap
      4. Otherwise Approved
    Returns: (allocated_volume, status, reason, rule_triggered)
    """
    res_status = _reservoir_status(reservoir_level)

    if requested_volume <= 0:
        return (
            0.0,
            "Rejected",
            "Rejected: Requested volume is zero or negative.",
            "RULE-AGR-001: Zero/negative volume request rejected",
        )

    # Hard stop — emergency level
    if res_status == "emergency":
        return (
            0.0,
            "Rejected",
            (
                f"Rejected: Hard stop triggered. Reservoir at {reservoir_level:.1f}% "
                f"(below emergency threshold of {RESERVOIR_EMERGENCY_LEVEL}%). "
                f"Agricultural allocation blocked to protect domestic survival minimum. "
                f"Priority Rule: Domestic sector enforced."
            ),
            f"RULE-AGR-002: Reservoir below emergency threshold ({RESERVOIR_EMERGENCY_LEVEL}%) — agricultural blocked",
        )

    # Drought rules apply
    if res_status == "drought" or drought_mode:
        drought_cap = AGRICULTURAL_STATUTORY_CAP * 0.70
        if requested_volume > drought_cap:
            allocated = drought_cap
            trigger_reason = "drought_mode=True" if drought_mode else f"reservoir {reservoir_level:.1f}% < {RESERVOIR_SAFE_LEVEL}% safe limit"
            reason = (
                f"Reduced: Drought rule applied ({trigger_reason}). "
                f"Agricultural allocation capped at 70% of statutory maximum "
                f"({drought_cap:,.0f} L). "
                f"Reservoir at {reservoir_level:.1f}% ({res_status.upper()}). "
                f"Statutory cap: {AGRICULTURAL_STATUTORY_CAP:,.0f} L/day."
            )
            rule = f"RULE-AGR-003: Drought mode — agricultural reduced to 70% of statutory cap ({drought_cap:,.0f} L)"
            return allocated, "Reduced", reason, rule
        else:
            trigger_reason = "drought_mode=True" if drought_mode else f"reservoir {reservoir_level:.1f}% < {RESERVOIR_SAFE_LEVEL}% safe limit"
            reason = (
                f"Approved with drought conditions ({trigger_reason}). "
                f"Requested volume ({requested_volume:,.0f} L) within drought-adjusted cap "
                f"({drought_cap:,.0f} L = 70% of {AGRICULTURAL_STATUTORY_CAP:,.0f} L). "
                f"Reservoir at {reservoir_level:.1f}% ({res_status.upper()})."
            )
            rule = f"RULE-AGR-003: Drought mode — within reduced cap ({drought_cap:,.0f} L)"
            return requested_volume, "Approved", reason, rule

    # Normal conditions
    if requested_volume > AGRICULTURAL_STATUTORY_CAP:
        reason = (
            f"Reduced: Requested volume ({requested_volume:,.0f} L) exceeds agricultural statutory cap "
            f"({AGRICULTURAL_STATUTORY_CAP:,.0f} L/day). "
            f"Reservoir at {reservoir_level:.1f}% (NORMAL). Allocation capped at statutory maximum."
        )
        rule = f"RULE-AGR-004: Agricultural statutory cap enforced ({AGRICULTURAL_STATUTORY_CAP:,.0f} L/day)"
        return AGRICULTURAL_STATUTORY_CAP, "Reduced", reason, rule

    reason = (
        f"Approved: Agricultural allocation within statutory cap "
        f"({requested_volume:,.0f} L ≤ {AGRICULTURAL_STATUTORY_CAP:,.0f} L). "
        f"Reservoir at {reservoir_level:.1f}% (NORMAL). "
        f"Priority Rule: Agricultural sector — second priority after Domestic."
    )
    rule = "RULE-AGR-005: Agricultural full allocation approved within statutory cap"
    return requested_volume, "Approved", reason, rule


def evaluate_industrial(
    requested_volume: float,
    population: int,
    reservoir_level: float,
    drought_mode: bool,
) -> Tuple[float, str, str, str]:
    """
    Industrial sector allocation.
    Rules applied in order:
      1. Reservoir < emergency → Rejected (hard stop)
      2. Reservoir in drought zone OR drought_mode → Deferred
      3. Requested > statutory cap → Reduced to cap
      4. Otherwise Approved
    Returns: (allocated_volume, status, reason, rule_triggered)
    """
    res_status = _reservoir_status(reservoir_level)

    if requested_volume <= 0:
        return (
            0.0,
            "Rejected",
            "Rejected: Requested volume is zero or negative.",
            "RULE-IND-001: Zero/negative volume request rejected",
        )

    # Hard stop — emergency level
    if res_status == "emergency":
        return (
            0.0,
            "Rejected",
            (
                f"Rejected: Hard stop triggered. Reservoir at {reservoir_level:.1f}% "
                f"(below emergency threshold of {RESERVOIR_EMERGENCY_LEVEL}%). "
                f"Industrial allocation is blocked. "
                f"Priority Rule: Domestic > Agricultural > Industrial. "
                f"Non-domestic sectors suspended at emergency level."
            ),
            f"RULE-IND-002: Reservoir below emergency threshold ({RESERVOIR_EMERGENCY_LEVEL}%) — industrial blocked",
        )

    # Drought zone — industrial deferred
    if res_status == "drought" or drought_mode:
        trigger_reason = "drought_mode=True" if drought_mode else f"reservoir {reservoir_level:.1f}% < {RESERVOIR_SAFE_LEVEL}% safe limit"
        return (
            0.0,
            "Deferred",
            (
                f"Deferred: Drought conditions active ({trigger_reason}). "
                f"Industrial allocation deferred per statutory drought protocol. "
                f"Reservoir at {reservoir_level:.1f}% ({res_status.upper()}). "
                f"Priority Rule: Industrial sector has lowest priority — deferred until reservoir recovers above {RESERVOIR_SAFE_LEVEL}%."
            ),
            f"RULE-IND-003: Drought mode — industrial deferred (reservoir {reservoir_level:.1f}%)",
        )

    # Normal — apply statutory cap
    if requested_volume > INDUSTRIAL_STATUTORY_CAP:
        reason = (
            f"Reduced: Requested volume ({requested_volume:,.0f} L) exceeds industrial statutory cap "
            f"({INDUSTRIAL_STATUTORY_CAP:,.0f} L/day). "
            f"Reservoir at {reservoir_level:.1f}% (NORMAL). Allocation capped at statutory maximum."
        )
        rule = f"RULE-IND-004: Industrial statutory cap enforced ({INDUSTRIAL_STATUTORY_CAP:,.0f} L/day)"
        return INDUSTRIAL_STATUTORY_CAP, "Reduced", reason, rule

    reason = (
        f"Approved: Industrial allocation within statutory cap "
        f"({requested_volume:,.0f} L ≤ {INDUSTRIAL_STATUTORY_CAP:,.0f} L). "
        f"Reservoir at {reservoir_level:.1f}% (NORMAL). "
        f"Priority Rule: Industrial sector — third priority, approved after Domestic and Agricultural satisfied."
    )
    rule = "RULE-IND-005: Industrial full allocation approved within statutory cap"
    return requested_volume, "Approved", reason, rule


def evaluate_allocation(
    region_id: str,
    population: int,
    sector: str,
    requested_volume: float,
    allocation_cycle: str,
    reservoir_level: float,
    drought_mode: bool,
) -> Tuple[float, str, str, str]:
    """
    Main entry point for the priority engine.
    Dispatches to sector-specific evaluator.
    Returns: (allocated_volume, status, reason, rule_triggered)
    """
    if sector == "Domestic":
        return evaluate_domestic(requested_volume, population, reservoir_level, drought_mode)
    elif sector == "Agricultural":
        return evaluate_agricultural(requested_volume, population, reservoir_level, drought_mode)
    elif sector == "Industrial":
        return evaluate_industrial(requested_volume, population, reservoir_level, drought_mode)
    else:
        return (
            0.0,
            "Rejected",
            f"Rejected: Unknown sector '{sector}'. Allowed sectors: Domestic, Agricultural, Industrial.",
            "RULE-SYS-001: Invalid sector rejected",
        )
