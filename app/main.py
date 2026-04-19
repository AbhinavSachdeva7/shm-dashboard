from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import get_settings
from app.database import init_db
from app.routers import portal_router, admin_router
from app.jobs.data_ingestion import run_data_ingestion
from app.services.thingspeak import thingspeak_service

settings = get_settings()

# APScheduler instance
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Startup: Initialize database, start scheduler
    Shutdown: Stop scheduler, cleanup
    """
    # Startup
    print("Starting SHM Dashboard Backend...")
    
    # # Initialize database tables
    await init_db()
    print("Database initialized")
    
    # Start the data ingestion scheduler
    scheduler.add_job(
        run_data_ingestion,
        trigger=IntervalTrigger(seconds=settings.data_ingestion_interval_seconds),
        id="data_ingestion",
        name="ThingSpeak Data Ingestion",
        replace_existing=True,
    )
    scheduler.start()
    print(f"Scheduler started (interval: {settings.data_ingestion_interval_seconds}s)")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    scheduler.shutdown(wait=False)
    await thingspeak_service.close()
    print("Cleanup complete")


# Create FastAPI app
app = FastAPI(
    title="SHM Dashboard API",
    description="Backend API for Structural Health Monitoring dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(portal_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "SHM Dashboard API",
        "version": "1.0.0",
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "scheduler_running": scheduler.running,
        "jobs": [
            {
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else None,
            }
            for job in scheduler.get_jobs()
        ],
    }

