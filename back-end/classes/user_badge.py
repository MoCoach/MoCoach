from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint

from . import Base


class UserBadge(Base):
    __tablename__ = 'user_badges'
    id       = Column(Integer, primary_key=True)
    user_id  = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"),  nullable=False)
    giver_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"),  nullable=False)
    badge_id = Column(Integer, ForeignKey('badges.id', ondelete="CASCADE"), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'giver_id', 'badge_id',
                         name='uq_user_giver_badge'),
    )

    def __init__(self, user_id, giver_id, badge_id):
        self.user_id = user_id
        self.giver_id = giver_id
        self.badge_id = badge_id

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "giver_id": self.giver_id,
            "badge_id": self.badge_id,
        }

    def __repr__(self):
        return f"UserBadge(id={self.id!r}, user={self.user_id}, giver={self.giver_id}, badge={self.badge_id})"
