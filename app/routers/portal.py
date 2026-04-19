from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import SensorReading as SensorReadingModel
from app.services.access_codes import AccessCodesService
from app.services.readings import ReadingsService
from app.services.thingspeak import thingspeak_service
from app.schemas.portal import (
    AccessCodeValidation,
    ProjectInfo,
    SensorInfo,
    CurrentReadingsResponse,
    SensorReading,
    ThresholdInfo,
    HistoryResponse,
    HistoryDataPoint,
    StatusResponse,
    SensorStatus,
)

router = APIRouter(prefix="/api/portal", tags=["Portal"])


@router.get("/{code}", response_model=AccessCodeValidation)
async def validate_access_code(
    code: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate an access code and return project information.
    
    This endpoint is used when a user accesses a shareable link.
    """
    is_valid, access_code, message = await AccessCodesService.validate_code(db, code)
    
    if not is_valid:
        return AccessCodeValidation(valid=False, message=message)
    
    # Record access
    await AccessCodesService.record_access(
        db,
        access_code,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    
    # Build project info
    project = access_code.project
    sensors = [
        SensorInfo(
            field=sf.field_number,
            name=sf.name,
            unit=sf.unit,
        )
        for sf in project.sensor_fields
    ]
    
    return AccessCodeValidation(
        valid=True,
        project=ProjectInfo(
            name=project.name,
            location=project.location,
            description=project.description,
            sensors=sensors,
        ),
    )


@router.get("/{code}/current", response_model=CurrentReadingsResponse)
async def get_current_readings(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current (real-time) sensor readings from ThingSpeak.
    """
    # Validate code
    is_valid, access_code, message = await AccessCodesService.validate_code(db, code)
    if not is_valid:
        raise HTTPException(status_code=404, detail=message)
    
    project = access_code.project
    
    # Fetch latest data from ThingSpeak
    latest_feed = await thingspeak_service.get_latest_feed(
        project.thingspeak_channel_id,
        project.thingspeak_read_key,
    )
    
    readings = []
    timestamp = None
    
    if latest_feed:
        # Parse timestamp
        timestamp_str = latest_feed.get("created_at")
        if timestamp_str:
            try:
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            except ValueError:
                timestamp = datetime.utcnow()
        
        # Get field values
        for sensor_field in project.sensor_fields:
            field_key = f"field{sensor_field.field_number}"
            raw_value = latest_feed.get(field_key)
            
            value = None
            if raw_value is not None:
                try:
                    value = float(raw_value)
                except (ValueError, TypeError):
                    value = None
            
            # Calculate status
            min_thresh = float(sensor_field.min_threshold) if sensor_field.min_threshold else None
            max_thresh = float(sensor_field.max_threshold) if sensor_field.max_threshold else None
            status = ReadingsService.calculate_status(value, min_thresh, max_thresh)
            
            readings.append(SensorReading(
                field=sensor_field.field_number,
                name=sensor_field.name,
                value=value,
                unit=sensor_field.unit,
                status=status,
                thresholds=ThresholdInfo(min=min_thresh, max=max_thresh),
            ))
    else:
        # No data from ThingSpeak, return sensor fields with unknown status
        for sensor_field in project.sensor_fields:
            min_thresh = float(sensor_field.min_threshold) if sensor_field.min_threshold else None
            max_thresh = float(sensor_field.max_threshold) if sensor_field.max_threshold else None
            
            readings.append(SensorReading(
                field=sensor_field.field_number,
                name=sensor_field.name,
                value=None,
                unit=sensor_field.unit,
                status="unknown",
                thresholds=ThresholdInfo(min=min_thresh, max=max_thresh),
            ))
    
    return CurrentReadingsResponse(timestamp=timestamp, readings=readings)


@router.get("/{code}/history", response_model=HistoryResponse)
async def get_history(
    code: str,
    field: int = Query(..., ge=1, le=8, description="Field number (1-8)"),
    range: str = Query("24h", description="Time range: 1h, 6h, 24h, 7d, 30d"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get historical sensor readings from PostgreSQL.
    """
    # Validate code
    is_valid, access_code, message = await AccessCodesService.validate_code(db, code)
    if not is_valid:
        raise HTTPException(status_code=404, detail=message)
    
    project = access_code.project
    
    # Find the sensor field
    sensor_field = next(
        (sf for sf in project.sensor_fields if sf.field_number == field),
        None
    )
    if not sensor_field:
        raise HTTPException(status_code=404, detail=f"Field {field} not found")
    
    # Parse time range
    range_mapping = {
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
    }
    time_delta = range_mapping.get(range, timedelta(hours=24))
    
    # Get the most recent reading's timestamp to use as "end_time"
    # instead of using datetime.utcnow()
    result = await db.execute(
        select(func.max(SensorReadingModel.recorded_at))
        .where(
            and_(
                SensorReadingModel.project_id == project.id,
                SensorReadingModel.field_number == field
            )
        )
    )
    latest_timestamp = result.scalar()
    
    if latest_timestamp is None:
        # No data at all
        return HistoryResponse(
            field=field,
            name=sensor_field.name,
            unit=sensor_field.unit,
            data=[],
        )
    
    # Calculate start time relative to the latest data, not "now"
    end_time = latest_timestamp
    start_time = end_time - time_delta
    
    # Fetch from database
    readings = await ReadingsService.get_history(
        db,
        project.id,
        field,
        start_time,
        end_time=end_time,
        limit=5000,
    )
    
    # Convert to response format
    data = [
        HistoryDataPoint(
            timestamp=r.recorded_at,
            value=float(r.value),
        )
        for r in readings
    ]
    
    return HistoryResponse(
        field=field,
        name=sensor_field.name,
        unit=sensor_field.unit,
        data=data,
    )


@router.get("/{code}/status", response_model=StatusResponse)
async def get_status(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get overall status of all sensors for a project.
    """
    # Validate code
    is_valid, access_code, message = await AccessCodesService.validate_code(db, code)
    if not is_valid:
        raise HTTPException(status_code=404, detail=message)
    
    project = access_code.project
    
    # Fetch latest data from ThingSpeak
    latest_feed = await thingspeak_service.get_latest_feed(
        project.thingspeak_channel_id,
        project.thingspeak_read_key,
    )
    
    sensors = []
    overall_status = "normal"
    last_updated = None
    
    if latest_feed:
        timestamp_str = latest_feed.get("created_at")
        if timestamp_str:
            try:
                last_updated = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            except ValueError:
                pass
        
        for sensor_field in project.sensor_fields:
            field_key = f"field{sensor_field.field_number}"
            raw_value = latest_feed.get(field_key)
            
            value = None
            if raw_value is not None:
                try:
                    value = float(raw_value)
                except (ValueError, TypeError):
                    pass
            
            min_thresh = float(sensor_field.min_threshold) if sensor_field.min_threshold else None
            max_thresh = float(sensor_field.max_threshold) if sensor_field.max_threshold else None
            status = ReadingsService.calculate_status(value, min_thresh, max_thresh)
            
            # Update overall status
            if status == "critical":
                overall_status = "critical"
            elif status == "warning" and overall_status != "critical":
                overall_status = "warning"
            
            message = None
            if status == "critical":
                message = "Value outside acceptable range"
            elif status == "warning":
                message = "Value approaching threshold"
            
            sensors.append(SensorStatus(
                field=sensor_field.field_number,
                name=sensor_field.name,
                status=status,
                value=value,
                message=message,
            ))
    else:
        overall_status = "unknown"
        for sensor_field in project.sensor_fields:
            sensors.append(SensorStatus(
                field=sensor_field.field_number,
                name=sensor_field.name,
                status="unknown",
                value=None,
                message="Unable to fetch data",
            ))
    
    return StatusResponse(
        project_name=project.name,
        overall_status=overall_status,
        sensors=sensors,
        last_updated=last_updated,
    )

