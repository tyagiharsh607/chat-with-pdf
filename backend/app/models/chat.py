from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class ChatBase(BaseModel):
    title: str
    file_url: Optional[str] = None
    file_name: Optional[str] = None

class ChatCreate(ChatBase):
    pass

class ChatInDB(ChatBase):
    id: UUID
    user_id: UUID
    created_at: datetime

class ChatResponse(ChatInDB):
    class Config:
        orm_mode = True
