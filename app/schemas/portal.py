from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class SensorInfo(BaseModel):
    """Sensor field information."""
    field: int
    name: str
    unit: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProjectInfo(BaseModel):
    """Project information returned after code validation."""
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    sensors: List[SensorInfo]
    
    class Config:
        from_attributes = True


class AccessCodeValidation(BaseModel):
    """Response for access code validation."""
    valid: bool
    project: Optional[ProjectInfo] = None
    message: Optional[str] = None


class ThresholdInfo(BaseModel):
    """Threshold values for a sensor."""
    min: Optional[float] = None
    max: Optional[float] = None


class SensorReading(BaseModel):
    """Single sensor reading with status."""
    field: int
    name: str
    value: Optional[float] = None
    unit: Optional[str] = None
    status: str  # "normal", "warning", "critical", "unknown"
    thresholds: ThresholdInfo
    
    class Config:
        from_attributes = True


class CurrentReadingsResponse(BaseModel):
    """Response for current sensor readings."""
    timestamp: Optional[datetime] = None
    readings: List[SensorReading]


class HistoryDataPoint(BaseModel):
    """Single data point in history."""
    timestamp: datetime
    value: float


class HistoryResponse(BaseModel):
    """Response for historical data."""
    field: int
    name: str
    unit: Optional[str] = None
    data: List[HistoryDataPoint]


class SensorStatus(BaseModel):
    """Status of a single sensor."""
    field: int
    name: str
    status: str
    value: Optional[float] = None
    message: Optional[str] = None


class StatusResponse(BaseModel):
    """Response for overall status check."""
    project_name: str
    overall_status: str  # "normal", "warning", "critical"
    sensors: List[SensorStatus]
    last_updated: Optional[datetime] = None

