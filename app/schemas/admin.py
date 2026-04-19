from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


# Authentication
class LoginRequest(BaseModel):
    """Admin login request."""
    password: str


class LoginResponse(BaseModel):
    """Admin login response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


# Project schemas
class SensorFieldConfig(BaseModel):
    """Configuration for a single sensor field."""
    field_number: int = Field(ge=1, le=8)
    name: str
    unit: Optional[str] = None
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None


class ProjectCreate(BaseModel):
    """Request to create a new project."""
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    thingspeak_channel_id: str
    thingspeak_read_key: str
    sensor_fields: Optional[List[SensorFieldConfig]] = None


class ProjectUpdate(BaseModel):
    """Request to update a project."""
    name: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    thingspeak_channel_id: Optional[str] = None
    thingspeak_read_key: Optional[str] = None
    is_active: Optional[bool] = None


class SensorFieldResponse(BaseModel):
    """Sensor field in response."""
    id: int
    field_number: int
    name: str
    unit: Optional[str] = None
    min_threshold: Optional[float] = None
    max_threshold: Optional[float] = None
    
    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    """Project response with all details."""
    id: int
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    thingspeak_channel_id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    sensor_fields: List[SensorFieldResponse] = []
    access_code_count: int = 0
    
    class Config:
        from_attributes = True


class SensorFieldsUpdate(BaseModel):
    """Request to update sensor fields for a project."""
    sensor_fields: List[SensorFieldConfig]


# Access code schemas
class AccessCodeCreate(BaseModel):
    """Request to create a new access code."""
    custom_code: Optional[str] = None  # If not provided, auto-generate
    expires_at: Optional[datetime] = None


class AccessCodeResponse(BaseModel):
    """Access code response."""
    id: int
    code: str
    project_id: int
    is_active: bool
    expires_at: Optional[datetime] = None
    access_count: int
    last_accessed_at: Optional[datetime] = None
    created_at: datetime
    shareable_link: Optional[str] = None  # Full URL for sharing
    
    class Config:
        from_attributes = True


# Stats
class StatsResponse(BaseModel):
    """Dashboard statistics."""
    total_projects: int
    active_projects: int
    total_access_codes: int
    active_access_codes: int
    total_readings: int
    recent_accesses: int  # Last 24 hours


# Connection test
class ConnectionTestResponse(BaseModel):
    """ThingSpeak connection test response."""
    success: bool
    message: str
    channel_name: Optional[str] = None
    field_count: Optional[int] = None

