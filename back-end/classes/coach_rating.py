from sqlalchemy import Column, Integer, Boolean, ForeignKey, UniqueConstraint

from . import Base


class CoachRating(Base):
    __tablename__ = 'coach_ratings'
    id          = Column(Integer, primary_key=True)
    coach_id    = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    rating      = Column(Boolean, nullable=True)

    __table_args__ = (
        UniqueConstraint('coach_id', 'customer_id', name='uq_coach_customer_rating'),
    )
