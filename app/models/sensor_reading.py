from sqlalchemy import Column, Integer, BigInteger, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(BigInteger, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    field_number = Column(Integer, nullable=False)
    value = Column(Numeric, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False)  # ThingSpeak timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Index for efficient time-range queries
    __table_args__ = (
        Index("idx_readings_project_time", "project_id", "recorded_at"),
        Index("idx_readings_project_field_time", "project_id", "field_number", "recorded_at"),
    )
    
    # Relationships
    project = relationship("Project", back_populates="sensor_readings")

