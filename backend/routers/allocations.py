from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from database import get_db
from models import Allocation, AuditLog
from schemas import AllocationRequest, AllocationResponse, AllocationRecord, CycleSummary
from priority_engine import evaluate_allocation
from audit import create_audit_log

router = APIRouter(prefix="/allocations", tags=["allocations"])


@router.post("/", response_model=AllocationResponse, status_code=201)
def request_allocation(payload: AllocationRequest, db: Session = Depends(get_db)):
    """
    Submit a water allocation request.
    Applies statutory priority rules: Domestic > Agricultural > Industrial.
    Blocks duplicate region-cycle requests.
    """
    # Check for duplicate region-cycle
    existing = (
        db.query(Allocation)
        .filter(
            Allocation.region_id == payload.region_id,
            Allocation.allocation_cycle == payload.allocation_cycle,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Duplicate allocation rejected. Region '{payload.region_id}' already has an "
                f"allocation for cycle '{payload.allocation_cycle}'. "
                f"Rule: RULE-SYS-002: Duplicate region-cycle allocation blocked."
            ),
        )

    # Run priority engine
    allocated_volume, status, reason, rule_triggered = evaluate_allocation(
        region_id=payload.region_id,
        population=payload.population,
        sector=payload.sector,
        requested_volume=payload.requested_volume,
        allocation_cycle=payload.allocation_cycle,
        reservoir_level=payload.reservoir_level,
        drought_mode=payload.drought_mode,
    )

    # Persist allocation record
    allocation = Allocation(
        region_id=payload.region_id,
        allocation_cycle=payload.allocation_cycle,
        sector=payload.sector,
        population=payload.population,
        requested_volume=payload.requested_volume,
        allocated_volume=allocated_volume,
        reservoir_level=payload.reservoir_level,
        drought_mode=payload.drought_mode,
        status=status,
        reason=reason,
        rule_triggered=rule_triggered,
    )
    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    # Write immutable audit log
    create_audit_log(
        db=db,
        region_id=payload.region_id,
        allocation_cycle=payload.allocation_cycle,
        input_data=payload.model_dump(),
        decision=status,
        rule_triggered=rule_triggered,
    )

    return AllocationResponse(
        region_id=payload.region_id,
        sector=payload.sector,
        requested_volume=payload.requested_volume,
        allocated_volume=allocated_volume,
        status=status,
        reason=reason,
        rule_triggered=rule_triggered,
    )


@router.get("/", response_model=List[AllocationRecord])
def list_allocations(
    region_id: Optional[str] = Query(None),
    allocation_cycle: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all allocation records with optional filters."""
    q = db.query(Allocation)
    if region_id:
        q = q.filter(Allocation.region_id == region_id)
    if allocation_cycle:
        q = q.filter(Allocation.allocation_cycle == allocation_cycle)
    if sector:
        q = q.filter(Allocation.sector == sector)
    if status:
        q = q.filter(Allocation.status == status)
    return q.order_by(Allocation.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/cycle-summary", response_model=List[CycleSummary])
def cycle_summary(db: Session = Depends(get_db)):
    """Aggregated summary per allocation cycle using a single GROUP BY query."""
    rows = (
        db.query(
            Allocation.allocation_cycle,
            func.count(Allocation.id).label("total_regions"),
            func.sum(Allocation.requested_volume).label("total_requested"),
            func.sum(Allocation.allocated_volume).label("total_allocated"),
            func.sum(case((Allocation.status == "Approved", 1), else_=0)).label("approved_count"),
            func.sum(case((Allocation.status == "Reduced", 1), else_=0)).label("reduced_count"),
            func.sum(case((Allocation.status == "Deferred", 1), else_=0)).label("deferred_count"),
            func.sum(case((Allocation.status == "Rejected", 1), else_=0)).label("rejected_count"),
        )
        .group_by(Allocation.allocation_cycle)
        .order_by(Allocation.allocation_cycle)
        .all()
    )

    return [
        CycleSummary(
            allocation_cycle=row.allocation_cycle,
            total_regions=row.total_regions,
            total_requested=row.total_requested or 0.0,
            total_allocated=row.total_allocated or 0.0,
            approved_count=row.approved_count or 0,
            reduced_count=row.reduced_count or 0,
            deferred_count=row.deferred_count or 0,
            rejected_count=row.rejected_count or 0,
        )
        for row in rows
    ]


@router.get("/{allocation_id}", response_model=AllocationRecord)
def get_allocation(allocation_id: int, db: Session = Depends(get_db)):
    """Get a specific allocation by ID."""
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return allocation
