import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from qdrant_client.models import PointStruct

from app.qdrant_client import client, COLLECTION_NAME, ensure_collection_exists
from app.supabase_client import supabase
from app.embeddings import model
from app.utils import chunk_text, read_file_content, upload_to_supabase_storage
from app.middlewares.auth_middleware import get_current_user

router = APIRouter( dependencies=[Depends(get_current_user)] )
logger = logging.getLogger(__name__)


@router.post("/")
async def upload_file(
    chat_id: str = Query(..., description="Unique chat ID associated with the file."),
    file: UploadFile = File(...)
):
    logger.info(f"Received file '{file.filename}' for chat {chat_id}")

     # Upload file to Supabase Storage
    file_url = await upload_to_supabase_storage(file, chat_id)

    # Update chats with the file URL
    try:
        update_response = supabase.table("chats").update({
            "file_url": file_url,
            "file_name": file.filename
        }).eq("id", chat_id).execute()

        if update_response.error:
            logger.error(f"Failed to update chat: {update_response.error.message}")
            raise HTTPException(status_code=500, detail="Failed to update chat with file info.")
        logger.info(f"Chat {chat_id} updated with file_url and file_name.")

    except Exception as e:
        logger.error(f"Chat update failed: {e}")
        raise HTTPException(status_code=500, detail="Error updating chat metadata.")
    
    # Rewind file for reading (again)
    file.file.seek(0)

    # Create embeddings and upload to Qdrant

    # Step 1: Read file content (PDF, TXT, or CSV)
    try:
        full_text = await read_file_content(file)
    except ValueError as ve:
        logger.error(f"Unsupported file type: {ve}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading file: {e}")

    if not full_text.strip():
        logger.warning("Uploaded file has no readable content.")
        raise HTTPException(status_code=400, detail="Empty or unreadable file.")

    # Step 2: Chunk text
    try:
        chunks = chunk_text(full_text)
        logger.info(f"Text chunked into {len(chunks)} segments.")
    except Exception as e:
        logger.error(f"Chunking failed: {e}")
        raise HTTPException(status_code=500, detail="Text chunking failed.")

    # Step 3: Generate embeddings
    try:
        vectors = model.encode(chunks).tolist()
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail="Embedding failed.")


    # Step 4: Ensure Qdrant collection exists
    try:
        ensure_collection_exists()
    except Exception as e:
        logger.error(f"Qdrant collection error: {e}")
        raise HTTPException(status_code=500, detail="Qdrant setup failed.")

    # Step 5: Prepare points and insert into Qdrant
    points = []
    for chunk, vector in zip(chunks, vectors):
        try:
            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={"text": chunk, "chat_id": chat_id}
            )
            points.append(point)
        except Exception as e:
            logger.warning(f"Skipping chunk due to error: {e}")

    try:
        client.upsert(collection_name=COLLECTION_NAME, points=points)
        logger.info(f"Uploaded {len(points)} points to Qdrant.")
    except Exception as e:
        logger.error(f"Qdrant upload failed: {e}")
        raise HTTPException(status_code=500, detail="Vector DB insert failed.")

    return {
            "message": f"Uploaded and indexed {len(chunks)} chunks for chat {chat_id}.",
            "file_url": file_url
        }
