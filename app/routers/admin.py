from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import timedelta

from app.database import get_db
from app.auth import verify_admin_password, create_access_token, get_current_admin
from app.config import get_settings
from app.services.projects import ProjectsService
from app.services.access_codes import AccessCodesService
from app.services.readings import ReadingsService
from app.services.thingspeak import thingspeak_service
from app.schemas.admin import (
    LoginRequest,
    LoginResponse,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    SensorFieldResponse,
    SensorFieldsUpdate,
    AccessCodeCreate,
    AccessCodeResponse,
    StatsResponse,
    ConnectionTestResponse,
)

router = APIRouter(prefix="/api/admin", tags=["Admin"])
settings = get_settings()


# ============ Authentication ============

@router.post("/login", response_model=LoginResponse)
async def admin_login(request: LoginRequest):
    """
    Authenticate with admin password and get access token.
    """
    if not verify_admin_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )
    
    # Create access token
    access_token = create_access_token(
        data={"type": "admin"},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
    )


# ============ Projects ============

@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    List all projects.
    """
    projects = await ProjectsService.get_all(db)
    
    # Build response with access code counts
    result = []
    for project in projects:
        code_count = await ProjectsService.get_access_code_count(db, project.id)
        result.append(ProjectResponse(
            id=project.id,
            name=project.name,
            location=project.location,
            description=project.description,
            thingspeak_channel_id=project.thingspeak_channel_id,
            is_active=project.is_active,
            created_at=project.created_at,
            updated_at=project.updated_at,
            sensor_fields=[
                SensorFieldResponse(
                    id=sf.id,
                    field_number=sf.field_number,
                    name=sf.name,
                    unit=sf.unit,
                    min_threshold=float(sf.min_threshold) if sf.min_threshold else None,
                    max_threshold=float(sf.max_threshold) if sf.max_threshold else None,
                )
                for sf in project.sensor_fields
            ],
            access_code_count=code_count,
        ))
    
    return result


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Create a new project.
    """
    project = await ProjectsService.create(db, data)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        location=project.location,
        description=project.description,
        thingspeak_channel_id=project.thingspeak_channel_id,
        is_active=project.is_active,
        created_at=project.created_at,
        updated_at=project.updated_at,
        sensor_fields=[
            SensorFieldResponse(
                id=sf.id,
                field_number=sf.field_number,
                name=sf.name,
                unit=sf.unit,
                min_threshold=float(sf.min_threshold) if sf.min_threshold else None,
                max_threshold=float(sf.max_threshold) if sf.max_threshold else None,
            )
            for sf in project.sensor_fields
        ],
        access_code_count=0,
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Get a specific project by ID.
    """
    project = await ProjectsService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    code_count = await ProjectsService.get_access_code_count(db, project.id)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        location=project.location,
        description=project.description,
        thingspeak_channel_id=project.thingspeak_channel_id,
        is_active=project.is_active,
        created_at=project.created_at,
        updated_at=project.updated_at,
        sensor_fields=[
            SensorFieldResponse(
                id=sf.id,
                field_number=sf.field_number,
                name=sf.name,
                unit=sf.unit,
                min_threshold=float(sf.min_threshold) if sf.min_threshold else None,
                max_threshold=float(sf.max_threshold) if sf.max_threshold else None,
            )
            for sf in project.sensor_fields
        ],
        access_code_count=code_count,
    )


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Update a project.
    """
    project = await ProjectsService.update(db, project_id, data)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    code_count = await ProjectsService.get_access_code_count(db, project.id)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        location=project.location,
        description=project.description,
        thingspeak_channel_id=project.thingspeak_channel_id,
        is_active=project.is_active,
        created_at=project.created_at,
        updated_at=project.updated_at,
        sensor_fields=[
            SensorFieldResponse(
                id=sf.id,
                field_number=sf.field_number,
                name=sf.name,
                unit=sf.unit,
                min_threshold=float(sf.min_threshold) if sf.min_threshold else None,
                max_threshold=float(sf.max_threshold) if sf.max_threshold else None,
            )
            for sf in project.sensor_fields
        ],
        access_code_count=code_count,
    )


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Deactivate a project (soft delete).
    """
    success = await ProjectsService.delete(db, project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")


@router.post("/projects/{project_id}/test", response_model=ConnectionTestResponse)
async def test_project_connection(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Test ThingSpeak connection for a project.
    """
    project = await ProjectsService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    result = await thingspeak_service.test_connection(
        project.thingspeak_channel_id,
        project.thingspeak_read_key,
    )
    
    return ConnectionTestResponse(**result)


