from time import time

from sqlalchemy import Column, Integer
from classes.message import Message

class Chat:
    '''
    Class representing a chat
    '''
    __tablename__ = 'chats'
    id       = Column(Integer, nullable=False, primary_key=True)
    id_coach = Column(Integer, nullable=False)
    id_cust  = Column(Integer, nullable=False)
    msg_num  = Column(Integer, nullable=False)

    def __init__(self, id_coach, id_cust):
        self.id_coach = id_coach
        self.id_cust  = id_cust
        self.msg_num  = 0

    def new_msg(self, sender, text):
        '''
        insert new message
        :return:
        '''
        if sender is None:
            raise TypeError("sender is required")
        if not isinstance(sender, int):
            raise TypeError("sender must be an integer")
        if sender < 0:
            raise ValueError("sender must be a non-negative integer")

        if text is None:
            raise TypeError("text is required")
        if not isinstance(text, str):
            raise TypeError("text must be a string")
        if not text.strip():
            raise ValueError("text must be a non-empty string")

        msg_id = f"{self.id}_{self.msg_num}"
        msg = Message(msg_id, self.id, sender, text)
        # TODO verify the write/send is successful before increment
        self.msg_num += 1
        return msg

    def to_dict(self):
        return {
            "id": self.__dict__.get("id"),
            "id_coach": self.id_coach,
            "id_cust": self.id_cust,
            "msg_num": self.msg_num,
        }

    def __repr__(self):
        return f"Chat(id={self.__dict__.get('id')!r}, id_coach={self.id_coach!r}, id_cust={self.id_cust!r})"

    def __str__(self):
        return f"Chat(coach={self.id_coach}, customer={self.id_cust}, messages={self.msg_num})"
