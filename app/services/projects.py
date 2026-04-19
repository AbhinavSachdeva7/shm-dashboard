from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.models import Project, SensorField, AccessCode
from app.schemas.admin import ProjectCreate, ProjectUpdate, SensorFieldConfig


class ProjectsService:
    """Service for managing projects."""
    
    @staticmethod
    async def get_all(db: AsyncSession) -> List[Project]:
        """Get all projects with their sensor fields."""
        result = await db.execute(
            select(Project)
            .options(selectinload(Project.sensor_fields))
            .order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_active(db: AsyncSession) -> List[Project]:
        """Get all active projects."""
        result = await db.execute(
            select(Project)
            .where(Project.is_active == True)
            .options(selectinload(Project.sensor_fields))
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_by_id(db: AsyncSession, project_id: int) -> Optional[Project]:
        """Get a project by ID with sensor fields."""
        result = await db.execute(
            select(Project)
            .where(Project.id == project_id)
            .options(selectinload(Project.sensor_fields))
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create(db: AsyncSession, data: ProjectCreate) -> Project:
        """Create a new project with optional sensor fields."""
        project = Project(
            name=data.name,
            location=data.location,
            description=data.description,
            thingspeak_channel_id=data.thingspeak_channel_id,
            thingspeak_read_key=data.thingspeak_read_key,
        )
        db.add(project)
        await db.flush()  # Get the project ID
        
        # Add sensor fields if provided
        if data.sensor_fields:
            for field_config in data.sensor_fields:
                sensor_field = SensorField(
                    project_id=project.id,
                    field_number=field_config.field_number,
                    name=field_config.name,
                    unit=field_config.unit,
                    min_threshold=field_config.min_threshold,
                    max_threshold=field_config.max_threshold,
                )
                db.add(sensor_field)
        
        await db.commit()
        await db.refresh(project)
        
        # Load sensor fields
        result = await db.execute(
            select(Project)
            .where(Project.id == project.id)
            .options(selectinload(Project.sensor_fields))
        )
        return result.scalar_one()
    
    @staticmethod
    async def update(
        db: AsyncSession,
        project_id: int,
        data: ProjectUpdate
    ) -> Optional[Project]:
        """Update a project."""
        project = await ProjectsService.get_by_id(db, project_id)
        if not project:
            return None
        
        # Update only provided fields
        if data.name is not None:
            project.name = data.name
        if data.location is not None:
            project.location = data.location
        if data.description is not None:
            project.description = data.description
        if data.thingspeak_channel_id is not None:
            project.thingspeak_channel_id = data.thingspeak_channel_id
        if data.thingspeak_read_key is not None:
            project.thingspeak_read_key = data.thingspeak_read_key
        if data.is_active is not None:
            project.is_active = data.is_active
        
        await db.commit()
        await db.refresh(project)
        return project
    
    @staticmethod
    async def delete(db: AsyncSession, project_id: int) -> bool:
        """
        Soft delete a project (set is_active to False).
        
        Returns True if project was found and deactivated.
        """
        project = await ProjectsService.get_by_id(db, project_id)
        if not project:
            return False
        
        project.is_active = False
        await db.commit()
        return True
    
    @staticmethod
    async def update_sensor_fields(
        db: AsyncSession,
        project_id: int,
        sensor_fields: List[SensorFieldConfig]
    ) -> Optional[Project]:
        """
        Update sensor fields for a project.
        
        This replaces all existing sensor fields with the new configuration.
        """
        project = await ProjectsService.get_by_id(db, project_id)
        if not project:
            return None
        
        # Delete existing sensor fields
        for field in project.sensor_fields:
            await db.delete(field)
        
        # Add new sensor fields
        for field_config in sensor_fields:
            sensor_field = SensorField(
                project_id=project_id,
                field_number=field_config.field_number,
                name=field_config.name,
                unit=field_config.unit,
                min_threshold=field_config.min_threshold,
                max_threshold=field_config.max_threshold,
            )
            db.add(sensor_field)
        
        await db.commit()
        
        # Reload project with updated sensor fields
        result = await db.execute(
            select(Project)
            .where(Project.id == project_id)
            .options(selectinload(Project.sensor_fields))
        )
        return result.scalar_one()
    
    @staticmethod
    async def get_access_code_count(db: AsyncSession, project_id: int) -> int:
        """Get count of active access codes for a project."""
        result = await db.execute(
            select(func.count(AccessCode.id))
            .where(
                AccessCode.project_id == project_id,
                AccessCode.is_active == True
            )
        )
        return result.scalar() or 0
    
    @staticmethod
    async def count_total(db: AsyncSession) -> int:
        """Get total count of all projects."""
        result = await db.execute(select(func.count(Project.id)))
        return result.scalar() or 0
    
    @staticmethod
    async def count_active(db: AsyncSession) -> int:
        """Get count of active projects."""
        result = await db.execute(
            select(func.count(Project.id))
            .where(Project.is_active == True)
        )
        return result.scalar() or 0

