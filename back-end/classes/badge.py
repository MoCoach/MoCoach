from time import time
from math import floor

from sqlalchemy import Column, Integer, String, ForeignKey

from . import Base


class Badge(Base):
    '''
    Class representing a badge awarded from one user to another
    '''
    __tablename__ = 'badges'
    id          = Column(Integer, primary_key=True)
    name        = Column(String(64), nullable=False)
    icon        = Column(String(128), nullable=True)
    description = Column(String(250), nullable=True)
    giver_id    = Column(Integer, ForeignKey('users.id'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    timestamp   = Column(Integer, nullable=False)

    def __init__(self, name, giver_id, receiver_id, icon=None, description=None):
        if not isinstance(name, str) or not name.strip():
            raise ValueError("name must be a non-empty string")
        if not isinstance(giver_id, int) or giver_id < 0:
            raise ValueError("giver_id must be a non-negative integer")
        if not isinstance(receiver_id, int) or receiver_id < 0:
            raise ValueError("receiver_id must be a non-negative integer")

        self.name = name
        self.giver_id = giver_id
        self.receiver_id = receiver_id
        self.icon = icon
        self.description = description
        self.timestamp = floor(time())

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "icon": self.icon,
            "description": self.description,
            "giver_id": self.giver_id,
            "receiver_id": self.receiver_id,
            "timestamp": self.timestamp,
        }

    def __repr__(self):
        return f"Badge(id={self.id!r}, name={self.name!r}, giver={self.giver_id!r}, receiver={self.receiver_id!r})"

    def __str__(self):
        return f"Badge({self.name})"
