import asyncio
from datetime import datetime
from typing import Optional

from app.database import AsyncSessionLocal
from app.services.projects import ProjectsService
from app.services.readings import ReadingsService
from app.services.thingspeak import thingspeak_service


class DataIngestionJob:
    """
    Background job that polls ThingSpeak for active projects
    and stores sensor readings in PostgreSQL.
    """
    
    def __init__(self):
        self.is_running = False
        self.last_run: Optional[datetime] = None
        self.last_entries: dict = {}  # Track last entry_id per project to avoid duplicates
    
    async def run(self):
        """
        Execute one polling cycle for all active projects.
        """
        if self.is_running:
            print("Data ingestion already running, skipping...")
            return
        
        self.is_running = True
        self.last_run = datetime.utcnow()
        
        try:
            async with AsyncSessionLocal() as db:
                # Get all active projects
                projects = await ProjectsService.get_active(db)
                
                for project in projects:
                    try:
                        await self._ingest_project(db, project)
                    except Exception as e:
                        print(f"Error ingesting project {project.id} ({project.name}): {e}")
                
        except Exception as e:
            print(f"Error in data ingestion job: {e}")
        finally:
            self.is_running = False
    
    async def _ingest_project(self, db, project):
        """
        Fetch and store latest readings for a single project.
        """
        # Get the field numbers we care about
        field_numbers = [sf.field_number for sf in project.sensor_fields]
        
        if not field_numbers:
            return  # No sensors configured
        
        # Fetch latest feed from ThingSpeak
        latest_feed = await thingspeak_service.get_latest_feed(
            project.thingspeak_channel_id,
            project.thingspeak_read_key,
        )
        
        if not latest_feed:
            return
        
        # Check if this is a new entry (avoid duplicates)
        entry_id = latest_feed.get("entry_id")
        if entry_id:
            last_entry = self.last_entries.get(project.id)
            if last_entry and entry_id == last_entry:
                return  # Already processed this entry
            self.last_entries[project.id] = entry_id
        
        # Parse timestamp
        timestamp_str = latest_feed.get("created_at")
        if timestamp_str:
            try:
                recorded_at = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            except ValueError:
                recorded_at = datetime.utcnow()
        else:
            recorded_at = datetime.utcnow()
        
        # Extract readings
        parsed = thingspeak_service.parse_feed_entry(latest_feed, field_numbers)
        readings = parsed.get("values", {})
        
        if readings:
            # Store in database
            await ReadingsService.store_readings(
                db,
                project.id,
                readings,
                recorded_at,
            )
            print(f"Stored {len(readings)} readings for project {project.name}")


# Singleton instance
data_ingestion_job = DataIngestionJob()


async def run_data_ingestion():
    """
    Wrapper function to be called by the scheduler.
    """
    await data_ingestion_job.run()

