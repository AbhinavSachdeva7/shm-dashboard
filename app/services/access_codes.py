from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
import string

from app.models import AccessCode, Project, AccessLog


class AccessCodesService:
    """Service for managing access codes."""
    
    @staticmethod
    def generate_code(project_name: str) -> str:
        """
        Generate a unique access code.
        
        Format: PROJECT-YEAR-RANDOM (e.g., MTHL-2024-XK9)
        """
        # Get abbreviation from project name (first letters of words, max 4 chars)
        words = project_name.upper().split()
        abbrev = "".join(word[0] for word in words[:4])
        if len(abbrev) < 2:
            abbrev = project_name[:4].upper()
        
        # Current year
        year = datetime.utcnow().year
        
        # Random suffix (3 chars)
        alphabet = string.ascii_uppercase + string.digits
        suffix = "".join(secrets.choice(alphabet) for _ in range(3))
        
        return f"{abbrev}-{year}-{suffix}"
    
    @staticmethod
    async def get_by_code(
        db: AsyncSession,
        code: str,
        include_project: bool = True
    ) -> Optional[AccessCode]:
        """Get an access code by its code string."""
        query = select(AccessCode).where(AccessCode.code == code)
        
        if include_project:
            query = query.options(
                selectinload(AccessCode.project).selectinload(Project.sensor_fields)
            )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def validate_code(
        db: AsyncSession,
        code: str
    ) -> tuple[bool, Optional[AccessCode], str]:
        """
        Validate an access code.
        
        Returns: (is_valid, access_code_object, message)
        """
        access_code = await AccessCodesService.get_by_code(db, code)
        
        if not access_code:
            return False, None, "Invalid access code"
        
        if not access_code.is_active:
            return False, None, "Access code has been deactivated"
        
        if access_code.expires_at and access_code.expires_at < datetime.utcnow():
            return False, None, "Access code has expired"
        
        if not access_code.project or not access_code.project.is_active:
            return False, None, "Project is not available"
        
        return True, access_code, "Valid"
    
    @staticmethod
    async def record_access(
        db: AsyncSession,
        access_code: AccessCode,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Record an access to a code and update access count."""
        # Update access code stats
        access_code.access_count += 1
        access_code.last_accessed_at = datetime.utcnow()
        
        # Create access log
        log = AccessLog(
            access_code_id=access_code.id,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(log)
        
        await db.commit()
    
    @staticmethod
    async def get_by_project(
        db: AsyncSession,
        project_id: int
    ) -> List[AccessCode]:
        """Get all access codes for a project."""
        result = await db.execute(
            select(AccessCode)
            .where(AccessCode.project_id == project_id)
            .order_by(AccessCode.created_at.desc())
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def create(
        db: AsyncSession,
        project_id: int,
        custom_code: Optional[str] = None,
        expires_at: Optional[datetime] = None
    ) -> AccessCode:
        """Create a new access code for a project."""
        # Get project for code generation
        project = await db.get(Project, project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        # Generate or use custom code
        if custom_code:
            code = custom_code
        else:
            # Generate unique code, retry if collision
            for _ in range(10):
                code = AccessCodesService.generate_code(project.name)
                existing = await AccessCodesService.get_by_code(db, code, include_project=False)
                if not existing:
                    break
            else:
                # Fallback to fully random code
                code = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12))
        
        access_code = AccessCode(
            code=code,
            project_id=project_id,
            expires_at=expires_at,
        )
        db.add(access_code)
        await db.commit()
        await db.refresh(access_code)
        
        return access_code
    
    @staticmethod
    async def deactivate(db: AsyncSession, code_id: int) -> bool:
        """Deactivate an access code."""
        access_code = await db.get(AccessCode, code_id)
        if not access_code:
            return False
        
        access_code.is_active = False
        await db.commit()
        return True
    
    @staticmethod
    async def count_total(db: AsyncSession) -> int:
        """Get total count of all access codes."""
        result = await db.execute(select(func.count(AccessCode.id)))
        return result.scalar() or 0
    
    @staticmethod
    async def count_active(db: AsyncSession) -> int:
        """Get count of active access codes."""
        result = await db.execute(
            select(func.count(AccessCode.id))
            .where(AccessCode.is_active == True)
        )
        return result.scalar() or 0
    
    @staticmethod
    async def count_recent_accesses(db: AsyncSession, hours: int = 24) -> int:
        """Get count of accesses in the last N hours."""
        since = datetime.utcnow() - timedelta(hours=hours)
        result = await db.execute(
            select(func.count(AccessLog.id))
            .where(AccessLog.accessed_at >= since)
        )
        return result.scalar() or 0

