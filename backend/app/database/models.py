from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base

class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    unit_price = Column(Integer, default=0)
    quantity = Column(Integer, default=1)
    parent_id = Column(Integer, ForeignKey("parts.id"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # child-side → many-to-one
    parent = relationship(
        "Part",
        remote_side=[id],
        back_populates="children",
    )

    # parent-side → one-to-many
    children = relationship(
        "Part",
        back_populates="parent",
        cascade="all, delete-orphan",
    )