from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Allocation
from priority_engine import RESERVOIR_SAFE_LEVEL, RESERVOIR_EMERGENCY_LEVEL

router = APIRouter(prefix="/reservoir", tags=["reservoir"])


@router.get("/status")
def reservoir_status(
    reservoir_level: float = Query(..., ge=0, le=100),
    drought_mode: bool = Query(False),
):
    """
    Get the current reservoir status classification.
    Returns status, color coding, and applicable rules.
    """
    if reservoir_level < RESERVOIR_EMERGENCY_LEVEL:
        status = "emergency"
        color = "red"
        rules = [
            f"Reservoir below emergency threshold ({RESERVOIR_EMERGENCY_LEVEL}%)",
            "Hard stop: Industrial allocations BLOCKED",
            "Hard stop: Agricultural allocations BLOCKED",
            "Domestic survival minimum PROTECTED",
        ]
    elif reservoir_level < RESERVOIR_SAFE_LEVEL:
        status = "drought"
        color = "orange"
        rules = [
            f"Reservoir below safe level ({RESERVOIR_SAFE_LEVEL}%)",
            "Drought rules apply: Agricultural reduced to 70% of cap",
            "Industrial allocations DEFERRED",
            "Domestic fully protected",
        ]
    else:
        status = "normal"
        color = "blue"
        rules = [
            f"Reservoir above safe level ({RESERVOIR_SAFE_LEVEL}%)",
            "All sectors eligible for allocation",
            "Standard statutory caps apply",
        ]

    if drought_mode and status == "normal":
        status = "drought"
        color = "orange"
        rules = [
            "Drought mode manually activated",
            "Drought rules apply: Agricultural reduced to 70% of cap",
            "Industrial allocations DEFERRED",
            "Domestic fully protected",
        ]

    return {
        "reservoir_level": reservoir_level,
        "status": status,
        "color": color,
        "drought_mode": drought_mode,
        "safe_level_threshold": RESERVOIR_SAFE_LEVEL,
        "emergency_level_threshold": RESERVOIR_EMERGENCY_LEVEL,
        "active_rules": rules,
    }
