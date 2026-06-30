from sqlalchemy import Column, Integer, String

from . import Base


class City(Base):
    __tablename__ = 'cities'
    id   = Column(Integer,     primary_key=True)
    name = Column(String(25),  nullable=False, unique=True)

    def __init__(self, name):
        if not isinstance(name, str):
            raise TypeError("name must be a string")
        if not name.strip():
            raise ValueError("name must be a non-empty string")
        if len(name) > 25:
            raise ValueError("name must be at most 25 characters")
        self.name = name

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
        }

    def __repr__(self):
        return f"City(id={self.id!r}, name={self.name!r})"

    def __str__(self):
        return f"City({self.name})"
