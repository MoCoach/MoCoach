from time import time
from math import floor

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from . import Base


class Message(Base):
    '''
    Class representing a single message of a chat
    '''
    __tablename__ = 'messages'
    id        = Column(String(128), nullable=False, primary_key=True)
    chat_id   = Column(Integer, ForeignKey('chats.id'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    text      = Column(String(250), nullable=False)
    timestamp = Column(Integer, nullable=False)

    chat = relationship("Chat", back_populates="messages")

    def __init__(self, msg_id, chat_id, sender_id, text):
        '''
        Creates a new instance of message

        :param msg_id: id of the message
        :param chat_id: id of the chat
        :param sender_id: id of the sender
        :param text: text of the message
        '''
        self.id        = msg_id
        self.chat_id   = chat_id
        self.sender_id = sender_id
        self.text      = text
        self.timestamp = floor(time())

    def to_dict(self):
        return {
            "id": self.id,
            "chat_id": self.chat_id,
            "sender_id": self.sender_id,
            "text": self.text,
            "timestamp": self.timestamp,
        }

    def __repr__(self):
        return f"Message(id={self.id!r}, chat_id={self.chat_id!r}, sender_id={self.sender_id!r}, text={self.text!r})"

    def __str__(self):
        return f"[{self.timestamp}] User {self.sender_id}: {self.text}"