"""
CIRO Lahore — FastAPI Application Entry Point

Crisis Intelligence & Response Orchestrator
Lahore Urban Emergency Management System

Startup sequence:
  1. Create all SQLAlchemy tables (idempotent).
  2. Seed Zones Z01–Z12 to CLEAR state (idempotent).
  3. Mount all API routers under /api/v1/.
  4. Register global exception handlers.
"""
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import engine, Base
from app.database.seed import seed_zones

# Route modules
from app.routes import (
    system_routes,
    workflow_routes,
    crisis_routes,
    response_routes,
    action_routes,
    zone_routes,
    log_routes,
)


# ── Startup / Shutdown lifecycle ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed zones before the first request is served."""
    Base.metadata.create_all(bind=engine)
    seed_zones()
    print("[CIRO] Database ready. Zones seeded. API live.")
    yield
    print("[CIRO] Shutting down.")


# ── Application factory ──────────────────────────────────────────────────────

app = FastAPI(
    title="CIRO Lahore — Crisis Intelligence & Response Orchestrator",
    description=(
        "Production-grade backend for multimodal urban emergency management. "
        "Processes Roman Urdu complaints, weather, and traffic telemetry through "
        "a deterministic three-agent pipeline (Crisis Detector → Response Planner → "
        "Action Executor) with full observability and zero hallucinations."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handlers ─────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler. Prevents 500 stacks leaking to the client.
    Returns a structured JSON error with timestamp.
    """
    return JSONResponse(
        status_code=500,
        content={
            "error":     "INTERNAL_SERVER_ERROR",
            "detail":    str(exc),
            "path":      str(request.url),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=422,
        content={
            "error":     "VALIDATION_ERROR",
            "detail":    str(exc),
            "path":      str(request.url),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


# ── Route Registration ────────────────────────────────────────────────────────

app.include_router(system_routes.router)
app.include_router(workflow_routes.router)
app.include_router(crisis_routes.router)
app.include_router(response_routes.router)
app.include_router(action_routes.router)
app.include_router(zone_routes.router)
app.include_router(log_routes.router)


# ── Root health probe ─────────────────────────────────────────────────────────

@app.get("/", tags=["Health"], summary="Root health check")
def root():
    return {
        "service":   "CIRO Lahore",
        "status":    "operational",
        "version":   "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "docs":      "/docs",
    }


@app.get("/health", tags=["Health"], summary="Liveness probe")
def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
