from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship

from . import Base
from .tag import Tag
from .city import City


coach_tags = Table(
    'coach_tags',
    Base.metadata,
    Column('coach_id', Integer, ForeignKey('coaches.id', ondelete="CASCADE"), primary_key=True),
    Column('tag_id',   Integer, ForeignKey('tags.id', ondelete="CASCADE"),    primary_key=True),
)


class Coach(Base):
    '''
    Class representing coach-specific data
    '''
    __tablename__ = 'coaches'
    id          = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    description = Column(String(500), nullable=False)
    city_id     = Column(Integer, ForeignKey('cities.id'), nullable=False)

    user = relationship("User", back_populates="coach")
    tags = relationship("Tag", secondary=coach_tags)
    city = relationship("City")

    def __init__(self, description, city_id):
        if not isinstance(description, str):
            raise TypeError("description must be a string")
        if not isinstance(city_id, int):
            raise TypeError("city_id must be an int")
        self.description = description
        self.city_id = city_id

    def add_tag(self, tag):
        if not isinstance(tag, Tag):
            raise TypeError("tag must be a Tag instance")
        if len(self.tags) >= 5:
            raise ValueError("A coach can have at most 5 tags")
        if tag not in self.tags:
            self.tags.append(tag)

    def remove_tag(self, tag):
        if tag in self.tags:
            self.tags.remove(tag)

    def set_tags(self, tags):
        if tags is None:
            self.tags = []
            return
        if not isinstance(tags, list):
            raise TypeError("tags must be a list")
        if len(tags) > 5:
            raise ValueError("A coach can have at most 5 tags")
        for tag in tags:
            if not isinstance(tag, Tag):
                raise TypeError("each tag must be a Tag instance")
        self.tags = list(tags)

    def to_dict(self):
        return {
            "id": self.id,
            "description": self.description,
            "city": self.city.name if self.city else None,
            "tags": [tag.to_dict() for tag in self.tags],
        }

    def __repr__(self):
        return f"Coach(id={self.id!r}, description={self.description!r})"

    def __str__(self):
        return f"Coach(description={self.description!r}, tags={len(self.tags)})"
