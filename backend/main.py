"""
AquaGuard – Smart Water Allocation & Statutory Compliance Bot
FastAPI Backend Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import allocations, audit_logs, reservoir

app = FastAPI(
    title="AquaGuard API",
    description=(
        "Smart Water Allocation & Statutory Compliance Bot. "
        "Enforces statutory water allocation laws using strict rule-based priority engine. "
        "Priority: Domestic > Agricultural > Industrial. No AI/ML, no prediction."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(allocations.router, prefix="/api")
app.include_router(audit_logs.router, prefix="/api")
app.include_router(reservoir.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Initialize database schema on startup."""
    try:
        init_db()
    except Exception as e:
        print(f"[WARNING] DB init skipped: {e}")


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "AquaGuard Statutory Compliance Engine",
        "version": "1.0.0",
        "rules": {
            "priority_order": ["Domestic", "Agricultural", "Industrial"],
            "safe_reservoir_level": "40%",
            "emergency_reservoir_level": "25%",
            "domestic_cap": "135 L/person/day",
            "ai_ml": False,
            "predictive": False,
        },
    }
