import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from qdrant_client.models import PointStruct

from app.qdrant_client import qdrant, COLLECTION_NAME, ensure_collection_exists, ensure_payload_index
from app.supabase_client import supabase
from app.embeddings import model
from app.utils import chunk_text, read_file_content, upload_to_supabase_storage
from app.middlewares.auth_middleware import get_current_user
import time

router = APIRouter(dependencies=[Depends(get_current_user)])
logger = logging.getLogger(__name__)

@router.post("/")
async def upload_file(
    chat_id: str = Query(..., description="Unique chat ID associated with the file."),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Received file '{file.filename}' for chat {chat_id}")

    # Check that chat belongs to user
    try:
        chat_res = supabase.table("chats").select("user_id").eq("id", chat_id).single().execute()
        if not chat_res.data or chat_res.data["user_id"] != current_user["user_id"]:
            logger.warning(f"User {current_user['user_id']} is NOT owner of chat {chat_id}")
            raise HTTPException(status_code=403, detail="You do not have permission to upload to this chat.")
        logger.info("Ownership check passed.")
    except Exception as e:
        logger.error(f"Chat ownership check failed: {e}")
        raise HTTPException(status_code=403, detail="Chat ownership validation failed.")

    # ✅ STEP 1: Process file content FIRST (before any uploads)
    
    # Step 1a: Read file content (PDF, TXT, or CSV)
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

    # Step 1b: Chunk text
    try:
        chunks = chunk_text(full_text)
        logger.info(f"Text chunked into {len(chunks)} segments.")
    except Exception as e:
        logger.error(f"Chunking failed: {e}")
        raise HTTPException(status_code=500, detail="Text chunking failed.")

    # Step 1c: Generate embeddings
    try:
        vectors = model.encode(chunks).tolist()
        logger.info(f"Generated embeddings for {len(vectors)} chunks.")
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail="Embedding failed.")

    # ✅ STEP 2: Upload to Qdrant FIRST

    # Step 2a: Ensure Qdrant collection exists
    try:
        ensure_collection_exists()
        ensure_payload_index()
    except Exception as e:
        logger.error(f"Qdrant setup error: {e}")
        raise HTTPException(status_code=500, detail="Qdrant setup failed.")

    # Step 2b: Prepare points
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

    # Step 2c: Upload to Qdrant with retry (MUST succeed before Supabase upload)
    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting Qdrant upload (attempt {attempt + 1}/{max_retries})")
            
            qdrant.upsert(collection_name=COLLECTION_NAME, points=points)
            
            logger.info(f"✅ Successfully uploaded {len(points)} points to Qdrant on attempt {attempt + 1}")
            break  # Success - continue to Supabase upload
            
        except Exception as e:
            if attempt == max_retries - 1:  # Last attempt failed
                logger.error(f"❌ Qdrant upload failed after {max_retries} attempts: {e}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Vector DB upload failed after {max_retries} attempts. File not uploaded to prevent orphaned storage."
                )
            else:
                logger.warning(f"⚠️ Qdrant upload attempt {attempt + 1} failed: {e}")
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff

    # ✅ STEP 3: Upload to Supabase ONLY after Qdrant success
    logger.info("Qdrant upload successful, proceeding with Supabase upload...")

    # Reset file pointer for Supabase upload
    file.file.seek(0)

    try:
        file_url = await upload_to_supabase_storage(file, chat_id)
        logger.info(f"Successfully uploaded file to Supabase: {file_url}")
    except Exception as e:
        logger.error(f"Supabase upload failed: {e}")
        
        # ✅ CLEANUP: Remove Qdrant vectors since Supabase upload failed
        logger.info("Attempting to clean up Qdrant vectors due to Supabase failure...")
        
        try:
            from qdrant_client import models
            
            # Delete all vectors for this chat_id from Qdrant
            qdrant.delete(
                collection_name=COLLECTION_NAME,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="chat_id",
                                match=models.MatchValue(value=chat_id)
                            )
                        ]
                    )
                )
            )
            logger.info(f"✅ Successfully cleaned up Qdrant vectors for chat_id: {chat_id}")
            
        except Exception as cleanup_error:
            logger.error(f"❌ Failed to cleanup Qdrant vectors: {cleanup_error}")
            # Log this for manual cleanup later
            logger.critical(f"MANUAL CLEANUP NEEDED: Orphaned vectors in Qdrant for chat_id: {chat_id}")
        
        raise HTTPException(
            status_code=500, 
            detail="File storage upload failed. Vector data has been cleaned up."
        )


    # ✅ STEP 4: Update chat metadata ONLY after both uploads succeed
    try:
        update_response = supabase.table("chats").update({
            "file_url": file_url,
            "file_name": file.filename
        }).eq("id", chat_id).execute()
        logger.info(f"Chat {chat_id} updated with file_url and file_name.")
    except Exception as e:
        logger.error(f"Chat update failed: {e}")
        # Both uploads succeeded but metadata update failed
        logger.warning("File uploads succeeded but chat metadata update failed")
        raise HTTPException(status_code=500, detail="Error updating chat metadata.")

    return {
        "message": f"Successfully uploaded and indexed {len(chunks)} chunks for chat {chat_id}.",
        "file_url": file_url
    }
