from sqlalchemy import Column, Integer, String

from . import Base


class Tag(Base):
    '''
    Class representing a tag that can be assigned to a coach
    '''
    __tablename__ = 'tags'
    id          = Column(Integer,      primary_key=True)
    name        = Column(String(25),  nullable=False, unique=True)
    description = Column(String(100), nullable=False)

    def __init__(self, name, description):
        if not isinstance(name, str):
            raise TypeError("name must be a string")
        if not name.strip():
            raise ValueError("name must be a non-empty string")
        if len(name) > 25:
            raise ValueError("name must be at most 25 characters")

        if not isinstance(description, str):
            raise TypeError("description must be a string")
        if len(description) > 100:
            raise ValueError("description must be at most 100 characters")

        self.name = name
        self.description = description

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
        }

    def __repr__(self):
        return f"Tag(id={self.id!r}, name={self.name!r})"

    def __str__(self):
        return f"Tag({self.name})"
