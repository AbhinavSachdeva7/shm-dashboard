from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AccessLog(Base):
    __tablename__ = "access_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    access_code_id = Column(Integer, ForeignKey("access_codes.id"), nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    access_code = relationship("AccessCode", back_populates="access_logs")

