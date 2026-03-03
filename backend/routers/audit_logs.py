from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import AuditLog
from schemas import AuditLogRecord

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])


@router.get("/", response_model=List[AuditLogRecord])
def list_audit_logs(
    region_id: Optional[str] = Query(None),
    allocation_cycle: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List immutable audit log entries with optional filters."""
    q = db.query(AuditLog)
    if region_id:
        q = q.filter(AuditLog.region_id == region_id)
    if allocation_cycle:
        q = q.filter(AuditLog.allocation_cycle == allocation_cycle)
    if decision:
        q = q.filter(AuditLog.decision == decision)
    return q.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()


@router.get("/{log_id}", response_model=AuditLogRecord)
def get_audit_log(log_id: str, db: Session = Depends(get_db)):
    """Get a specific audit log by log_id."""
    log = db.query(AuditLog).filter(AuditLog.log_id == log_id).first()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Audit log not found")
    return log
