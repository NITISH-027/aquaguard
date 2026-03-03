-- AquaGuard PostgreSQL Schema
-- Run this script to initialize the database

CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    region_id VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allocations (
    id SERIAL PRIMARY KEY,
    region_id VARCHAR(100) NOT NULL,
    allocation_cycle VARCHAR(100) NOT NULL,
    sector VARCHAR(50) NOT NULL,
    population INTEGER,
    requested_volume FLOAT NOT NULL,
    allocated_volume FLOAT NOT NULL,
    reservoir_level FLOAT NOT NULL,
    drought_mode BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    rule_triggered VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(region_id, allocation_cycle),
    CONSTRAINT valid_sector CHECK (sector IN ('Domestic', 'Agricultural', 'Industrial')),
    CONSTRAINT valid_status CHECK (status IN ('Approved', 'Reduced', 'Deferred', 'Rejected'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    log_id VARCHAR(100) UNIQUE NOT NULL,
    region_id VARCHAR(100) NOT NULL,
    allocation_cycle VARCHAR(100) NOT NULL,
    input_data JSONB NOT NULL,
    decision VARCHAR(50) NOT NULL,
    rule_triggered VARCHAR(200) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    hash_signature VARCHAR(64) NOT NULL
);

-- Prevent modification of audit logs via trigger
CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_immutable ON audit_logs;
CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_update();

CREATE INDEX IF NOT EXISTS idx_allocations_region_cycle ON allocations(region_id, allocation_cycle);
CREATE INDEX IF NOT EXISTS idx_audit_logs_region ON audit_logs(region_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_cycle ON audit_logs(allocation_cycle);
