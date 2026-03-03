from typing import Optional, Literal
from pydantic import BaseModel, field_validator, model_validator
from datetime import datetime


ALLOWED_SECTORS = ["Domestic", "Agricultural", "Industrial"]


class AllocationRequest(BaseModel):
    region_id: str
    population: int
    sector: Literal["Domestic", "Agricultural", "Industrial"]
    requested_volume: float
    allocation_cycle: str
    reservoir_level: float
    drought_mode: bool

    @field_validator("region_id", "allocation_cycle")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be empty")
        return v.strip()

    @field_validator("population")
    @classmethod
    def positive_population(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Population must not be negative")
        return v

    @field_validator("requested_volume")
    @classmethod
    def positive_volume(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Requested volume must not be negative")
        return v

    @field_validator("reservoir_level")
    @classmethod
    def valid_reservoir_level(cls, v: float) -> float:
        if v < 0 or v > 100:
            raise ValueError("Reservoir level must be between 0 and 100")
        return v


class AllocationResponse(BaseModel):
    region_id: str
    sector: str
    requested_volume: float
    allocated_volume: float
    status: Literal["Approved", "Reduced", "Deferred", "Rejected"]
    reason: str
    rule_triggered: str


class AllocationRecord(AllocationResponse):
    id: int
    allocation_cycle: str
    population: Optional[int]
    reservoir_level: float
    drought_mode: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogRecord(BaseModel):
    id: int
    log_id: str
    region_id: str
    allocation_cycle: str
    input_data: dict
    decision: str
    rule_triggered: str
    timestamp: datetime
    hash_signature: str

    class Config:
        from_attributes = True


class CycleSummary(BaseModel):
    allocation_cycle: str
    total_regions: int
    total_requested: float
    total_allocated: float
    approved_count: int
    reduced_count: int
    deferred_count: int
    rejected_count: int
