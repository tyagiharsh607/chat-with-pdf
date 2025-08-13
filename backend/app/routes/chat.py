from fastapi import APIRouter, Depends, HTTPException
from app.middlewares.auth_middleware import get_current_user
from app.models.chat import ChatCreate, ChatInDB
from app.supabase_client import supabase
from uuid import uuid4
from datetime import datetime

router = APIRouter()


@router.post("/", response_model=ChatInDB)
def create_chat(chat: ChatCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    chat_id = str(uuid4())
    created_at = datetime.utcnow().isoformat()

    data = {
        "id": chat_id,
        "user_id": user_id,
        "title": chat.title,
        "created_at": created_at,
    }
    if chat.file_url:
        data["file_url"] = chat.file_url
    if chat.file_name:
        data["file_name"] = chat.file_name

    try:
        res = supabase.table("chats").insert(data).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {e}")

    inserted = res.data if hasattr(res, "data") else res
    return inserted[0] if inserted and isinstance(inserted, list) else inserted


@router.get("/", response_model=list[ChatInDB])
def get_user_chats(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    try:
        res = supabase.table("chats").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chats: {e}")

    chats = res.data if hasattr(res, "data") else res
    print(f"Fetched chats: {chats}")

    return chats


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    try:
        res = supabase.table("chats").delete().eq("id", chat_id).eq("user_id", user_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete chat: {e}")

    # Optionally, you can verify deletion count here if available in res
    return {"message": "Chat deleted"}


@router.put("/{chat_id}", response_model=ChatInDB)
def update_chat_title(chat_id: str, title: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    try:
        res = supabase.table("chats").update({"title": title}).eq("id", chat_id).eq("user_id", user_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update chat title: {e}")

    updated = res.data if hasattr(res, "data") else res
    return updated[0] if updated else {"id": chat_id, "title": title}


@router.get("/{chat_id}", response_model=ChatInDB)
def get_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    try:
        res = supabase.table("chats").select("*").eq("id", chat_id).eq("user_id", user_id).single().execute()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Chat not found: {e}")

    chat = res.data if hasattr(res, "data") else res
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return chat
