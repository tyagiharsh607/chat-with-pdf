import pandas as pd
from PyPDF2 import PdfReader
import io
from app.supabase_client import supabase
from app.qdrant_client import qdrant
from app.qdrant_client import COLLECTION_NAME
import uuid
from qdrant_client import models
from typing import Optional
import time


def chunk_text(text: str, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks


async def read_file_content(file):
    filename = file.filename.lower()

    if filename.endswith(".pdf"):
        reader = PdfReader(file.file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    elif filename.endswith(".txt"):
        content = await file.read()
        return content.decode("utf-8")

    elif filename.endswith(".csv"):
        file.file.seek(0)
        decoded = file.file.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(decoded))
        return _convert_dataframe_to_text(df)

    elif filename.endswith(".xlsx"):
        file.file.seek(0)
        df = pd.read_excel(file.file)
        return _convert_dataframe_to_text(df)
    else:
        raise ValueError("Only PDF, TXT, CSV, and XLSX files are supported.")




async def upload_to_supabase_storage(file, chat_id: str) -> str:
    filename = f"{chat_id}/{uuid.uuid4()}_{file.filename}"
    content = await file.read()

    try:
        supabase.storage.from_("documents").upload(filename, content, file_options={"content-type": file.content_type})
    except Exception as e:
        raise Exception(f"Supabase upload failed: {str(e)}")

    url = supabase.storage.from_("documents").get_public_url(filename)
    return url



def _convert_dataframe_to_text(df: pd.DataFrame):
    rows = []
    for i, row in df.iterrows():
        sentence = ", ".join(f"{col}: {val}" for col, val in row.items())
        rows.append(f"Row {i + 1}: {sentence}")
    return "\n".join(rows)





def extract_filename_from_url(file_url: str) -> Optional[str]:
    """
    Extract the storage filename from Supabase public URL
    URL format: https://xxx.supabase.co/storage/v1/object/public/documents/chat_id/uuid_filename.ext
    """
    try:
        if not file_url:
            return None
            
        # Split URL and get the path after 'documents/'
        parts = file_url.split('/storage/v1/object/public/documents/')
        if len(parts) > 1:
            # Get everything after 'documents/' (this is the filename in storage)
            filename = parts[1]
            filename = filename.split('?')[0]

            return filename
        return None
    except Exception as e:

        return None


def delete_file_and_chunks(file_url: str, chat_id: str):
    """
    Delete file from Supabase Storage and associated chunks from Qdrant
    
    Args:
        supabase: Supabase client instance
        qdrant_client: Qdrant client instance
        file_url: URL of the file to delete
        chat_id: Chat ID to delete chunks for
    
    Returns:
        dict: Status of deletion operations
    """
    results = {
        "file_deleted": False,
        "chunks_deleted": False,
        "errors": []
    }
    
    # Step 1: Delete file from Supabase Storage
    if file_url:
        try:
            filename = extract_filename_from_url(file_url)
            if filename:
                supabase.storage.from_("documents").remove([filename])
                results["file_deleted"] = True

            else:
                results["errors"].append("Could not extract filename from URL")
        except Exception as e:
            error_msg = f"Failed to delete file from storage: {e}"
            results["errors"].append(error_msg)

    
    # Step 2: Delete chunks from Qdrant
    max_retries = 3
    for attempt in range(max_retries):
        try:
            qdrant.delete(
                collection_name="text_chunks",
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
            results["chunks_deleted"] = True

            break
        except Exception as e:
            if attempt == max_retries - 1:  # Last attempt
                error_msg = f"Failed to delete chunks from Qdrant after {max_retries} attempts: {e}"
                results["errors"].append(error_msg)

            else:

                time.sleep(1)  # Wait 1 second before retry
    
    return results
