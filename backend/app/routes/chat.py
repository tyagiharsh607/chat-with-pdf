from fastapi import APIRouter, Depends, HTTPException
from app.middlewares.auth_middleware import get_current_user
from app.models.chat import ChatCreate, ChatInDB
from app.supabase_client import supabase
from uuid import uuid4
from datetime import datetime

router = APIRouter()


@router.post("/", response_model=ChatInDB)
def create_chat(chat: ChatCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    chat_id = str(uuid4())
    created_at = datetime.utcnow().isoformat()

    data = {
        "id": chat_id,
        "user_id": user_id,
        "title": chat.title,
        "created_at": created_at,
    }

    # Add optional fields if provided
    if chat.file_url:
        data["file_url"] = chat.file_url
    if chat.file_name:
        data["file_name"] = chat.file_name

    res = supabase.table("chats").insert(data).execute()

    if res.error:
        raise HTTPException(status_code=500, detail=res.error.message)

    return data


@router.get("/", response_model=list[ChatInDB])
def get_user_chats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    res = supabase.table("chats").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()

    if res.error:
        raise HTTPException(status_code=500, detail=res.error.message)

    return res.data

@router.delete("/{chat_id}")
async def delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    supabase.table("chats").delete().eq("id", chat_id).eq("user_id", user_id).execute()
    return {"message": "Chat deleted"}
