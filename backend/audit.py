"""
AquaGuard Audit Log System
---------------------------
Immutable audit trail for all allocation decisions.
Hash signature generated from decision payload.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models import AuditLog


def _generate_hash(payload: dict) -> str:
    """Generate SHA-256 hash of the decision payload for audit integrity."""
    canonical = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def create_audit_log(
    db: Session,
    region_id: str,
    allocation_cycle: str,
    input_data: dict,
    decision: str,
    rule_triggered: str,
) -> AuditLog:
    """Create an immutable audit log entry with hash signature."""
    log_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc)

    payload = {
        "log_id": log_id,
        "region_id": region_id,
        "allocation_cycle": allocation_cycle,
        "input_data": input_data,
        "decision": decision,
        "rule_triggered": rule_triggered,
        "timestamp": timestamp.isoformat(),
    }

    hash_signature = _generate_hash(payload)

    audit_log = AuditLog(
        log_id=log_id,
        region_id=region_id,
        allocation_cycle=allocation_cycle,
        input_data=input_data,
        decision=decision,
        rule_triggered=rule_triggered,
        timestamp=timestamp,
        hash_signature=hash_signature,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log
