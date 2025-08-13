from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    chat_id: str
    role: str  # "user" or "assistant"
    content: str

class MessageInDB(MessageCreate):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
