from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    thingspeak_channel_id = Column(String(50), nullable=False)
    thingspeak_read_key = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    access_codes = relationship("AccessCode", back_populates="project", lazy="selectin")
    sensor_fields = relationship("SensorField", back_populates="project", lazy="selectin")
    sensor_readings = relationship("SensorReading", back_populates="project", lazy="noload")

