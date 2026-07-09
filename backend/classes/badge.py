from sqlalchemy import Column, Integer, String, Boolean

from . import Base


class Badge(Base):
    __tablename__ = 'badges'
    id          = Column(Integer,     primary_key=True)
    name        = Column(String(50),  nullable=False, unique=True)
    description = Column(String(100), nullable=False)
    for_coach   = Column(Boolean,     nullable=False, default=False)

    def __init__(self, name: str, description: str, for_coach: bool) -> None:
        if not isinstance(name, str):
            raise TypeError("name must be a string")
        if not name.strip():
            raise ValueError("name must be a non-empty string")
        if len(name) > 50:
            raise ValueError("name must be at most 25 characters")
        if not isinstance(description, str):
            raise TypeError("description must be a string")
        if not description.strip():
            raise ValueError("description must be a non-empty string")
        if len(description) > 100:
            raise ValueError("description must be at most 100 characters")
        if not isinstance(for_coach, bool):
            raise TypeError("for_coach must be a boolean")
        self.name = name
        self.description = description
        self.for_coach = for_coach

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "for_coach": self.for_coach,
        }

    def __repr__(self):
        return f"Badge(id={self.id!r}, name={self.name!r})"

    def __str__(self):
        return f"Badge({self.name})"
