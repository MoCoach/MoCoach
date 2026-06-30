from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship

from . import Base
from .tag import Tag


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
    price       = Column(Integer, nullable=True)
    photo_url   = Column(String(500), nullable=True)

    user = relationship("User", back_populates="coach")
    tags = relationship("Tag", secondary=coach_tags)

    def __init__(self, description, price=None, photo_url=None):
        if not isinstance(description, str):
            raise TypeError("description must be a string")
        self.description = description
        self.price = price
        self.photo_url = photo_url

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
            "price": self.price,
            "photo_url": self.photo_url,
            "tags": [tag.to_dict() for tag in self.tags],
        }

    def __repr__(self):
        return f"Coach(id={self.id!r}, description={self.description!r})"

    def __str__(self):
        return f"Coach(description={self.description!r}, tags={len(self.tags)})"
