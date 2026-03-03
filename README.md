# AquaGuard – Smart Water Allocation & Statutory Compliance Bot

A production-ready web application that enforces statutory water allocation laws using dataset-backed thresholds and strict legal priority rules.

> **IMPORTANT**: This system is NOT predictive. No AI/ML. No optimization. Strict rule-based statutory compliance engine only.

---

## System Rules

- Priority Order (Non-negotiable): **Domestic → Agricultural → Industrial**
- Domestic must always be satisfied first. No override allowed.
- All decisions are explainable and cite specific rules and thresholds.

---

## Tech Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS  |
| Backend  | Python FastAPI                  |
| Database | PostgreSQL 16                   |
| Deploy   | Docker Compose                  |

---

## Statutory Constants

| Parameter                     | Value          |
|-------------------------------|----------------|
| Domestic cap                  | 135 L/person/day |
| Reservoir Safe Level          | 40%            |
| Reservoir Emergency Level     | 25%            |
| Agricultural statutory cap    | 50,000,000 L/day |
| Industrial statutory cap      | 20,000,000 L/day |

---

## Priority Engine Rules

### Domestic Sector
- `RULE-DOM-001`: Zero/negative volume → Rejected
- `RULE-DOM-002`: Exceeds cap (population × 135 L) → Reduced to cap
- `RULE-DOM-003`: Within cap → Approved (always, even in emergency)

### Agricultural Sector
- `RULE-AGR-001`: Zero/negative volume → Rejected
- `RULE-AGR-002`: Reservoir < 25% → Rejected (hard stop)
- `RULE-AGR-003`: Reservoir < 40% or drought mode → Reduced to 70% of cap
- `RULE-AGR-004`: Exceeds statutory cap → Reduced
- `RULE-AGR-005`: Within cap, normal conditions → Approved

### Industrial Sector
- `RULE-IND-001`: Zero/negative volume → Rejected
- `RULE-IND-002`: Reservoir < 25% → Rejected (hard stop)
- `RULE-IND-003`: Reservoir < 40% or drought mode → Deferred
- `RULE-IND-004`: Exceeds statutory cap → Reduced
- `RULE-IND-005`: Within cap, normal conditions → Approved

---

## Decision States

Every allocation request returns one of:
- **Approved** – Full allocation granted within statutory limits
- **Reduced** – Partial allocation due to cap or drought rule
- **Deferred** – Allocation postponed (industrial in drought/emergency)
- **Rejected** – Hard stop (emergency level, duplicate, invalid data)

---

## Project Structure

```
aquaguard/
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── database.py           # SQLAlchemy engine + session
│   ├── models.py             # ORM models (regions, allocations, audit_logs)
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── priority_engine.py    # Statutory compliance engine (core logic)
│   ├── audit.py              # Immutable audit log with SHA-256 hash
│   ├── routers/
│   │   ├── allocations.py    # POST /api/allocations, GET /api/allocations
│   │   ├── audit_logs.py     # GET /api/audit-logs
│   │   └── reservoir.py      # GET /api/reservoir/status
│   ├── data/
│   │   └── crop_benchmarks.json
│   ├── tests/
│   │   └── test_priority_engine.py   # 22 pytest test cases
│   ├── init_db.sql           # PostgreSQL schema
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx                       # Root with tab navigation
│   │   ├── api/client.js                 # Axios API client
│   │   └── components/
│   │       ├── RequestForm.jsx           # Allocation request form
│   │       ├── AllocationResult.jsx      # Decision display
│   │       ├── AllocationHistory.jsx     # Results table
│   │       ├── ReservoirPanel.jsx        # Live reservoir simulator
│   │       ├── DroughtIndicator.jsx      # Status indicator
│   │       ├── AuditLogViewer.jsx        # Immutable log viewer
│   │       └── CycleSummary.jsx          # Cycle aggregation table
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Using Docker Compose (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/docs

### Manual Setup

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Set DATABASE_URL env variable
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## API Reference

### POST /api/allocations/
Submit a water allocation request.

```json
{
  "region_id": "REG-001",
  "population": 50000,
  "sector": "Domestic",
  "requested_volume": 6750000,
  "allocation_cycle": "2024-Q1",
  "reservoir_level": 35.5,
  "drought_mode": false
}
```

Response:
```json
{
  "region_id": "REG-001",
  "sector": "Domestic",
  "requested_volume": 6750000,
  "allocated_volume": 6750000,
  "status": "Approved",
  "reason": "Approved: Domestic allocation within statutory cap...",
  "rule_triggered": "RULE-DOM-003: Domestic priority — full allocation within cap approved"
}
```

### GET /api/allocations/
List all allocation records (supports filters: `region_id`, `allocation_cycle`, `sector`, `status`).

### GET /api/allocations/cycle-summary
Aggregated summary per allocation cycle.

### GET /api/audit-logs/
Immutable audit log entries (supports filters: `region_id`, `allocation_cycle`, `decision`).

### GET /api/reservoir/status?reservoir_level=35&drought_mode=false
Get reservoir status and active rules.

### GET /api/health
Health check + system configuration.

---

## Database Schema

| Table         | Purpose                                                    |
|---------------|------------------------------------------------------------|
| `allocations` | All allocation records with statutory decisions            |
| `audit_logs`  | Immutable audit trail with SHA-256 hash signatures         |
| `regions`     | Registered region identifiers                              |

Audit logs are protected by a PostgreSQL trigger that prevents UPDATE/DELETE.

---

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

22 tests covering all statutory rules and priority enforcement.

---

## Sample Test Cases

| Scenario | Sector | Reservoir | Drought | Expected |
|----------|--------|-----------|---------|----------|
| Normal domestic request within cap | Domestic | 60% | No | Approved |
| Domestic exceeds population cap | Domestic | 60% | No | Reduced |
| Agricultural in emergency | Agricultural | 10% | No | Rejected |
| Agricultural in drought zone | Agricultural | 30% | No | Reduced (70% cap) |
| Industrial in drought zone | Industrial | 30% | No | Deferred |
| Industrial in emergency | Industrial | 10% | No | Rejected |
| Drought mode active (normal reservoir) | Industrial | 60% | Yes | Deferred |
| Duplicate region-cycle | Any | Any | Any | 409 Rejected |