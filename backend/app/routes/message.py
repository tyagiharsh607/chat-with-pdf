from fastapi import APIRouter, Depends, HTTPException
from app.middlewares.auth_middleware import get_current_user
from app.models.message import MessageCreate, MessageInDB
from app.supabase_client import supabase
from uuid import uuid4
from datetime import datetime
from app.rag import generate_assistant_response

router = APIRouter()

@router.post("/", response_model=list[MessageInDB])
def create_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    chat_id = message.chat_id

    
    # verify current user owns the chat before inserting message
    chat_res = supabase.table("chats").select("user_id").eq("id", chat_id).single().execute()
    if not chat_res.data or chat_res.data["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to add messages to this chat")

    # ✅ STEP 1: Generate assistant response FIRST (before any database writes)
    try:
        assistant_text = generate_assistant_response(message.content, chat_id)

        
    except Exception as e:

        raise HTTPException(status_code=500, detail=f"Assistant generation failed: {e}")

    # ✅ STEP 2: Only create user message AFTER assistant response succeeds
    user_message_data = {
        "id": str(uuid4()),
        "chat_id": chat_id,
        "role": message.role,
        "content": message.content,
        "created_at": datetime.utcnow().isoformat()
    }

    try:
        res = supabase.table("messages").insert(user_message_data).execute()

    except Exception as e:

        # Assistant response was generated but user message failed to store
        # This is a rare edge case - you might want to handle this
        raise HTTPException(status_code=500, detail=f"Failed to store user message: {e}")

    # ✅ STEP 3: Insert assistant message (both messages as a pair)
    assistant_message_data = {
        "id": str(uuid4()),
        "chat_id": chat_id,
        "role": "assistant",
        "content": assistant_text,
        "created_at": datetime.utcnow().isoformat()
    }
    
    try:
        supabase.table("messages").insert(assistant_message_data).execute()

    except Exception as e:

        # Both user message and assistant response exist, but assistant message failed to store
        # This creates an inconsistent state - user message without assistant response in DB
        raise HTTPException(status_code=500, detail=f"Failed to store assistant message: {e}")

    # ✅ STEP 4: Return updated list of messages for this chat
    try:
        msg_res = supabase.table("messages").select("*").eq("chat_id", chat_id).order("created_at").execute()
        messages = msg_res.data if hasattr(msg_res, "data") else msg_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch updated messages: {e}")

    return messages


@router.get("/{chat_id}", response_model=list[MessageInDB])
def get_messages(chat_id: str, current_user: dict = Depends(get_current_user)):
    # Verify chat ownership before fetching messages
    chat_res = supabase.table("chats").select("user_id").eq("id", chat_id).single().execute()
    
    if not chat_res.data or chat_res.data["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view messages of this chat")

    try:
        res = supabase.table("messages").select("*").eq("chat_id", chat_id).order("created_at").execute()
       
    except Exception as e:

        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {e}")

    messages = res.data if hasattr(res, "data") else res
    return messages