# ============ Sensor Fields ============

@router.get("/projects/{project_id}/sensors", response_model=List[SensorFieldResponse])
async def get_sensor_fields(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Get sensor field configuration for a project.
    """
    project = await ProjectsService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return [
        SensorFieldResponse(
            id=sf.id,
            field_number=sf.field_number,
            name=sf.name,
            unit=sf.unit,
            min_threshold=float(sf.min_threshold) if sf.min_threshold else None,
            max_threshold=float(sf.max_threshold) if sf.max_threshold else None,
        )
        for sf in project.sensor_fields
    ]


@router.put("/projects/{project_id}/sensors", response_model=List[SensorFieldResponse])
async def update_sensor_fields(
    project_id: int,
    data: SensorFieldsUpdate,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Update sensor field configuration for a project.
    """
    project = await ProjectsService.update_sensor_fields(
        db, project_id, data.sensor_fields
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return [
        SensorFieldResponse(
            id=sf.id,
            field_number=sf.field_number,
            name=sf.name,
            unit=sf.unit,
            min_threshold=float(sf.min_threshold) if sf.min_threshold else None,
            max_threshold=float(sf.max_threshold) if sf.max_threshold else None,
        )
        for sf in project.sensor_fields
    ]


# ============ Access Codes ============

@router.get("/projects/{project_id}/codes", response_model=List[AccessCodeResponse])
async def list_access_codes(
    project_id: int,
    base_url: Optional[str] = Query(None, description="Base URL for shareable links"),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    List all access codes for a project.
    """
    project = await ProjectsService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    codes = await AccessCodesService.get_by_project(db, project_id)
    
    return [
        AccessCodeResponse(
            id=code.id,
            code=code.code,
            project_id=code.project_id,
            is_active=code.is_active,
            expires_at=code.expires_at,
            access_count=code.access_count,
            last_accessed_at=code.last_accessed_at,
            created_at=code.created_at,
            shareable_link=f"{base_url}/portal/{code.code}" if base_url else None,
        )
        for code in codes
    ]


@router.post("/projects/{project_id}/codes", response_model=AccessCodeResponse, status_code=status.HTTP_201_CREATED)
async def create_access_code(
    project_id: int,
    data: AccessCodeCreate,
    base_url: Optional[str] = Query(None, description="Base URL for shareable links"),
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Generate a new access code for a project.
    """
    project = await ProjectsService.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        code = await AccessCodesService.create(
            db,
            project_id,
            custom_code=data.custom_code,
            expires_at=data.expires_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return AccessCodeResponse(
        id=code.id,
        code=code.code,
        project_id=code.project_id,
        is_active=code.is_active,
        expires_at=code.expires_at,
        access_count=code.access_count,
        last_accessed_at=code.last_accessed_at,
        created_at=code.created_at,
        shareable_link=f"{base_url}/portal/{code.code}" if base_url else None,
    )


@router.delete("/codes/{code_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_access_code(
    code_id: int,
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Deactivate an access code.
    """
    success = await AccessCodesService.deactivate(db, code_id)
    if not success:
        raise HTTPException(status_code=404, detail="Access code not found")


# ============ Stats ============

@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    """
    Get dashboard statistics.
    """
    total_projects = await ProjectsService.count_total(db)
    active_projects = await ProjectsService.count_active(db)
    total_codes = await AccessCodesService.count_total(db)
    active_codes = await AccessCodesService.count_active(db)
    total_readings = await ReadingsService.get_total_readings_count(db)
    recent_accesses = await AccessCodesService.count_recent_accesses(db, hours=24)
    
    return StatsResponse(
        total_projects=total_projects,
        active_projects=active_projects,
        total_access_codes=total_codes,
        active_access_codes=active_codes,
        total_readings=total_readings,
        recent_accesses=recent_accesses,
    )

