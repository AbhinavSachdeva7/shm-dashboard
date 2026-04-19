from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

from app.models import Project, SensorField, SensorReading


class ReadingsService:
    """Service for managing sensor readings."""
    
    @staticmethod
    async def store_readings(
        db: AsyncSession,
        project_id: int,
        readings: Dict[int, float],
        recorded_at: datetime
    ) -> List[SensorReading]:
        """
        Store sensor readings in the database.
        
        Args:
            db: Database session
            project_id: Project ID
            readings: Dict of field_number -> value
            recorded_at: Timestamp from ThingSpeak
        
        Returns list of created SensorReading objects.
        """
        created_readings = []
        
        for field_number, value in readings.items():
            if value is not None:
                reading = SensorReading(
                    project_id=project_id,
                    field_number=field_number,
                    value=Decimal(str(value)),
                    recorded_at=recorded_at,
                )
                db.add(reading)
                created_readings.append(reading)
        
        await db.commit()
        return created_readings
    
    @staticmethod
    async def get_latest_reading(
        db: AsyncSession,
        project_id: int,
        field_number: int
    ) -> Optional[SensorReading]:
        """Get the most recent reading for a sensor field."""
        result = await db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.project_id == project_id,
                    SensorReading.field_number == field_number
                )
            )
            .order_by(SensorReading.recorded_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_history(
        db: AsyncSession,
        project_id: int,
        field_number: int,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        limit: int = 1000
    ) -> List[SensorReading]:
        """
        Get historical readings for a sensor field.
        
        Args:
            db: Database session
            project_id: Project ID
            field_number: Sensor field number
            start_time: Start of time range
            end_time: End of time range (defaults to now)
            limit: Maximum number of readings to return
        
        Returns list of SensorReading objects.
        """
        if end_time is None:
            end_time = datetime.utcnow()
        
        result = await db.execute(
            select(SensorReading)
            .where(
                and_(
                    SensorReading.project_id == project_id,
                    SensorReading.field_number == field_number,
                    SensorReading.recorded_at >= start_time,
                    SensorReading.recorded_at <= end_time
                )
            )
            .order_by(SensorReading.recorded_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_all_latest_readings(
        db: AsyncSession,
        project_id: int,
        field_numbers: List[int]
    ) -> Dict[int, SensorReading]:
        """
        Get the latest reading for each sensor field.
        
        Returns dict of field_number -> SensorReading.
        """
        readings = {}
        
        for field_num in field_numbers:
            reading = await ReadingsService.get_latest_reading(
                db, project_id, field_num
            )
            if reading:
                readings[field_num] = reading
        
        return readings
    
    @staticmethod
    async def get_total_readings_count(db: AsyncSession) -> int:
        """Get total count of all readings in the database."""
        result = await db.execute(
            select(func.count(SensorReading.id))
        )
        return result.scalar() or 0
    
    @staticmethod
    async def delete_old_readings(
        db: AsyncSession,
        project_id: int,
        older_than: datetime
    ) -> int:
        """
        Delete readings older than a specified date.
        
        Returns number of deleted readings.
        """
        from sqlalchemy import delete
        
        result = await db.execute(
            delete(SensorReading)
            .where(
                and_(
                    SensorReading.project_id == project_id,
                    SensorReading.recorded_at < older_than
                )
            )
        )
        await db.commit()
        return result.rowcount
    
    @staticmethod
    def calculate_status(
        value: Optional[float],
        min_threshold: Optional[float],
        max_threshold: Optional[float]
    ) -> str:
        """
        Calculate the status based on value and thresholds.
        
        Returns: "normal", "warning", "critical", or "unknown"
        """
        if value is None:
            return "unknown"
        
        if min_threshold is not None and max_threshold is not None:
            # Both thresholds defined
            range_size = max_threshold - min_threshold
            warning_margin = range_size * 0.1  # 10% margin for warning
            
            if value < min_threshold or value > max_threshold:
                return "critical"
            elif value < (min_threshold + warning_margin) or value > (max_threshold - warning_margin):
                return "warning"
            else:
                return "normal"
        elif min_threshold is not None:
            # Only min threshold
            if value < min_threshold:
                return "critical"
            elif value < (min_threshold * 1.1):
                return "warning"
            else:
                return "normal"
        elif max_threshold is not None:
            # Only max threshold
            if value > max_threshold:
                return "critical"
            elif value > (max_threshold * 0.9):
                return "warning"
            else:
                return "normal"
        else:
            # No thresholds defined
            return "normal"

