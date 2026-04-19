"""
Backfill historical data from ThingSpeak into PostgreSQL.

Run inside the backend container:
    python -m scripts.backfill_history --project-id 1 --days 365

Or for all data:
    python -m scripts.backfill_history --project-id 1 --all
"""

import asyncio
import argparse
from datetime import datetime, timedelta
from decimal import Decimal

from app.database import AsyncSessionLocal
from app.models import Project, SensorReading
from app.services.thingspeak import thingspeak_service
from sqlalchemy import select


async def get_project(db, project_id: int) -> Project:
    """Fetch project by ID."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise ValueError(f"Project {project_id} not found")
    return project


async def backfill_project(
    project_id: int,
    days: int = None,
    fetch_all: bool = False,
    batch_size: int = 8000
):
    """
    Backfill historical data for a project.
    
    Args:
        project_id: ID of the project to backfill
        days: Number of days of history to fetch (from now)
        fetch_all: If True, fetch all available data (ignores days)
        batch_size: Number of records per ThingSpeak request (max 8000)
    """
    async with AsyncSessionLocal() as db:
        # Get project
        project = await get_project(db, project_id)
        print(f"Backfilling project: {project.name}")
        print(f"  Channel ID: {project.thingspeak_channel_id}")
        
        # Get sensor field numbers
        field_numbers = [sf.field_number for sf in project.sensor_fields]
        if not field_numbers:
            print("  No sensor fields configured, skipping.")
            return
        
        print(f"  Fields: {field_numbers}")
        
        # Calculate time range
        end_time = datetime.utcnow()
        if fetch_all:
            start_time = None  # ThingSpeak will return from the beginning
            print("  Fetching ALL available data...")
        else:
            days = days or 365
            start_time = end_time - timedelta(days=days)
            print(f"  Fetching last {days} days...")
        
        # Fetch data from ThingSpeak
        print("  Fetching from ThingSpeak...")
        feeds = await thingspeak_service.get_feeds(
            project.thingspeak_channel_id,
            project.thingspeak_read_key,
            results=batch_size,
            start=start_time,
            end=end_time,
        )
        
        if not feeds:
            print("  No data returned from ThingSpeak.")
            return
        
        print(f"  Received {len(feeds)} feed entries")
        
        # Process and insert readings
        readings_count = 0
        skipped_count = 0
        
        for feed in feeds:
            # Parse timestamp
            timestamp_str = feed.get("created_at")
            if not timestamp_str:
                skipped_count += 1
                continue
            
            try:
                recorded_at = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            except ValueError:
                skipped_count += 1
                continue
            
            # Extract values for each field
            for field_num in field_numbers:
                field_key = f"field{field_num}"
                raw_value = feed.get(field_key)
                
                if raw_value is None:
                    continue
                
                try:
                    value = Decimal(str(float(raw_value)))
                except (ValueError, TypeError):
                    continue
                
                # Create reading
                reading = SensorReading(
                    project_id=project_id,
                    field_number=field_num,
                    value=value,
                    recorded_at=recorded_at,
                )
                db.add(reading)
                readings_count += 1
        
        # Commit all readings
        await db.commit()
        
        print(f"  ✓ Inserted {readings_count} readings")
        if skipped_count:
            print(f"  ⚠ Skipped {skipped_count} entries (invalid data)")
        
        # Show date range of imported data
        if feeds:
            first_ts = feeds[0].get("created_at", "unknown")
            last_ts = feeds[-1].get("created_at", "unknown")
            print(f"  Date range: {first_ts} to {last_ts}")


async def main():
    parser = argparse.ArgumentParser(description="Backfill ThingSpeak data to PostgreSQL")
    parser.add_argument("--project-id", type=int, required=True, help="Project ID to backfill")
    parser.add_argument("--days", type=int, default=365, help="Days of history (default: 365)")
    parser.add_argument("--all", action="store_true", help="Fetch all available data")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("ThingSpeak Historical Data Backfill")
    print("=" * 50)
    
    await backfill_project(
        project_id=args.project_id,
        days=args.days,
        fetch_all=args.all,
    )
    
    # Cleanup
    await thingspeak_service.close()
    
    print("=" * 50)
    print("Done!")


if __name__ == "__main__":
    asyncio.run(main())