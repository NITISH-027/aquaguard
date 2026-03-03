from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base


class Region(Base):
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(String(100), nullable=False)
    allocation_cycle = Column(String(100), nullable=False)
    sector = Column(String(50), nullable=False)
    population = Column(Integer, nullable=True)
    requested_volume = Column(Float, nullable=False)
    allocated_volume = Column(Float, nullable=False)
    reservoir_level = Column(Float, nullable=False)
    drought_mode = Column(Boolean, nullable=False, default=False)
    status = Column(String(50), nullable=False)
    reason = Column(Text, nullable=False)
    rule_triggered = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(String(100), unique=True, nullable=False)
    region_id = Column(String(100), nullable=False)
    allocation_cycle = Column(String(100), nullable=False)
    input_data = Column(JSONB, nullable=False)
    decision = Column(String(50), nullable=False)
    rule_triggered = Column(String(200), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    hash_signature = Column(String(64), nullable=False)
