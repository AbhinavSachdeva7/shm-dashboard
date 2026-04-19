from app.schemas.portal import (
    AccessCodeValidation,
    ProjectInfo,
    SensorInfo,
    SensorReading,
    CurrentReadingsResponse,
    HistoryDataPoint,
    HistoryResponse,
    StatusResponse,
)
from app.schemas.admin import (
    LoginRequest,
    LoginResponse,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    SensorFieldConfig,
    SensorFieldsUpdate,
    AccessCodeCreate,
    AccessCodeResponse,
    StatsResponse,
)

__all__ = [
    # Portal schemas
    "AccessCodeValidation",
    "ProjectInfo",
    "SensorInfo",
    "SensorReading",
    "CurrentReadingsResponse",
    "HistoryDataPoint",
    "HistoryResponse",
    "StatusResponse",
    # Admin schemas
    "LoginRequest",
    "LoginResponse",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "SensorFieldConfig",
    "SensorFieldsUpdate",
    "AccessCodeCreate",
    "AccessCodeResponse",
    "StatsResponse",
]

