from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class SensorField(Base):
    __tablename__ = "sensor_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    field_number = Column(Integer, nullable=False)  # ThingSpeak field1-field8
    name = Column(String(100), nullable=False)  # "Vibration Sensor A"
    unit = Column(String(50), nullable=True)  # "mm/s", "°C", "με"
    min_threshold = Column(Numeric, nullable=True)  # Alert if below
    max_threshold = Column(Numeric, nullable=True)  # Alert if above
    
    # Unique constraint for project + field_number
    __table_args__ = (
        UniqueConstraint("project_id", "field_number", name="uq_project_field"),
    )
    
    # Relationships
    project = relationship("Project", back_populates="sensor_fields")

